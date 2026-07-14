/**
 * Roboflow Serverless Workflow Service
 *
 * Communicates with the Roboflow Serverless Workflow API for cow disease classification.
 * Uses the serverless.roboflow.com endpoint with JSON body format.
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ROBOFLOW_API_KEY;
const WORKSPACE = process.env.ROBOFLOW_WORKSPACE;
const WORKFLOW_ID = process.env.ROBOFLOW_WORKFLOW_ID;
const REQUEST_TIMEOUT = parseInt(process.env.ROBOFLOW_REQUEST_TIMEOUT || '30000', 10);

// Serverless Workflow endpoint (Python SDK format)
const WORKFLOW_URL = `https://serverless.roboflow.com/${WORKSPACE}/workflows/${WORKFLOW_ID}`;

/**
 * Reads an image file and returns a buffer with its MIME type.
 */
function resolveImageInput(image, filename) {
  let buffer;
  let mime = 'image/jpeg';

  if (Buffer.isBuffer(image)) {
    buffer = image;
    const ext = path.extname(filename || 'image.jpg').toLowerCase().replace('.', '');
    if (ext === 'png') mime = 'image/png';
    else if (ext === 'webp') mime = 'image/webp';
  } else if (typeof image === 'string') {
    if (!fs.existsSync(image)) {
      throw new Error(`Image file not found at path: ${image}`);
    }
    buffer = fs.readFileSync(image);
    const ext = path.extname(image).toLowerCase().replace('.', '');
    if (ext === 'png') mime = 'image/png';
    else if (ext === 'webp') mime = 'image/webp';
  } else {
    throw new Error(`Invalid image input: must be a Buffer or a valid file path. Got: ${typeof image}`);
  }

  return { buffer, mime };
}

/**
 * Extracts a numeric confidence value from a prediction entry.
 */
function extractConfidence(prediction) {
  if (typeof prediction === 'number') return prediction;
  if (typeof prediction.confidence === 'number') return prediction.confidence;
  if (typeof prediction.probability === 'number') return prediction.probability;
  if (typeof prediction.score === 'number') return prediction.score;
  return 0;
}

/**
 * Normalises a single prediction object into { class, confidence }.
 */
function normalisePrediction(p) {
  if (typeof p === 'string') {
    return { class: p, confidence: 1.0 };
  }
  const cls = p.class || p.class_name || p.label || p.disease || p.predicted_class || 'Unknown';
  const confidence = extractConfidence(p);
  return { class: cls, confidence };
}

/**
 * Extracts predictions from the Serverless Workflow response.
 *
 * The workflow returns an array with model_output objects:
 * [
 *   {
 *     "model_output": {
 *       "predictions": [
 *         { "class": "healthy", "confidence": 0.9978 },
 *         { "class": "lumpy_skin_disease", "confidence": 0.9921 }
 *       ],
 *       "top": "healthy",
 *       "confidence": 0.9978
 *     }
 *   }
 * ]
 */
