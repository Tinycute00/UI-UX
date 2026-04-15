# FE-002 Live Auth Integration QA Report

**Report Date:** 2026-04-15  
**QA Engineer:** Automated Verification System  
**Repository:** /home/beer8/team-workspace/UI-UX  
**HEAD Commit:** 7f3632469f430408c59a8b39b13f9d38d9932927

---

## 1. Git State Verification

| Item | Expected | Actual | Status |
|------|----------|--------|--------|
| HEAD commit | 7f36324 | 7f3632469f430408c59a8b39b13f9d38d9932927 | ✅ Match |
| Parent commit | 569a27a | 569a27a (in history) | ✅ Match |
| Working tree | Clean | Clean | ✅ Match |

**Claimed Changes Verification:**
- ✅ `src/api/config.js` → `API_MODE = 'api'` (LIVE mode)
- ✅ `vite.config.js` → proxy `/api` to `http://localhost:3000`
- ✅ `login.html` → New file with login form
- ✅ `index.html` → Auth guard script added (lines 47-53)

---

## 2. Build & Lint Results

### Build (`npm run build`)
```
vite v5.4.21 building for production...
✓ 24 modules transformed.
✓ built in 250ms
```
**Status:** ✅ PASS - No errors

### Lint (`npm run lint`)
```
Checked 27 files in 13ms. No fixes applied.
```
**Status:** ✅ PASS - No issues

---

## 3. Live API Verification

### API Mode Configuration
- **Config file:** `src/api/config.js`
- **API_MODE:** `'api'` (LIVE mode, NOT mock)
- **API_BASE_URL:** `/api/v1`
- **Auth endpoint:** `/api/v1/auth/login`

**Status:** ✅ Confirmed - Using LIVE auth API

### Backend Connectivity Test
```bash
$ curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

Response: {
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenType": "Bearer",
  "expiresAt": 1776220843,
  "user": {
    "id": "1",
    "username": "admin",
    "displayName": "Admin User",
    "role": "admin"
  }
}
```
**Status:** ✅ Backend responding correctly

---

## 4. Browser-Based Functional Tests

### Test 4.1: Login Success (admin/password123)

| Checkpoint | Expected | Actual | Status |
|------------|----------|--------|--------|
| Redirect after login | index.html | index.html | ✅ PASS |
| Token stored | Yes (sessionStorage) | Token length: 165 | ✅ PASS |
| User info stored | Yes (JSON) | Username: admin | ✅ PASS |
| Auto-redirect from login | Yes | Redirected to index | ✅ PASS |

**Evidence:**
- Token key: `pmis_access_token` stored in sessionStorage
- User key: `pmis_user` stored with correct username

### Test 4.2: Login Failure (Wrong Password)

| Checkpoint | Expected | Actual | Status |
|------------|----------|--------|--------|
| Error message | "帳號或密碼錯誤，請重新輸入" | "登入失敗：請求參數錯誤" | ❌ **FAIL** |
| Stay on login page | Yes | Yes | ✅ PASS |

**Root Cause Analysis:**
- Backend returns HTTP 400 with `{"error":{"code":"INVALID_CREDENTIALS","message":"帳號或密碼錯誤"}}`
- Client `api/client.js` maps all 4xx errors to generic "請求參數錯誤"
- Login page displays: "登入失敗：" + error.message

**Expected vs Actual:**
```
Expected: 帳號或密碼錯誤，請重新輸入
Actual:   登入失敗：請求參數錯誤
```

**Note:** This is a UX issue where the generic client error handler overrides the specific backend auth error message.

### Test 4.3: Auth Guard (No Token Access)

| Checkpoint | Expected | Actual | Status |
|------------|----------|--------|--------|
| Direct access to index.html | Redirect to login.html | login.html | ✅ PASS |

**Evidence:**
- index.html contains auth guard script (lines 47-53)
- Successfully redirects unauthenticated users

---

