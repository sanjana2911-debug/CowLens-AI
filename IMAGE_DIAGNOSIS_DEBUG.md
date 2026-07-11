# CowLens AI - Image Diagnosis Pipeline Debug

## Summary
Added comprehensive debug logging to the entire image diagnosis pipeline to identify why "Image analysis failed" is being returned.

---

## Files Modified

### 1. `server/services/yoloService.js`
**Added logging at every step:**
- Configuration loading (API_KEY, WORKSPACE, WORKFLOW_ID)
- Image processing (Buffer vs file path detection)
- Base64 encoding
- Roboflow API endpoint selection (Workflow vs Standard Inference)
- API request details
- API response status and data
- Prediction extraction process
- Error details (message, code, stack, response data)

### 2. `server/controllers/diagnosisController.js`
**Added logging for:**
- Request receipt confirmation
- Request body (symptoms, cowId)
- Uploaded file details (req.file object)
- Image path
- YOLO service call initiation
- YOLO results
- File cleanup operations
- Error details with stack trace

---

## How to Use This Debug Setup

### Step 1: Start Backend
```bash
cd server
npm start
```

### Step 2: Upload Image from Frontend
1. Go to AI Diagnosis page
2. Switch to "Image Detection" tab
3. Upload a cow image
4. Optionally add symptoms
5. Click "Detect Diseases from Image"

### Step 3: Watch Backend Console
Look for these log entries in order:

#### Expected Success Flow:
```
[Roboflow] Config loaded: { API_KEY: '0jyxKKL...', WORKSPACE: 'sanjanas-workspace-eh6nz', ... }
[Roboflow] Workflow URL: https://api.roboflow.com/v1/sanjanas-workspace-eh6nz/workflows/undefined/sync
[Roboflow] Inference URL: https://classify.roboflow.com/sanjanas-workspace-eh6nz

[DiagnosisController] aiDetectImage called
[DiagnosisController] Request body: { symptoms: 'cow has fever', cowId: '...' }
[DiagnosisController] Request file: { path: 'uploads/1234567890-123.jpg', ... }
[DiagnosisController] Image path: uploads/1234567890-123.jpg
[DiagnosisController] Calling detectDiseases...

[Roboflow] detectDiseases called with: { imageType: 'string', isBuffer: false, filename: 'cow.jpg' }
[Roboflow] Processing file path: uploads/1234567890-123.jpg
[Roboflow] Base64 length: 45678
[Roboflow] Using Standard Inference API
[Roboflow] Sending inference request...
[Roboflow] Inference response status: 200
[Roboflow] Inference response data: { "predictions": [...], "image": {...} }
[Roboflow] Extracted predictions: [ { class: 'healthy', confidence: 95.5 } ]
[Roboflow] Final result: { detectedDiseases: ['healthy'], confidence: 95.5, ... }

[DiagnosisController] YOLO result: { detectedDiseases: ['healthy'], confidence: 95.5, ... }
[DiagnosisController] Cleaned up file: uploads/1234567890-123.jpg
```

#### If It Fails - Look For:
```
[Roboflow] Config error: ROBOFLOW_API_KEY is not configured
→ Fix: Add ROBOFLOW_API_KEY to server/.env

[Roboflow] Invalid input: ...
→ Fix: Check multer configuration

[Roboflow] Failed to read/encode image: ...
→ Fix: Check file permissions

[Roboflow] API call failed:
[Roboflow] Error message: ...
[Roboflow] Response status: 401/403/404/500
→ Fix: Check API key, workspace, or network

[DiagnosisController] No file uploaded
→ Fix: Check multer middleware

[DiagnosisController] Image detection failed:
[DiagnosisController] Error message: ...
→ Fix: Check error details above
```

---

## Pipeline Flow Diagram

