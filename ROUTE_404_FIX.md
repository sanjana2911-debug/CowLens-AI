# CowLens AI - Route 404 Error - Root Cause & Fix

## Issue
Frontend receives HTTP 404 when calling:
```
POST /api/diagnoses/ai-detect-image
```

## Root Cause Analysis

### Backend Route Registration ✅ CORRECT
**File:** `server/routes/index.js` (line 71)
```javascript
router.post('/diagnoses/ai-detect-image', protect, upload.single('image'), aiDetectImage);
```

**File:** `server/index.js` (line 25)
```javascript
app.use('/api', routes);
```

**Full backend route:** `POST /api/diagnoses/ai-detect-image` ✅ CORRECT

### Frontend API Configuration ❌ THE PROBLEM
**File:** `client/.env`
```env
VITE_API_URL=https://cowlens-ai-backend.onrender.com/api
```

**File:** `client/src/services/api.js`
```javascript
const API_URL = import.meta.env.VITE_API_URL || '/api';
```

**Full frontend URL:** `https://cowlens-ai-backend.onrender.com/api/diagnoses/ai-detect-image`

## The Mismatch

You're running the backend locally on port 5000, but the frontend is configured to call the **production backend** at `https://cowlens-ai-backend.onrender.com/api`.

**Scenario:**
1. Local backend running on: `http://localhost:5000/api`
2. Frontend calling: `https://cowlens-ai-backend.onrender.com/api`
3. The production backend might not have the latest route deployed → **404**

## The Fix

### Option 1: Update client/.env for local development (RECOMMENDED)
```env
VITE_API_URL=http://localhost:5000/api
```

### Option 2: Use a proxy in vite.config.js
Already configured, but .env overrides it.

### Option 3: Deploy the backend to production
Ensure the latest code is deployed to Render.com

## Verification

### Check Backend Route Registration
The route IS registered correctly in the backend:
```javascript
// server/routes/index.js
router.post('/diagnoses/ai-detect-image', protect, upload.single('image'), aiDetectImage);
```

### Check Frontend URL
The frontend is calling:
```javascript
// client/src/services/api.js
api.post('/diagnoses/ai-detect-image', formData, ...)
// Full URL: https://cowlens-ai-backend.onrender.com/api/diagnoses/ai-detect-image
```

### Check Backend Logs
When you upload an image, the backend console should show:
```
[DiagnosisController] aiDetectImage called
```

If you DON'T see this log, the request is not reaching your local backend → **URL mismatch confirmed**.

## Files to Modify

### 1. `client/.env`
**Current:**
```env
VITE_API_URL=https://cowlens-ai-backend.onrender.com/api
```

**Change to:**
```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Restart Frontend
After changing .env, restart the frontend:
```bash
cd client
npm run dev
```

## Testing

### Test the Endpoint Locally
```bash
# Start backend
cd server
npm start

# In another terminal, test with curl
curl -X POST http://localhost:5000/api/diagnoses/ai-detect-image \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@/path/to/cow/image.jpg"
```

Expected response (if no token):
```json
{
  "success": false,
  "message": "Not authorized, no token provided"
}
```

This proves the route exists! (You mentioned this response earlier)

### Test from Frontend
1. Update `client/.env` to use `http://localhost:5000/api`
2. Restart frontend
3. Upload image from AI Diagnosis page
4. Check backend console for logs
5. Should see:
   ```
   [DiagnosisController] aiDetectImage called
   [DiagnosisController] Request file: { ... }
   [Roboflow] detectDiseases called...
   ```

## Summary

✅ Backend registered route: `POST /api/diagnoses/ai-detect-image`
✅ Frontend request URL: Should be `http://localhost:5000/api/diagnoses/ai-detect-image`
❌ Current frontend URL: `https://cowlens-ai-backend.onrender.com/api/diagnoses/ai-detect-image`
✅ Upload field name: `image` (matches multer config)
✅ Authentication: Working (you confirmed 401 response)

**Root Cause:** Frontend is calling production backend instead of local backend.

**Fix:** Update `client/.env` to use `http://localhost:5000/api` for local development.

---

## After Fix

Once you update the .env file and restart the frontend, the image diagnosis should work and you'll see the debug logs in the backend console to verify the complete pipeline.