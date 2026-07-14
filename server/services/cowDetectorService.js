/**
 * Cow Detector Service
 *
 * Calls the Python FastAPI AI service to verify that an uploaded image
 * actually contains a cow before proceeding with disease classification.
 *
 * Endpoint: POST /detect-cow (multipart/form-data with image field)
 */
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const REQUEST_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || '15000', 10);

/**
 * Check if the uploaded image contains a cow.
 *
 * @param {string} imagePath - Local file path to the uploaded image
 * @returns {Promise<{isCow: boolean, confidence: number}>}
 */
const detectCow = async (imagePath) => {
  if (!imagePath) {
    throw new Error('Image path is required for cow detection');
  }

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found at path: ${imagePath}`);
  }

  const url = `${AI_SERVICE_URL}/detect-cow`;

  try {
    // Create multipart form data with the image file
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath), {
      filename: 'cow_image.jpg',
      contentType: 'image/jpeg',
    });

    console.log(`[CowDetector] POST ${url} — sending image...`);
    console.time('cow-detection-request');

    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: REQUEST_TIMEOUT,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      transitional: {
        clarifyTimeoutError: true,
      },
    });

    console.timeEnd('cow-detection-request');
    console.log(`[CowDetector] Response status: ${response.status}`);
    console.log(`[CowDetector] Response data: ${JSON.stringify(response.data, null, 2)}`);

    const data = response.data;

    if (!data || !data.success) {
      throw new Error('Cow detection service returned an unsuccessful response');
    }

    console.log(`[CowDetector] Result: isCow=${data.isCow}, confidence=${data.confidence}`);
    return {
      isCow: data.isCow === true,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0,
    };
  } catch (error) {
    // Handle axios-specific errors
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || error.response.data?.message || 'Unknown error';

      if (status === 400) {
        throw new Error(`Cow detection failed: ${detail}`);
      }
      if (status === 500) {
        throw new Error(`AI service error: ${detail}`);
      }
      throw new Error(`Cow detection service returned status ${status}: ${detail}`);
    }

    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        `Cannot connect to AI service at ${AI_SERVICE_URL}. ` +
        'Make sure the Python AI service is running (cd ai-service && python app.py)'
      );
    }

    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      console.error(`[CowDetector] TIMEOUT after ${REQUEST_TIMEOUT}ms`);
      console.error(`[CowDetector] URL: ${url}`);
      console.error(`[CowDetector] System hostname: ${require('os').hostname()}`);
      throw new Error(`Cow detection request timed out after ${REQUEST_TIMEOUT}ms`);
    }

    // Re-throw if it's already one of our custom errors
    if (error.message.startsWith('Cow detection failed') || error.message.startsWith('AI service error')) {
      throw error;
    }

    throw new Error(`Cow detection request failed: ${error.message}`);
  }
};

module.exports = {
  detectCow,
};