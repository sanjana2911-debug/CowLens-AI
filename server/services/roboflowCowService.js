/**
 * Roboflow Cattle Detection Service
 *
 * Calls the Roboflow Serverless Workflow API to verify that an uploaded
 * image contains a cow using a dedicated cattle detection workflow.
 *
 * This is a separate service from the disease detection workflow.
 * It only checks "is this a cow?" — not disease classification.
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ROBOFLOW_API_KEY;
const WORKSPACE = process.env.ROBOFLOW_WORKSPACE || 'sanjanas-workspace-eh6nz';
const WORKFLOW_ID = process.env.ROBOFLOW_CATTLE_WORKFLOW_ID || 'cattle-detection-vcattle-detection-tkt5a-7qa3o-1-yolo11n-t1-logic';
const REQUEST_TIMEOUT = parseInt(process.env.ROBOFLOW_REQUEST_TIMEOUT || '30000', 10);

// Serverless Workflow endpoint
const WORKFLOW_URL = `https://serverless.roboflow.com/${WORKSPACE}/workflows/${WORKFLOW_ID}`;

/**
 * Normalise a single prediction object into { class, confidence }.
 * confidence is returned as a percentage (0-100) rounded to 2 decimal places.
 *
 * Supports:
 *   { class: "Cow", confidence: 0.8738 }
 *   { class_name: "Cow", confidence: 0.8738 }
 *   { label: "Cow", confidence: 0.8738 }
 *   { class: "Cow", score: 0.8738 }
 *   { "class": "Cow", "confidence": 87.38 }  (already percentage)
 */
function normalisePrediction(pred) {
  // Class name: try common field names
  const className = pred.class || pred.class_name || pred.label || pred.predicted_class || 'Unknown';

  // Confidence: try common field names, then convert to percentage if needed
  let conf = 0;
  if (typeof pred.confidence === 'number') {
    conf = pred.confidence;
  } else if (typeof pred.score === 'number') {
    conf = pred.score;
  } else if (typeof pred.probability === 'number') {
    conf = pred.probability;
  }

  // Convert to percentage if value is 0-1 (decimal format)
  // Values > 1 are already percentages
  if (conf > 0 && conf <= 1) {
    conf = conf * 100;
  }

  return {
    class: className,
    confidence: Math.round(conf * 100) / 100,
  };
}

/**
 * Extract predictions from the Serverless Workflow response.
 *
 * Supported Roboflow response formats (all handled):
 *
 * FORMAT 1 (NEW - object detection, current):
 *   {
 *     "outputs": [
 *       {
 *         "predictions": {
 *           "image": {...},
 *           "predictions": [
 *             { "class": "Cow", "confidence": 0.8738 }
 *           ]
 *         }
 *       }
 *     ]
 *   }
 *   Path: outputs[0].predictions.predictions[]
 *
 * FORMAT 2 (OLD - classification via model_output):
 *   {
 *     "outputs": [
 *       {
 *         "model_output": {
 *           "predictions": [
 *             { "class": "healthy", "confidence": 0.9978 }
 *           ],
 *           "top": "healthy",
 *           "confidence": 0.9978
 *         }
 *       }
 *     ]
 *   }
 *   Path: outputs[0].model_output.predictions[]
 *   Path: outputs[0].model_output.top + outputs[0].model_output.confidence
 *
 * FORMAT 3 (direct predictions array):
 *   {
 *     "predictions": [
 *       { "class": "Cow", "confidence": 0.8738 }
 *     ]
 *   }
 *   Path: response.predictions[]
 *
 * FORMAT 4 (object-of-objects):
 *   {
 *     "predictions": {
 *       "Cow": 0.8738,
 *       "person": 0.1234
 *     }
 *   }
 *   Path: Object.entries(response.predictions)
 *
 * FORMAT 5 (predicted_classes array):
 *   {
 *     "predicted_classes": ["Cow", "person"]
 *   }
 *   Path: response.predicted_classes[]
 *
 * FORMAT 6 (outputs[].predictions.top — classification new format):
 *   {
 *     "outputs": [
 *       {
 *         "predictions": {
 *           "top": "Cow",
 *           "confidence": 0.8738
 *         }
 *       }
 *     ]
 *   }
 *   Path: outputs[0].predictions.top + outputs[0].predictions.confidence
 */
