# CowLens AI - Roboflow Image Diagnosis Debug Guide

## Issue Reported
Frontend uploads image successfully, but backend returns "Image analysis failed"

## Root Cause
Need to identify where in the pipeline the failure occurs:
1. Frontend request payload
2. Multer file upload middleware
3. Diagnosis route
4. diagnosisController.js
5. yoloService.js / Roboflow service
6. Roboflow API request
7. Roboflow API response
8. Error handling

---

## Debug Logs Added

### 1. `server/services/yoloService.js`
Added comprehensive logging for:
- Configuration loading (API_KEY, WORKSPACE, WORKFLOW_ID)
- Image processing (Buffer vs file path)
- Base64 encoding
- Roboflow API requests (Workflow vs Standard Inference)
- API responses (status, data)
- Prediction extraction
- Error details (message, code, stack, response data)

### 2. `server/controllers/diagnosisController.js`
Added logging for:
- Request receipt
- Request body (symptoms, cowId)
- Uploaded file details (req.file)
- Image path
- YOLO service calls
- YOLO results
- File cleanup
- Error details

---

## How to Debug

### Step 1: Start Backend Server
```bash
cd server
npm start
```

### Step 2: Watch Backend Console Logs
When you upload an image from the frontend, watch for these logs:

**Expected successful flow:**
```
[Roboflow] Config loaded: { API_KEY: '0jyxKKL...', WORKSPACE: 'sanjanas-workspace-eh6nz', ... }
[Roboflow] Workflow URL: https://api.roboflow.com/v1/sanjanas-workspace-eh6nz/workflows/undefined/sync
[Roboflow] Inference URL: https://classify.roboflow.com/sanjanas-workspace-eh6nz

[DiagnosisController] aiDetectImage called
[DiagnosisController] Request body: { symptoms: '...', cowId: '...' }
[DiagnosisController] Request file: { path: '...', originalname: '...', ... }
[DiagnosisController] Image path: /tmp/upload_...
[DiagnosisController] Calling detectDiseases...

[Roboflow] detectDiseases called with: { imageType: 'string', isBuffer: false, filename: 'cow.jpg' }
[Roboflow] Processing file path: /tmp/upload_...
[Roboflow] Base64 length: 12345
[Roboflow] Using Standard Inference API (or Workflow API)
[Roboflow] Sending inference request...
[Roboflow] Inference response status: 200
[Roboflow] Inference response data: { "predictions": [...], "image": {...} }
[Roboflow] Extracted predictions: [ { class: 'disease_name', confidence: 95.5 } ]
[Roboflow] Final result: { detectedDiseases: [...], confidence: 95.5, ... }

[DiagnosisController] YOLO result: { detectedDiseases: [...], confidence: 95.5, ... }
[DiagnosisController] Cleaned up file: /tmp/upload_...
```

**If it fails, look for error logs:**
```
[Roboflow] Config error: ROBOFLOW_API_KEY is not configured
[Roboflow] Invalid input: ...
[Roboflow] Failed to read/encode image: ...
[Roboflow] API call failed:
[Roboflow] Error message: ...
[Roboflow] Response status: 401/403/404/500
[Roboflow] Response data: { "error": "Invalid API key" }

[DiagnosisController] No file uploaded
[DiagnosisController] Image detection failed:
[DiagnosisController] Error message: ...
```

---

## Common Issues and Solutions

### Issue 1: Missing Configuration
**Symptoms:**
```
[Roboflow] Config error: ROBOFLOW_API_KEY is not configured
```

**Solution:**
Check `server/.env`:
```env
ROBOFLOW_API_KEY=0jyxKKLrYlSJikZoDHeM
ROBOFLOW_WORKSPACE=sanjanas-workspace-eh6nz
ROBOFLOW_WORKFLOW_ID=  # Leave empty for standard inference
```

### Issue 2: Invalid API Key
**Symptoms:**
```
[Roboflow] Response status: 401
[Roboflow] Response data: { "error": "Invalid API key" }
```

**Solution:**
- Verify API key in Roboflow dashboard
- Check for typos in .env file
- Ensure API key has correct permissions