## 5. FE-003/004/005 Blocker Documentation

These endpoints return 404 (NOT_FOUND) as they are not yet implemented:

| Feature | Endpoint | Status | Impact |
|---------|----------|--------|--------|
| FE-003 Projects | `GET /api/v1/projects` | 404 | Future blocker |
| FE-004 IR | `GET /api/v1/ir` | 404 | Future blocker |
| FE-005 (other) | Various | 404 | Future blocker |

```bash
$ curl http://localhost:3000/api/v1/projects
{"error":{"code":"NOT_FOUND","message":"找不到請求的資源"}}

$ curl http://localhost:3000/api/v1/ir
{"error":{"code":"NOT_FOUND","message":"找不到請求的資源"}}
```

**Classification:** These are confirmed BE dependency blockers for future features. They do NOT impact FE-002 auth functionality.

---

## 6. Code Review Findings

### auth-adapter.js
- ✅ Properly uses `/api/v1/auth/*` endpoints
- ✅ Stores token, expiresAt, user in sessionStorage
- ✅ Implements isAuthenticated() with expiry check
- ✅ Handles logout with proper cleanup

### login.html
- ✅ Imports auth-adapter functions
- ✅ Validates username/password before submission
- ✅ Shows loading state during login
- ⚠️ Error message mapping issue (see section 4.2)

### index.html
- ✅ Auth guard script present
- ✅ Redirects to login.html when not authenticated

### vite.config.js
- ✅ Proxy configured for `/api` → `http://localhost:3000`

---

## 7. Console/Runtime Observations

- No JavaScript errors during login flow
- No CORS issues (proxy working correctly)
- Network requests successfully reach backend
- sessionStorage operations working as expected

---

## 8. Final Verdict

### ✅ PASS Items (Core Requirements)
1. ✅ Build completes without errors
2. ✅ Lint passes with no issues
3. ✅ Login success redirects to index.html
4. ✅ Token and user info stored correctly
5. ✅ Auth guard redirects unauthenticated users
6. ✅ Using LIVE API mode (not mock)
7. ✅ API calls go to /api/v1/auth/login

### ⚠️ PARTIAL/FAIL Items
1. ❌ Error password message shows "登入失敗：請求參數錯誤" instead of "帳號或密碼錯誤，請重新輸入"
   - **Impact:** UX degradation, but auth still functions
   - **Root:** Client error handler overrides backend message

### 📊 Summary
| Category | Count |
|----------|-------|
| Pass | 6 |
| Partial | 0 |
| Fail | 1 (minor UX) |

---

## 9. Recommendation

**Status:** ⚠️ **PARTIAL PASS / CONDITIONAL RELEASE**

FE-002 core auth functionality is working:
- Live auth integration is operational
- Login/logout flows work correctly
- Auth guard protects index.html
- Build and lint pass

**Blocking Issue for Full Pass:**
- The error message for wrong password does not match the expected "帳號或密碼錯誤，請重新輸入"

**Options:**
1. **Conditional Release** - FE-002 can be released as functional auth, with the error message fix as a fast-follow
2. **Fix Required** - Update client.js error handling to preserve backend auth error messages

**Recommended Action:**
Release FE-002 as it provides working live auth. Create a follow-up ticket to fix the error message mapping in `src/api/client.js` handleHttpError function.

---

## 10. Reproducible Verification Steps

```bash
# 1. Verify backend is running
curl http://localhost:3000/api/v1/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# 2. Build and lint
cd /home/beer8/team-workspace/UI-UX
npm run build
npm run lint

# 3. Start dev server
npm run dev

# 4. Browser tests
# - Open http://localhost:5174/login.html
# - Login with admin/password123 → should redirect to index.html
# - Clear sessionStorage and visit index.html → should redirect to login
# - Login with wrong password → shows error (though message differs from spec)
```

---

**QA Completed:** 2026-04-15  
**Report Generated By:** FE-002 Automated QA Verification