function extractCowPredictions(responseData) {
  const predictions = [];

  // === Handle outputs array (Formats 1, 2, 6) ===
  const outputs = responseData?.outputs;
  if (Array.isArray(outputs)) {
    for (const output of outputs) {
      if (!output) continue;

      // FORMAT 1: output.predictions.predictions[] (NEW object detection format)
      //   output.predictions = { image: ..., predictions: [{ class, confidence }] }
      if (output.predictions?.predictions && Array.isArray(output.predictions.predictions)) {
        for (const pred of output.predictions.predictions) {
          predictions.push(normalisePrediction(pred));
        }
        // If we got predictions here, return them immediately (most specific match)
        if (predictions.length > 0) return predictions;
      }

      // FORMAT 6: output.predictions.top (classification via predictions.top)
      //   output.predictions = { top: "Cow", confidence: 0.8738 }
      if (output.predictions?.top && predictions.length === 0) {
        predictions.push({
          class: output.predictions.top,
          confidence: normalisePrediction({ confidence: output.predictions.confidence }).confidence,
        });
      }

      // FORMAT 2: output.model_output.predictions[] (OLD classification format)
      //   output.model_output = { predictions: [{ class, confidence }] }
      if (output.model_output?.predictions && Array.isArray(output.model_output.predictions)) {
        for (const pred of output.model_output.predictions) {
          predictions.push(normalisePrediction(pred));
        }
        if (predictions.length > 0) return predictions;
      }

      // FORMAT 2 (fallback): output.model_output.top (classification via model_output.top)
      //   output.model_output = { top: "Cow", confidence: 0.8738 }
      if (output.model_output?.top && predictions.length === 0) {
        predictions.push({
          class: output.model_output.top,
          confidence: normalisePrediction({ confidence: output.model_output.confidence }).confidence,
        });
      }
    }
    // If we found predictions in any output format, return them
    if (predictions.length > 0) return predictions;
  }

  // === FORMAT 3: Direct predictions array ===
  //   response.predictions = [ { class: "Cow", confidence: 0.8738 } ]
  if (Array.isArray(responseData?.predictions)) {
    for (const pred of responseData.predictions) {
      predictions.push(normalisePrediction(pred));
    }
    if (predictions.length > 0) return predictions;
  }

  // === FORMAT 4: Object-of-objects ===
  //   response.predictions = { "Cow": 0.8738, "person": 0.1234 }
  if (typeof responseData?.predictions === 'object' && responseData.predictions !== null && !Array.isArray(responseData.predictions)) {
    for (const [cls, value] of Object.entries(responseData.predictions)) {
      if (typeof value === 'number') {
        predictions.push({
          class: cls,
          confidence: value > 1 ? Math.round(value * 100) / 100 : Math.round(value * 10000) / 100,
        });
      } else if (value && typeof value === 'object') {
        predictions.push(normalisePrediction(value));
      }
    }
    if (predictions.length > 0) return predictions;
  }

  // === FORMAT 5: predicted_classes array ===
  //   response.predicted_classes = ["Cow", "person"]
  if (Array.isArray(responseData?.predicted_classes)) {
    for (const cls of responseData.predicted_classes) {
      predictions.push({ class: cls, confidence: 100 });
    }
    return predictions;
  }

  return predictions;
}

/**
 * Detect whether an uploaded image contains a cow using the
 * Roboflow cattle detection workflow.
 *
 * @param {string} imagePath - Local file path to the uploaded image
 * @returns {Promise<{isCow: boolean, confidence: number, predictions: Array}>}
 */
const detectCattle = async (imagePath) => {
  // --- Validate inputs ---
  if (!imagePath) {
    throw new Error('Image path is required for cattle detection');
  }

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found at path: ${imagePath}`);
  }

  if (!API_KEY) {
    throw new Error('ROBOFLOW_API_KEY is not configured in environment variables.');
  }

  // --- Read image and encode to base64 ---
  let buffer;
  try {
    buffer = fs.readFileSync(imagePath);
  } catch (error) {
    throw new Error(`Failed to read image file: ${error.message}`);
  }

  const base64 = buffer.toString('base64');

  // --- Call Roboflow Serverless Workflow API ---
  let response;
  try {
    const payload = {
      api_key: API_KEY,
      inputs: {
        image: base64,
      },
      use_cache: true,
    };

    console.log('[RoboflowCow] Calling Roboflow Cattle Detection Workflow...');
    console.log(`[RoboflowCow] URL: ${WORKFLOW_URL}`);
    console.time('cattle-detection-request');

    response = await axios.post(WORKFLOW_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: REQUEST_TIMEOUT,
    });

    console.timeEnd('cattle-detection-request');
    console.log(`[RoboflowCow] Response status: ${response.status}`);
    console.log(`[RoboflowCow] Raw response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(
        `Roboflow Cattle Detection Workflow not found at ${WORKFLOW_URL}. ` +
        `Check ROBOFLOW_CATTLE_WORKFLOW_ID.`
      );
    }
    if (error.response?.status === 500) {
      const msg = error.response?.data?.message || '';
      const errorType = error.response?.data?.error_type || '';
      throw new Error(
        `Roboflow Cattle Detection Workflow error: ${msg} (type: ${errorType}).`
      );
    }
    if (error.response?.data?.message) {
      throw new Error(`Roboflow API error: ${error.response.data.message}`);
    }
    if (error.response?.data?.error) {
      throw new Error(`Roboflow API error: ${error.response.data.error}`);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Roboflow cattle detection request timed out after ${REQUEST_TIMEOUT}ms.`);
    }
    throw new Error(`Roboflow cattle detection request failed: ${error.message}`);
  }

  // --- Extract predictions ---
  const predictions = extractCowPredictions(response.data);

  console.log(`[RoboflowCow] Parsed predictions: ${JSON.stringify(predictions)}`);

  // --- Determine if a cow was detected ---
  // Look for any prediction with class name "cow" (case-insensitive)
  const cowPredictions = predictions.filter(p =>
    p.class.toLowerCase() === 'cow'
  );

  const isCow = cowPredictions.length > 0;
  const confidence = cowPredictions.length > 0
    ? Math.max(...cowPredictions.map(p => p.confidence))
    : 0;

  console.log(`[RoboflowCow] Result: isCow=${isCow}, confidence=${confidence}%`);
  if (isCow) {
    console.log(`[RoboflowCow] Cow detected with ${confidence}% confidence`);
  } else {
    console.log(`[RoboflowCow] No cow detected in image`);
    if (predictions.length > 0) {
      console.log(`[RoboflowCow] Other objects detected: ${predictions.map(p => `${p.class}(${p.confidence}%)`).join(', ')}`);
    }
  }

  return {
    isCow,
    confidence,
    predictions,
  };
};

module.exports = {
  detectCattle,
};