### Issue 3: Wrong Workspace
**Symptoms:**
```
[Roboflow] Response status: 404
[Roboflow] Response data: { "message": "Workspace not found" }
```

**Solution:**
- Verify workspace name in Roboflow dashboard
- Check for typos/case sensitivity

### Issue 4: Workflow ID Missing/Invalid
**Symptoms:**
```
[Roboflow] Workflow URL: .../workflows/undefined/sync
```

**Solution:**
- Either set `ROBOFLOW_WORKFLOW_ID` in .env
- Or leave it empty to use standard inference API

### Issue 5: Image Processing Failure
**Symptoms:**
```
[Roboflow] Failed to read/encode image: ...
[Roboflow] Invalid input: ...
```

**Solution:**
- Check file upload middleware (multer)
- Verify image path exists
- Check file permissions

### Issue 6: Roboflow API Timeout
**Symptoms:**
```
[Roboflow] Error code: ECONNABORTED
[Roboflow] Error message: timeout of 30000ms exceeded
```

**Solution:**
- Increase `ROBOFLOW_REQUEST_TIMEOUT` in .env
- Check network connectivity
- Verify Roboflow API status

### Issue 7: No Predictions Returned
**Symptoms:**
```
[Roboflow] Extracted predictions: []
[Roboflow] No predictions found in any step
```

**Solution:**
- This is NOT an error - model just didn't detect any diseases
- Frontend should handle empty predictions gracefully
- Check if image is clear and well-lit

---

## Verification Steps

### 1. Check Backend Logs
After uploading an image, check backend console for:
- Configuration logs (on server start)
- Request logs (when image uploaded)
- Roboflow API call logs
- Response logs
- Error logs (if any)

### 2. Test Roboflow API Directly
Use curl to test Roboflow API:
```bash
curl -X POST \
  "https://classify.roboflow.com/sanjanas-workspace-eh6nz?api_key=0jyxKKLrYlSJikZoDHeM" \
  -F "file=@/path/to/cow/image.jpg"
```

### 3. Check Environment Variables
```bash
cd server
node -e "console.log(process.env.ROBOFLOW_API_KEY)"
node -e "console.log(process.env.ROBOFLOW_WORKSPACE)
```

### 4. Test Image Upload
Check if multer is receiving the file:
```javascript
// In diagnosisController.js
console.log('[DiagnosisController] Request file:', req.file);
```
Should show:
```javascript
{
  fieldname: 'image',
  originalname: 'cow.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: '/tmp/...',
  filename: '...',
  path: '/tmp/upload_...',
  size: 12345
}
```

---

## Expected Behavior

### Successful Flow
1. Frontend uploads image
2. Multer saves to /tmp
3. Controller receives file
4. Controller calls yoloService
5. yoloService encodes image to base64
6. yoloService calls Roboflow API
7. Roboflow returns predictions
8. yoloService parses predictions
9. Controller receives results
10. Controller saves diagnosis to DB
11. Controller returns success to frontend

### Error Flow
1. Frontend uploads image
2. Multer saves to /tmp
3. Controller receives file
4. Controller calls yoloService
5. yoloService encounters error
6. Error is logged with full details
7. Error is thrown to controller
8. Controller logs error
9. Controller returns error response to frontend
10. Frontend shows error message

---

## Next Steps

1. **Upload an image** from the frontend
2. **Check backend console** for the logs
3. **Identify the failure point**:
   - Config error → Fix .env
   - File upload error → Fix multer
   - Roboflow API error → Check API key/workspace
   - Response parsing error → Check response format
4. **Apply the fix** based on the error
5. **Test again** until successful
6. **Remove debug logs** once working

---

## Temporary Debug Logs

Logs have been added to:
1. `server/services/yoloService.js` - Comprehensive Roboflow API logging
2. `server/controllers/diagnosisController.js` - Image upload and processing logging

**These logs will be removed after the issue is fixed.**

---

## Contact

If issue persists:
1. Share backend console logs from image upload attempt
2. Share Roboflow API response (if any)
3. Share .env configuration (redact API key)
4. Share error stack trace