```
Frontend (AIDiagnosis.jsx)
    ↓
    Upload image + symptoms
    ↓
API Service (api.js)
    ↓
    POST /api/diagnoses/ai-detect-image
    ↓
Backend Route (routes/index.js:71)
    ↓
    protect (auth middleware)
    upload.single('image') (multer)
    aiDetectImage (controller)
    ↓
Diagnosis Controller (diagnosisController.js)
    ↓
    Logs: req.body, req.file, imagePath
    Calls: detectDiseases()
    ↓
YOLO Service (yoloService.js)
    ↓
    Logs: config, image processing, API call
    Calls: Roboflow API
    ↓
Roboflow API
    ↓
    Returns: predictions or error
    ↓
YOLO Service
    ↓
    Parses response, returns normalized result
    ↓
Diagnosis Controller
    ↓
    Logs: yoloResult
    Optionally calls Groq if symptoms provided
    Saves to MongoDB
    Returns success response
    ↓
Frontend
    ↓
    Displays results
```

---

## Key Debug Points

### 1. Configuration Check (Server Startup)
Look for:
```
[Roboflow] Config loaded: { ... }
```
- If API_KEY is 'MISSING' → Add to .env
- If WORKSPACE is 'MISSING' → Add to .env
- If WORKFLOW_ID is 'MISSING' → Will use standard inference (OK)

### 2. File Upload Check
Look for:
```
[DiagnosisController] Request file: { ... }
```
- If undefined → Multer not working
- Should have: path, originalname, mimetype, size

### 3. Image Processing Check
Look for:
```
[Roboflow] Processing file path: ...
[Roboflow] Base64 length: ...
```
- If "Invalid input" → File path issue
- If "Failed to read/encode" → File permissions

### 4. API Call Check
Look for:
```
[Roboflow] Using Standard Inference API (or Workflow API)
[Roboflow] Sending inference request...
[Roboflow] Inference response status: 200
```
- If status is 401 → Invalid API key
- If status is 403 → Permission denied
- If status is 404 → Wrong workspace or endpoint
- If status is 500 → Roboflow server error

### 5. Response Parsing Check
Look for:
```
[Roboflow] Extracted predictions: [ ... ]
```
- If empty array → Model didn't detect anything (not an error)
- If error in parsing → Check response format

### 6. Error Check
Look for:
```
[DiagnosisController] Image detection failed:
[DiagnosisController] Error message: ...
[Roboflow] Error stack: ...
```
- This shows the exact failure point

---

## Common Issues and Fixes

### Issue: "ROBOFLOW_API_KEY is not configured"
**Location:** yoloService.js config check
**Fix:** Add to server/.env:
```env
ROBOFLOW_API_KEY=0jyxKKLrYlSJikZoDHeM
```

### Issue: "Workspace not found"
**Location:** Roboflow API response
**Fix:** Verify workspace name in .env matches Roboflow dashboard

### Issue: "Invalid API key"
**Location:** Roboflow API response (401)
**Fix:** 
- Check API key in Roboflow dashboard
- Verify no typos in .env
- Ensure key has inference permissions

### Issue: "No file uploaded"
**Location:** diagnosisController.js file check
**Fix:** 
- Check multer middleware in routes
- Verify frontend sends as 'image' field
- Check file size limit (5MB)

### Issue: "Failed to read/encode image"
**Location:** yoloService.js image processing
**Fix:**
- Check file exists at path
- Check file permissions
- Verify multer destination folder exists

### Issue: Timeout
**Location:** yoloService.js API call
**Fix:**
- Increase timeout in .env: `ROBOFLOW_REQUEST_TIMEOUT=60000`
- Check network connectivity

---

## Testing Checklist

- [ ] Backend starts without config errors
- [ ] Frontend can upload image
- [ ] Multer receives file (check req.file logs)
- [ ] Image path is valid
- [ ] Base64 encoding succeeds
- [ ] Roboflow API is called
- [ ] Roboflow API returns 200
- [ ] Predictions are extracted
- [ ] Result is returned to frontend
- [ ] Frontend displays results

---

## Next Steps

1. **Upload an image** from the frontend
2. **Check backend console** for the logs above
3. **Identify the failure point** from the logs
4. **Apply the fix** based on the error
5. **Test again** until successful
6. **Remove debug logs** once working (see CLEANUP.md)

---

## Temporary Debug Logs

These logs will be removed after debugging:
- `server/services/yoloService.js` - All console.log statements
- `server/controllers/diagnosisController.js` - All console.log statements

**Keep these logs active until the image diagnosis is working correctly.**