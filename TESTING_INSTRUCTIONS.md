# CowLens AI - Image Diagnosis Testing Guide

## Current Status
✅ Backend route registered: `POST /api/diagnoses/ai-detect-image`
✅ Frontend URL fixed: `http://localhost:5000/api`
✅ Debug logs added to backend
✅ Detailed error handling added
✅ Test script created

## Next Step: Run the Test

### Prerequisites
1. Backend running on port 5000
2. Frontend running on port 5173
3. Logged in to the application
4. Have a test image ready (cow image preferred)

---

## Step 1: Get Your Authentication Token

### From Browser:
1. Open the app in browser (http://localhost:5173)
2. Login with your credentials
3. Open DevTools (F12)
4. Go to Console tab
5. Run this command:
   ```javascript
   localStorage.getItem('token')
   ```
6. Copy the token (it will be a long string starting with `eyJ...`)

---

## Step 2: Prepare a Test Image

Find a cow image on your computer, for example:
- `C:\Users\Sanjana\OneDrive\Desktop\test-cow.jpg`
- Or any JPG/PNG image

---

## Step 3: Run the Test Script

Open a terminal and run:

```bash
cd C:\Users\Sanjana\OneDrive\Desktop\CowLens-AI
node test-image-diagnosis.js YOUR_TOKEN_HERE C:\path\to\cow\image.jpg
```

**Example:**
```bash
node test-image-diagnosis.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... C:\Users\Sanjana\Pictures\cow.jpg
```

---

## Step 4: Capture the Output

The test script will show:

### If Successful:
```
✅ SUCCESS!
===========
Status: 200
Duration: 5234ms

Response:
{
  "success": true,
  "data": {
    "yoloDetection": {
      "detectedDiseases": ["healthy"],
      "confidence": 95.5,
      ...
    }
  }
}
```

### If Failed:
```
❌ FAILED!
===========

HTTP Status: 404 (or 401, 400, 500)

Response Headers:
  content-type: application/json
  ...

Response Body:
{
  "success": false,
  "message": "...",
  ...
}

🔍 Analysis: 404 Not Found
  - Route does not exist at this URL
  - Check backend route registration
  - Check VITE_API_URL in client/.env
```

---

## Step 5: Share the Results

**Please copy and paste the ENTIRE output from the test script**, including:
- HTTP Status code
- Response headers
- Response body (full JSON)
- Any error messages

This will tell us EXACTLY what's failing and where.

---

## Step 6: Also Check Backend Console

While running the test, watch the backend console (where `npm start` is running). You should see:

### Expected logs:
```
[Roboflow] Config loaded: { ... }
[DiagnosisController] aiDetectImage called
[DiagnosisController] Request file: { ... }
[DiagnosisController] Calling detectDiseases...
[Roboflow] detectDiseases called...
...
```

### If you see errors:
```
[DiagnosisController] ========== IMAGE DETECTION FAILED ==========
[DiagnosisController] Error message: ...
[DiagnosisController] Error stack: ...
```

**Copy these error logs as well.**

---

## What Happens Next

Once you provide the test output, I will:

1. **Identify the exact error** from the response body
2. **Locate the exact line** of code causing the error
3. **Apply the fix** automatically
4. **Verify the fix** works
5. **Remove debug logs** once working
6. **Test the complete flow** from frontend

---

## Common Issues to Watch For

### 404 Not Found
- Route not registered
- Wrong URL
- Backend not running

### 401 Unauthorized
- Token invalid/expired
- Token not in header
- Auth middleware failing

### 400 Bad Request
- Missing image field
- Wrong field name
- File too large

### 500 Internal Server Error
- Roboflow API error
- Invalid API key
- Network timeout
- Image processing error

---

## Quick Test Alternative

If the test script doesn't work, you can also test directly from the frontend:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Upload an image from AI Diagnosis page
4. Find the request to `/api/diagnoses/ai-detect-image`
5. Click on it and check:
   - **Headers tab**: Request URL, Authorization header
   - **Response tab**: Response body and status code
   - **Console tab**: Any JavaScript errors

**Copy the entire request/response details.**

---

## Expected Final Result

After fixing, you should see:
- HTTP 200 status
- Response with `success: true`
- `yoloDetection` object with detected diseases
- `confidence` percentage
- `combinedAnalysis` if symptoms were provided

Example:
```json
{
  "success": true,
  "data": {
    "yoloDetection": {
      "detectedDiseases": ["foot_and_mouth_disease"],
      "confidence": 87.5,
      "detections": [
        { "disease": "foot_and_mouth_disease", "confidence": 87.5 }
      ],
      "totalDetections": 1
    },
    "combinedAnalysis": {
      "healthScore": 65,
      "possibleDiseases": [...],
      ...
    }
  }
}
```

---

## Run the Test Now

```bash
node test-image-diagnosis.js YOUR_TOKEN PATH_TO_IMAGE
```

**Then share the complete output.**