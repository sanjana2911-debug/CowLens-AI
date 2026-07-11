/**
 * Roboflow Classification Service
 *
 * Communicates with the Roboflow Serverless API for cow disease classification.
 */
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ROBOFLOW_API_KEY;
const WORKSPACE = process.env.ROBOFLOW_WORKSPACE;
const MODEL_NAME = process.env.ROBOFLOW_MODEL_NAME;
const WORKFLOW_ID = process.env.ROBOFLOW_WORKFLOW_ID;
const REQUEST_TIMEOUT = parseInt(process.env.ROBOFLOW_REQUEST_TIMEOUT || '30000', 10);

const WORKFLOW_URL = `https://api.roboflow.com/v1/${WORKSPACE}/workflows/${WORKFLOW_ID}/sync`;
const INFERENCE_URL = `https://classify.roboflow.com/${WORKSPACE}/${MODEL_NAME}`;

function imageToBase64DataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const mime = mimeMap[ext] || 'image/jpeg';
  const raw = fs.readFileSync(filePath);
  return `data:${mime};base64,${raw.toString('base64')}`;
}

function bufferToBase64(buffer) {
  return buffer.toString('base64');
}

function extractConfidence(prediction) {
  if (typeof prediction === 'number') return prediction;
  if (typeof prediction.confidence === 'number') return prediction.confidence;
  if (typeof prediction.probability === 'number') return prediction.probability;
  if (typeof prediction.score === 'number') return prediction.score;
  return 0;
}

const detectDiseases = async (image, filename = 'cow_image.jpg') => {
  if (!API_KEY) {
    throw new Error('ROBOFLOW_API_KEY is not configured in environment variables.');
  }
  if (!WORKSPACE) {
    throw new Error('ROBOFLOW_WORKSPACE is not configured in environment variables.');
  }

  let imageBase64;
  let imageMime = 'image/jpeg';

  try {
    if (Buffer.isBuffer(image)) {
      imageBase64 = bufferToBase64(image);
      const ext = path.extname(filename).toLowerCase().replace('.', '');
      if (ext === 'png') imageMime = 'image/png';
      else if (ext === 'webp') imageMime = 'image/webp';
    } else if (typeof image === 'string' && fs.existsSync(image)) {
      const ext = path.extname(image).toLowerCase().replace('.', '');
      if (ext === 'png') imageMime = 'image/png';
      else if (ext === 'webp') imageMime = 'image/webp';
      imageBase64 = imageToBase64DataUri(image);
    } else {
      throw new Error(`Invalid image input: must be a Buffer or a valid file path. Got: ${typeof image}`);
    }
  } catch (error) {
    throw new Error(`Failed to process image: ${error.message}`);
  }

  try {
    let predictions = [];
    let imageWidth = 0;
    let imageHeight = 0;

    const formData = new FormData();
    const bufferData = Buffer.isBuffer(image) ? image : fs.readFileSync(image);
    formData.append('file', bufferData, {
      filename,
      contentType: imageMime,
    });

    const response = await axios.post(
      `${INFERENCE_URL}?api_key=${API_KEY}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: REQUEST_TIMEOUT,
      },
    );

    predictions = extractInferencePredictions(response.data);
    imageWidth = response.data.image?.width || 0;
    imageHeight = response.data.image?.height || 0;

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
      imageWidth,
      imageHeight,
      totalDetections: detections.length,
    };
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(`Roboflow API error: ${error.response.data.message}`);
    }
    if (error.response?.data?.error) {
      throw new Error(`Roboflow API error: ${error.response.data.error}`);
    }
    throw new Error(`Roboflow classification failed: ${error.message}`);
  }
};

function extractInferencePredictions(data) {
  const predictionsSource = data?.predictions || data?.result?.predictions || [];

  if (Array.isArray(predictionsSource)) {
    return predictionsSource.map(normalisePrediction);
  }

  if (typeof predictionsSource === 'object' && predictionsSource !== null) {
    return Object.entries(predictionsSource).map(([cls, conf]) => ({
      class: cls,
      confidence: typeof conf === 'number' ? conf : extractConfidence(conf),
    }));
  }

  if (Array.isArray(data?.predicted_classes)) {
    return data.predicted_classes.map((cls) => ({
      class: cls,
      confidence: 1.0,
    }));
  }

  return [];
}

function normalisePrediction(p) {
  if (typeof p === 'string') {
    return { class: p, confidence: 1.0 };
  }

  const cls = p.class || p.class_name || p.label || p.disease || p.predicted_class || 'Unknown';
  const confidence = extractConfidence(p);

  return { class: cls, confidence };
}

const checkServiceHealth = async () => {
  if (!API_KEY || !WORKSPACE) {
    return {
      status: 'unhealthy',
      service: 'roboflow-classification',
      error: 'Missing ROBOFLOW_API_KEY or ROBOFLOW_WORKSPACE',
    };
  }

  try {
    await axios.get(
      `https://api.roboflow.com/v1/workspaces/${WORKSPACE}?api_key=${API_KEY}`,
      { timeout: 5000 },
    );
    return {
      status: 'healthy',
      service: 'roboflow-classification',
      workspace: WORKSPACE,
      workflow: WORKFLOW_ID || '(using standard inference)',
      message: 'Roboflow API key is valid',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      service: 'roboflow-classification',
      error: error.response?.data?.message || error.message,
    };
  }
};

const getModelInfo = async () => {
  if (!API_KEY) {
    throw new Error('ROBOFLOW_API_KEY is not configured');
  }

  try {
    if (WORKFLOW_ID) {
      return {
        success: true,
        data: {
          model_type: 'Roboflow ViT Classification (Workflow)',
          workspace: WORKSPACE,
          workflow_id: WORKFLOW_ID,
          task: 'classify',
        },
      };
    }

    const response = await axios.get(
      `https://api.roboflow.com/v1/workspaces/${WORKSPACE}?api_key=${API_KEY}`,
      { timeout: 5000 },
    );
    return {
      success: true,
      data: {
        model_type: 'Roboflow ViT Classification',
        workspace: WORKSPACE,
        task: 'classify',
        ...response.data,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get Roboflow model info: ${error.message}`);
  }
};

module.exports = {
  detectDiseases,
  checkServiceHealth,
  getModelInfo,
};