function extractWorkflowPredictions(responseData) {
  // --- Handle outputs array with model_output (CURRENT WORKFLOW FORMAT) ---
  // response.data = { outputs: [ { model_output: { predictions: [...], top: "...", confidence: N } } ] }
  const outputs = responseData?.outputs;
  if (Array.isArray(outputs)) {
    const allPredictions = [];
    for (const output of outputs) {
      // Primary: outputs[].model_output.predictions[]
      if (output?.model_output?.predictions && Array.isArray(output.model_output.predictions)) {
        for (const pred of output.model_output.predictions) {
          allPredictions.push(normalisePrediction(pred));
        }
      }
      // Fallback: outputs[].model_output.top + confidence
      if (output?.model_output?.top && allPredictions.length === 0) {
        allPredictions.push({
          class: output.model_output.top,
          confidence: output.model_output.confidence || 1.0,
        });
      }
      // Legacy: outputs[].predictions[]
      if (Array.isArray(output?.predictions)) {
        for (const pred of output.predictions) {
          allPredictions.push(normalisePrediction(pred));
        }
      }
      // Legacy: outputs[].result.predictions[]
      if (output?.result?.predictions && Array.isArray(output.result.predictions)) {
        for (const pred of output.result.predictions) {
          allPredictions.push(normalisePrediction(pred));
        }
      }
    }
    if (allPredictions.length > 0) return allPredictions;
  }

  // --- Handle direct array response (older format when response.data is an array) ---
  if (Array.isArray(responseData)) {
    const allPredictions = [];
    for (const item of responseData) {
      if (item?.model_output?.predictions && Array.isArray(item.model_output.predictions)) {
        for (const pred of item.model_output.predictions) {
          allPredictions.push(normalisePrediction(pred));
        }
      }
      if (item?.model_output?.top && allPredictions.length === 0) {
        allPredictions.push({
          class: item.model_output.top,
          confidence: item.model_output.confidence || 1.0,
        });
      }
    }
    if (allPredictions.length > 0) return allPredictions;
  }

  // --- Handle direct predictions array ---
  if (Array.isArray(responseData?.predictions)) {
    return responseData.predictions.map(normalisePrediction);
  }

  // --- Handle nested under result ---
  if (responseData?.result?.predictions && Array.isArray(responseData.result.predictions)) {
    return responseData.result.predictions.map(normalisePrediction);
  }

  // --- Handle object-of-objects ---
  if (typeof responseData?.predictions === 'object' && responseData.predictions !== null && !Array.isArray(responseData.predictions)) {
    return Object.entries(responseData.predictions).map(([cls, conf]) => ({
      class: cls,
      confidence: typeof conf === 'number' ? conf : extractConfidence(conf),
    }));
  }

  // --- Handle predicted_classes array ---
  if (Array.isArray(responseData?.predicted_classes)) {
    return responseData.predicted_classes.map((cls) => ({
      class: cls,
      confidence: 1.0,
    }));
  }

  return [];
}

/**
 * Detect diseases in a cow image using the Roboflow Serverless Workflow API.
 *
 * @param {Buffer|string} image - Image buffer or file path
 * @param {string} [filename='cow_image.jpg'] - Original filename
 * @returns {Promise<Object>} Detection result
 */
