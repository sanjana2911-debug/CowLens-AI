/**
 * Test Script for Image Diagnosis Endpoint
 * 
 * This script tests the /api/diagnoses/ai-detect-image endpoint directly
 * to capture exact errors and verify the pipeline works.
 * 
 * Usage:
 * 1. Start backend: npm start
 * 2. Login and get token from browser localStorage
 * 3. Run: node test-image-diagnosis.js <token> <path/to/image.jpg>
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';
const token = process.argv[2];
const imagePath = process.argv[3];

if (!token) {
  console.error('❌ Error: Token required');
  console.log('Usage: node test-image-diagnosis.js <token> <image-path>');
  console.log('\nTo get token:');
  console.log('1. Login in browser');
  console.log('2. Open DevTools Console');
  console.log('3. Run: localStorage.getItem("token")');
  process.exit(1);
}

if (!imagePath || !fs.existsSync(imagePath)) {
  console.error('❌ Error: Image file not found:', imagePath);
  process.exit(1);
}

console.log('🧪 Testing Image Diagnosis Endpoint');
console.log('=====================================');
console.log('API URL:', API_URL);
console.log('Endpoint:', `${API_URL}/diagnoses/ai-detect-image`);
console.log('Image:', imagePath);
console.log('Token:', token.slice(0, 20) + '...');
console.log('');

async function testImageDiagnosis() {
  try {
    // Prepare form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('symptoms', 'Testing image diagnosis');
    
    console.log('📤 Sending request...');
    console.log('Headers:');
    console.log('  Authorization: Bearer', token.slice(0, 20) + '...');
    console.log('  Content-Type: multipart/form-data');
    console.log('');
    
    const startTime = Date.now();
    
    const response = await axios.post(
      `${API_URL}/diagnoses/ai-detect-image`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000, // 60 second timeout for Roboflow API
      }
    );
    
    const duration = Date.now() - startTime;
    
    console.log('✅ SUCCESS!');
    console.log('===========');
    console.log('Status:', response.status);
    console.log('Duration:', duration + 'ms');
    console.log('');
    console.log('Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      console.log('');
      console.log('📊 Detection Results:');
      console.log('  Detected Diseases:', response.data.data.yoloDetection?.detectedDiseases || []);
      console.log('  Confidence:', response.data.data.yoloDetection?.confidence + '%');
      console.log('  Total Detections:', response.data.data.yoloDetection?.totalDetections);
      
      if (response.data.data.combinedAnalysis) {
        console.log('');
        console.log('🔬 Combined Analysis:');
        console.log('  Health Score:', response.data.data.combinedAnalysis.healthScore);
        console.log('  Possible Diseases:', response.data.data.combinedAnalysis.possibleDiseases?.length || 0);
      }
    }
    
  } catch (error) {
    console.log('❌ FAILED!');
    console.log('===========');
    console.log('');
    
    if (error.response) {
      // Server responded with error status
      console.log('HTTP Status:', error.response.status);
      console.log('');
      console.log('Response Headers:');
      Object.entries(error.response.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      console.log('');
      console.log('Response Body:');
      console.log(JSON.stringify(error.response.data, null, 2));
      
      // Analyze the error
      if (error.response.status === 404) {
        console.log('');
        console.log('🔍 Analysis: 404 Not Found');
        console.log('  - Route does not exist at this URL');
        console.log('  - Check backend route registration');
        console.log('  - Check VITE_API_URL in client/.env');
      } else if (error.response.status === 401) {
        console.log('');
        console.log('🔍 Analysis: 401 Unauthorized');
        console.log('  - Token is invalid or expired');
        console.log('  - Check Authorization header');
      } else if (error.response.status === 400) {
        console.log('');
        console.log('🔍 Analysis: 400 Bad Request');
        console.log('  - Check request payload');
        console.log('  - Check file upload field name (should be "image")');
      } else if (error.response.status === 500) {
        console.log('');
        console.log('🔍 Analysis: 500 Internal Server Error');
        console.log('  - Check backend logs for stack trace');
        console.log('  - Check Roboflow API configuration');
      }
    } else if (error.request) {
      // Request made but no response
      console.log('❌ No response received from server');
      console.log('Error:', error.message);
      console.log('');
      console.log('🔍 Analysis:');
      console.log('  - Backend may not be running');
      console.log('  - Network connectivity issue');
      console.log('  - CORS error');
    } else {
      // Error in request setup
      console.log('❌ Request setup error:');
      console.log('Error:', error.message);
    }
    
    console.log('');
    console.log('Full Error:');
    console.log(error);
  }
}

testImageDiagnosis();