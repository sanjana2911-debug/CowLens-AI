# CowLens AI - Authentication Debug & Fix Guide

## Issue Reported
Backend returns: `"success": false, "message": "Not authorized, no token provided"`

This proves:
- ✅ Express server is running
- ✅ MongoDB is connected
- ✅ Authentication middleware is working
- ❌ Frontend is NOT sending the JWT token

---

## Root Cause Analysis

### Potential Issues
1. **Token not being stored** after login/register
2. **Token not being retrieved** from localStorage
3. **Token not being sent** in Authorization header
4. **Token format incorrect** in header
5. **API URL mismatch** causing requests to go to wrong endpoint

---

## Debug Logs Added

### 1. `client/src/services/api.js`
Added console logs to track:
- Every API request (method + URL)
- Token presence before request
- Authorization header setting
- API responses and errors

### 2. `client/src/context/AuthContext.jsx`
Added console logs to track:
- Token reading from localStorage on app load
- Token presence during login/register
- Token storage after login/register
- `getMe()` API call and response
- Token removal on logout/401

---

## How to Debug

### Step 1: Open Browser Console
1. Open the app in browser
2. Open DevTools (F12)
3. Go to Console tab
4. Clear console

### Step 2: Test Login Flow
1. Go to `/login`
2. Enter credentials and submit
3. Watch console for these logs:

**Expected logs:**
```
[AuthContext] Login attempt for: user@example.com
[API Request] POST /auth/login Token: MISSING
[API Response] 200 /auth/login
[AuthContext] Login successful, token stored: Yes
```

**If token is MISSING in login request:**
- This is normal (login doesn't need token)

**If token is NOT stored after login:**
- Check if `res.data.data` contains `token` field
- Backend might not be returning token

### Step 3: Test Token Retrieval
After login, check localStorage:
```javascript
localStorage.getItem('token') // Should return JWT token
localStorage.getItem('user') // Should return user object
```

### Step 4: Test Protected Request
After login, try to access dashboard:
1. Should redirect to `/dashboard`
2. Watch for these logs:

**Expected logs:**
```
[AuthContext] Reading stored user: Found
[AuthContext] Reading stored token: Present
[AuthContext] loadUser called, token: Present
[API Request] GET /auth/me Token: Present
[API Request] Authorization header set
[API Response] 200 /auth/me
[AuthContext] getMe response: {success: true, data: {...}}
```

**If token is MISSING:**
- Token was not stored properly
- Check login function in AuthContext

**If Authorization header is NOT set:**
- Check interceptor in api.js
- Token might be null/undefined

### Step 5: Test Dashboard API
After `getMe()` succeeds, dashboard should load:
```
[API Request] GET /cows/stats/dashboard Token: Present
[API Request] Authorization header set
[API Response] 200 /cows/stats/dashboard
```

**If this returns 401:**
- Token is not being sent
- Check interceptor
- Check API_URL configuration

---

## Common Issues and Fixes

### Issue 1: Token Not Stored
**Symptoms:** Console shows "Login successful, token stored: NO"

**Root cause:** Backend response format doesn't match expected format

**Fix:** Check backend auth controller returns:
```javascript
res.json({
  success: true,
  data: {
    token: 'jwt_token_here',
    user: { ... }
  }
});
```

### Issue 2: Token Not Retrieved
**Symptoms:** Console shows "Reading stored token: MISSING" after login

**Root cause:** Token was not saved to localStorage

**Fix:** Verify login function:
```javascript
const { token, ...userData } = res.data.data;
localStorage.setItem('token', token);
```

### Issue 3: Token Not Sent in Header
**Symptoms:** Console shows "Token: Present" but "Authorization header set" is missing

**Root cause:** Interceptor not working or headers being overwritten

**Fix:** Check interceptor code in api.js:
```javascript
if (token) {
  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${token}`;
}
```

### Issue 4: Wrong API URL
**Symptoms:** Requests going to wrong endpoint

**Root cause:** `VITE_API_URL` not set or incorrect

**Fix:** Check `client/.env`:
```
VITE_API_URL=https://cowlens-ai-backend.onrender.com/api
```

### Issue 5: CORS Issues
**Symptoms:** Network errors in console

**Root cause:** Backend CORS not configured for frontend URL

**Fix:** Check backend CORS configuration

---

## Verification Steps

### 1. Check localStorage
```javascript
// In browser console
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

### 2. Check Network Tab
1. Go to Network tab in DevTools
2. Make an API request (e.g., login)
3. Click on the request
4. Go to Headers tab
5. Check "Request Headers" for:
   ```
   Authorization: Bearer <token>
   ```

### 3. Check API Response
Look at the response from `/auth/login`:
```javascript
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "name": "...",
      "email": "..."
    }
  }
}
```

---

## Temporary Debug Logs

Logs have been added to:
1. `client/src/services/api.js` - Request/response logging
2. `client/src/context/AuthContext.jsx` - Auth flow logging

**These logs will be removed after the issue is fixed.**

---

## Next Steps

1. **Test the login flow** with debug logs
2. **Check console output** for token presence
3. **Verify Authorization header** in Network tab
4. **Identify the failure point** using logs
5. **Apply the appropriate fix** from above
6. **Remove debug logs** once fixed
7. **Test all protected pages** to ensure they work

---

## Expected Behavior After Fix

### Login Flow
1. User enters credentials
2. Backend returns token
3. Token stored in localStorage
4. User redirected to dashboard
5. Dashboard loads with real data

### Protected API Requests
1. Token retrieved from localStorage
2. Authorization header set: `Bearer <token>`
3. Backend validates token
4. Request succeeds with 200
5. Data returned to frontend

### Page Refresh
1. App loads, checks for token
2. Token found in localStorage
3. `getMe()` called with token
4. User data retrieved
5. Dashboard loads with data

---

## Contact

If issue persists after checking all above:
1. Share console logs from login attempt
2. Share Network tab screenshot showing request headers
3. Share localStorage contents (token and user)
4. Share backend response from `/auth/login`