const detectDiseases = async (image, filename = 'cow_image.jpg') => {
  // --- Validate environment ---
  if (!API_KEY) {
    throw new Error('ROBOFLOW_API_KEY is not configured in environment variables.');
  }
  if (!WORKSPACE) {
    throw new Error('ROBOFLOW_WORKSPACE is not configured in environment variables.');
  }
  if (!WORKFLOW_ID) {
    throw new Error('ROBOFLOW_WORKFLOW_ID is not configured. Set it in server/.env');
  }

  // --- Resolve image to buffer + base64 ---
  let buffer, mime;
  try {
    const resolved = resolveImageInput(image, filename);
    buffer = resolved.buffer;
    mime = resolved.mime;
  } catch (error) {
    throw new Error(`Failed to read image: ${error.message}`);
  }

  const base64 = buffer.toString('base64');

  // --- Call Roboflow Serverless Workflow API ---
  let response;
  try {
    const payload = {
      api_key: API_KEY,
      inputs: {
        image: base64,
        confidence: 0.5,
      },
      use_cache: true,
    };

    console.log("========== ROBOFLOW RAW RESPONSE ==========");
    response = await axios.post(WORKFLOW_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: REQUEST_TIMEOUT,
    });
    console.log(JSON.stringify(response.data, null, 2));
    console.log("===========================================");
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(
        `Roboflow Workflow not found at ${WORKFLOW_URL}. Check that ROBOFLOW_WORKFLOW_ID is correct.`
      );
    }
    if (error.response?.status === 500) {
      // Workflow compilation error - likely a workflow config issue on Roboflow
      const msg = error.response?.data?.message || '';
      const errorType = error.response?.data?.error_type || '';
      throw new Error(
        `Roboflow Workflow error: ${msg} (type: ${errorType}). ` +
        `This is a workflow configuration issue on Roboflow's side. ` +
        `Check the workflow's inner model step parameter bindings.`
      );
    }
    if (error.response?.data?.message) {
      throw new Error(`Roboflow API error: ${error.response.data.message}`);
    }
    if (error.response?.data?.error) {
      throw new Error(`Roboflow API error: ${error.response.data.error}`);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Roboflow request timed out after ${REQUEST_TIMEOUT}ms.`);
    }
    throw new Error(`Roboflow API request failed: ${error.message}`);
  }

  // --- Parse workflow response ---
  let predictions;
  try {
    predictions = extractWorkflowPredictions(response.data);
  } catch (parseError) {
    throw new Error(`Failed to parse Roboflow response: ${parseError.message}`);
  }

  if (!Array.isArray(predictions) || predictions.length === 0) {
    return {
      detectedDiseases: [],
      confidence: 0,
      detections: [],
      boundingBoxes: [],
      annotatedImageUrl: '',
      imageWidth: 0,
      imageHeight: 0,
      totalDetections: 0,
    };
  }

  // --- Build response for diagnosisController.js ---
  const detections = predictions.map((p) => ({
    disease: p.class,
    confidence: Math.round(p.confidence * 10000) / 100,
  }));

  detections.sort((a, b) => b.confidence - a.confidence);
  const topConfidence = detections.length > 0 ? detections[0].confidence : 0;

  return {
    detectedDiseases: detections.map((d) => d.disease),
    confidence: topConfidence,
    detections,
    boundingBoxes: [],
    annotatedImageUrl: '',
    imageWidth: 0,
    imageHeight: 0,
    totalDetections: detections.length,
  };
};

/**
 * Check whether the Roboflow Workflow service is reachable.
 */
const checkServiceHealth = async () => {
  const errors = [];
  if (!API_KEY) errors.push('ROBOFLOW_API_KEY is missing');
  if (!WORKSPACE) errors.push('ROBOFLOW_WORKSPACE is missing');
  if (!WORKFLOW_ID) errors.push('ROBOFLOW_WORKFLOW_ID is missing');

  if (errors.length > 0) {
    return { status: 'unhealthy', service: 'roboflow-workflow', error: errors.join('; ') };
  }

  try {
    await axios.post(
      WORKFLOW_URL,
      { api_key: API_KEY, inputs: { image: '' }, use_cache: true },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    return {
      status: 'healthy',
      service: 'roboflow-workflow',
      workspace: WORKSPACE,
      workflow_id: WORKFLOW_ID,
      message: 'Roboflow Serverless Workflow is reachable',
    };
  } catch (error) {
    if (error.response?.status === 500) {
      // Workflow responds, just has config issues
      return {
        status: 'degraded',
        service: 'roboflow-workflow',
        workspace: WORKSPACE,
        workflow_id: WORKFLOW_ID,
        message: 'Workflow reachable but has configuration errors',
        detail: error.response?.data?.message || error.message,
      };
    }
    return {
      status: 'unhealthy',
      service: 'roboflow-workflow',
      error: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get information about the configured Roboflow Workflow.
 */
const getModelInfo = async () => {
  if (!API_KEY) {
    throw new Error('ROBOFLOW_API_KEY is not configured.');
  }
  if (!WORKFLOW_ID) {
    throw new Error('ROBOFLOW_WORKFLOW_ID is not configured.');
  }

  return {
    success: true,
    data: {
      service_type: 'Roboflow Serverless Workflow',
      api_url: 'https://serverless.roboflow.com',
      workspace: WORKSPACE,
      workflow_id: WORKFLOW_ID,
      task: 'classify',
      endpoint: 'workflow/sync',
    },
  };
};

module.exports = {
  detectDiseases,
  checkServiceHealth,
  getModelInfo,
};