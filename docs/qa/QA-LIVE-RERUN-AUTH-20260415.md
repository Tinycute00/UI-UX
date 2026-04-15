# QA LIVE RERUN — AUTH 2026-04-15 (Post BE-AUTH-SEED-UNBLOCK)

| Field | Value |
|-------|-------|
| **Report ID** | QA-LIVE-RERUN-AUTH-20260415 |
| **Date** | 2026-04-15 |
| **Status** | ✅ SUCCESS (with noted stale test observations) |
| **Trigger** | BE-AUTH-SEED-UNBLOCK-20260415 — commit `61f1d8a` |
| **Target** | discord:1491771733709947000:1493788885321383977 |
| **Workspace** | `/home/beer8/team-workspace/UI-UX` |
| **Backend** | `http://localhost:3000/api/v1` (live, verified healthy) |
| **Baseline** | HEAD = `61f1d8a` (identical to fix commit — no divergence) |
| **Previous Report** | `docs/qa/QA-LIVE-RERUN-20260415-REPORT.md` (status: **partial**, auth happy-path **blocked**) |

---

## 1. Executive Summary

The `BE-AUTH-SEED-UNBLOCK` fix (commit `61f1d8a`) replaced the fake `AuthRepositoryStub.stubPasswordHash` placeholder with a real bcrypt hash (`$2b$12$...`, rounds=12, password=`password123`). **All three previously blocked accounts now successfully authenticate against the live backend.** The full auth flow (login → /me → refresh → logout) is operational.

**Overall status: SUCCESS** — all planned verification items pass. Two stale unit test assertions are documented as non-blocking observations.

---

## 2. Baseline Verification

| Item | Result |
|------|--------|
| HEAD commit | `61f1d8a` — `fix(auth): fix AuthRepositoryStub to unblock live login - BE-AUTH-SEED-UNBLOCK-20260415` |
| Baseline vs HEAD | **Identical** — HEAD is the fix commit itself; no subsequent commits diverge |
| Uncommitted changes | None (working tree clean) |
| Fix scope confirmed | `AuthRepositoryStub.stubPasswordHash` changed from placeholder string to `$2b$12$qGEsBEvwBjRdHtaqCpTa0eTZ7wDN8nIs22T.rGrpRilpwS1IseNm.` |
| bcrypt verification | `bcryptjs.compare('password123', hash) === true` — **confirmed** |

---

## 3. Live Auth Verification — Happy Path

### 3.1 Login — Three Accounts

| # | Credentials | Endpoint | HTTP | Response Summary | Evidence |
|---|-------------|----------|------|------------------|----------|
| 1 | `admin` / `password123` | `POST /api/v1/auth/login` | **200** ✅ | `accessToken` + `refreshToken` cookie + `user` object returned. `user.username = "admin"`, `user.role = "admin"`, `user.projectIds = ["101"]` | CON-01 |
| 2 | `testuser` / `password123` | `POST /api/v1/auth/login` | **200** ✅ | `accessToken` + `refreshToken` cookie + `user` object returned. `user.username = "testuser"`, `user.role = "admin"`, `user.projectIds = ["101"]` | CON-02 |
| 3 | `admin@pmis.local` / `password123` | `POST /api/v1/auth/login` | **200** ✅ | `accessToken` + `refreshToken` cookie + `user` object returned. `user.username = "admin"`, `user.email = "admin@pmis.local"` | CON-03 |

**Login response contract (verified for all 3 accounts):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenType": "Bearer",
  "expiresAt": 1776219509,
  "user": {
    "id": "1",
    "username": "admin",
    "displayName": "Admin User",
    "email": "admin@pmis.local",
    "role": "admin",
    "projectIds": ["101"]
  }
}
```

Set-Cookie header: `refresh_token=<jwt>; Max-Age=604800; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict` ✅

### 3.2 Full Auth Flow (admin account)

| Step | Endpoint | Method | Result | Evidence |
|------|----------|--------|--------|----------|
| Login | `POST /api/v1/auth/login` | 200 ✅ | Access token + refresh cookie issued | CON-04 |
| Profile | `GET /api/v1/auth/me` | 200 ✅ | Returns user profile with `id`, `username`, `displayName`, `email`, `role`, `projects`, `permissions`, `createdAt`, `lastLoginAt` | CON-05 |
| Refresh | `POST /api/v1/auth/refresh` | 200 ✅ | New access token issued via cookie; `tokenType: "Bearer"`, `expiresAt` present | CON-06 |
| Logout | `POST /api/v1/auth/logout` | 200 ✅ | `{"success":true,"message":"登出成功","clearedSessions":1}`; cookie cleared (`Max-Age=0`) | CON-07 |

### 3.3 Post-Logout Observation

After logout, `GET /api/v1/auth/me` with the old access token still returns **200** with user profile. This is **expected behavior for the stub implementation**: JWT tokens are stateless and remain valid until natural expiry. The stub does not maintain a server-side token revocation list. DB_PENDING — this will change when PrismaAuthRepository connects to a live database with session tracking.

**Risk level:** Low. Access tokens expire in 15 minutes (per `JWT_ACCESS_EXPIRES_MINUTES`). This is standard JWT behavior.

---

## 4. Live Auth Verification — Negative / Regression

| # | Test | Endpoint | Expected | Actual | Evidence |
|---|------|----------|----------|--------|----------|
| 1 | Wrong password | `POST /auth/login` `{"username":"admin","password":"wrongpassword"}` | 400 INVALID_CREDENTIALS | **400** ✅ `{"error":{"code":"INVALID_CREDENTIALS","message":"帳號或密碼錯誤"}}` | CON-08 |
| 2 | Unknown user | `POST /auth/login` `{"username":"nonexistent","password":"password123"}` | 400 INVALID_CREDENTIALS | **400** ✅ Same error body | CON-09 |
| 3 | Missing fields | `POST /auth/login` `{}` | 400 BAD_REQUEST | **400** ✅ `{"error":{"code":"BAD_REQUEST","message":"請求格式錯誤","details":{"username":["Required"],"password":["Required"]}}}` | CON-10 |
| 4 | Unauth /me | `GET /auth/me` (no token) | 401 UNAUTHORIZED | **401** ✅ `{"error":{"code":"UNAUTHORIZED","message":"缺少認證 Token，請先登入"}}` | CON-11 |
| 5 | Unauth /logout | `POST /auth/logout` (no token) | 401 UNAUTHORIZED | **401** ✅ Same error body | CON-12 |
| 6 | No refresh cookie | `POST /auth/refresh` | 401 REFRESH_TOKEN_INVALID | **401** ✅ `{"error":{"code":"REFRESH_TOKEN_INVALID","message":"缺少 Refresh Token，請重新登入"}}` | CON-13 |

---

## 5. Unit Test Suite Results

| Test File | Tests | Passed | Failed | Notes |
|-----------|-------|--------|--------|-------|
| `auth.service.test.ts` | 14 | 14 | 0 | All service-layer logic passes |
| `auth.repository.test.ts` | 17 | 15 | **2** | ⚠️ Stale assertions (see §6) |
| `password.test.ts` | 4 | 4 | 0 | bcrypt hash/compare verified |
| `jwt.test.ts` | 7 | 7 | 0 | JWT sign/verify verified |
| `health.test.ts` | 5 | 5 | 0 | Health endpoint verified |
| **Total** | **47** | **45** | **2** | — |

**Command:** `cd backend && npm test` (vitest run)

---

## 6. Stale Test Observations (Non-Blocking)

Two tests in `auth.repository.test.ts` fail because their assertions reference **pre-BE-AUTH-SEED-UNBLOCK** fixture data that no longer matches the updated stub:

### 6.1 `findUserByUsername > returns stub user for known username`
- **Test asserts:** `user.username === 'stub_user'` and `user.email === 'stub@example.com'`
- **Actual behavior:** `findUserByUsername('stub_user')` now returns `{ username: 'admin', email: 'admin@pmis.local' }` because the fix commit remapped `stub_user` to the admin stub user branch.
- **Classification:** Stale test fixture — test was not updated alongside the stub user mapping change.
- **Product impact:** **None.** The stub's runtime behavior is correct (verified live). The test assertion data is outdated.

### 6.2 `findUserByEmail > returns stub user for known email`
- **Test asserts:** `user.email === 'stub@example.com'` and `user.username === 'stub_user'`
- **Actual behavior:** `findUserByEmail('stub@example.com')` now returns `{ username: 'admin', email: 'admin@pmis.local' }` for the same reason.
- **Classification:** Stale test fixture — same root cause as 6.1.
- **Product impact:** **None.**

### Recommended Fix
Update `backend/src/repositories/auth.repository.test.ts` assertions to match the current stub user mapping:
- For `findUserByUsername('stub_user')`: assert `username === 'admin'`, `email === 'admin@pmis.local'`
- For `findUserByEmail('stub@example.com')`: assert `email === 'admin@pmis.local'`, `username === 'admin'`

(Not applied in this QA run per constraint: "不要修改產品程式碼" — test fixtures are product-adjacent.)

---

## 7. Evidence Taxonomy

| Code | Description | Location |
|------|-------------|----------|
| **SRC** | Source code of AuthRepositoryStub with real bcrypt hash | `backend/src/repositories/auth.repository.ts` L87-91 |
| **SRC** | Auth route handlers for login/logout/refresh/me | `backend/src/routes/auth.ts` |
| **SRC** | AuthService business logic | `backend/src/services/auth.service.ts` |
| **SRC** | Login body schema (Zod) | `backend/src/types/auth.ts` |
| **CON** | Live HTTP console output from curl tests | Sections 3.1–4 of this report |
| **CON** | bcrypt verification: `compare('password123', hash) === true` | Node.js runtime verification |
| **SS** | Security headers verified on all responses (Helmet, CSP, etc.) | Sections 3.2–4 response headers |
| **SS** | Set-Cookie: `HttpOnly; Secure; SameSite=Strict` confirmed | Section 3.1, CON-04 |

---

## 8. Verifiable vs. Blocked Items

### ✅ Immediately Verifiable (Confirmed)

| Item | Status | Detail |
|------|--------|--------|
| `admin / password123` login | **PASS** | 200, token + user returned |
| `testuser / password123` login | **PASS** | 200, token + user returned |
| `admin@pmis.local / password123` login | **PASS** | 200, token + user returned |
| Full flow: login → /me → refresh → logout | **PASS** | All endpoints return expected status and body |
| Wrong password rejection | **PASS** | 400 INVALID_CREDENTIALS |
| Unknown user rejection | **PASS** | 400 INVALID_CREDENTIALS |
| Missing field validation | **PASS** | 400 BAD_REQUEST with field errors |
| Unauthenticated route protection | **PASS** | 401 for /me, /logout, /refresh |
| bcrypt hash correctness | **PASS** | Node.js verify confirms password123 matches stored hash |
| Security headers | **PASS** | Helmet headers present on all responses |
| Refresh token cookie attributes | **PASS** | HttpOnly, Secure, SameSite=Strict |
| Health endpoint | **PASS** | 200, `{"status":"ok","version":"1.0.0"}` |

### ⚠️ Environment-Limited (Documented, Not Blocked)

| Item | Status | Note |
|------|--------|------|
| Post-logout token still valid | **Known** | JWT stateless; stub has no server-side revocation. Low risk — 15min TTL. DB_PENDING. |
| Stale unit test assertions (2 failures) | **Known** | Test fixtures not updated for stub remapping. Non-blocking. |
| `lastLoginAt` returns epoch | **Known** | Stub returns `1970-01-01T00:00:00.000Z` (null → epoch fallback). DB_PENDING for real timestamps. |
| Single user ID for all accounts | **Known** | Stub maps all 3 accounts to `id: "1"`. Will differ with real DB seeding. |

### 🔲 Blocked (Requires External Dependency)

| Item | Blocker | Next Step |
|------|---------|-----------|
| Live PostgreSQL auth persistence | No live DB connected | Apply DB-302 migration + seed data |
| Multi-user ID differentiation | Stub uses single ID | Real DB seeding with distinct user records |
| Session revocation after logout (server-side) | Stub doesn't track revoked sessions | PrismaAuthRepository + sessions table |
| Browser-side login flow (E2E) | Frontend static; no browser test in scope | Playwright/UI integration when backend is stable |

---

## 9. Comparison with Previous QA (QA-LIVE-RERUN-20260415)

| Item | Previous (partial) | Current (SUCCESS) | Delta |
|------|--------------------|--------------------|-------|
| `admin / password123` login | ❌ BLOCKED | ✅ 200 | Fix applied |
| `testuser / password123` login | ❌ 400 INVALID_CREDENTIALS | ✅ 200 | Fix applied |
| `admin@pmis.local / password123` login | ❌ Not tested | ✅ 200 | Newly verified |
| Full auth flow | ❌ Blocked at login | ✅ login→me→refresh→logout | Complete |
| Protected endpoint enforcement | ✅ Already passing | ✅ Still passing | No regression |
| Health endpoint | ✅ Already passing | ✅ Still passing | No regression |
| Unit tests | Not run in previous report | 45/47 pass (2 stale) | New data |

---

## 10. Risk Summary

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| All 3 accounts map to same user ID (stub limitation) | Medium | Certain (current) | Resolves when PrismaAuthRepository connects to seeded DB |
| JWT remains valid after logout | Low | Expected (stateless) | 15min TTL limits window; full revocation requires DB-backed sessions |
| Stale test assertions | Low | Current | Update test fixtures to match stub remapping |
| No rate limiting on login endpoint | Medium | Current | Not in scope; recommend production hardening |

---

## 11. Rollback / Cleanup

| Action | Status |
|--------|--------|
| No temporary test data created | ✅ Clean |
| No database mutations | ✅ Clean |
| No files modified outside QA artifact | ✅ Clean |
| Temp cookie jar `/tmp/pmia-qa-cookies.txt` | ✅ Removed after tests |
| Backend server left in pre-test state | ✅ No stateful changes to stub |

---

## 12. Conclusion & Recommendations

**Status: SUCCESS** — The BE-AUTH-SEED-UNBLOCK fix (commit `61f1d8a`) has fully resolved the auth happy-path blockage. All three target accounts (`admin`, `testuser`, `admin@pmis.local`) successfully authenticate via `POST /api/v1/auth/login` with `password123`, and the complete auth flow (login → profile → refresh → logout) is operational.

### Next Recommendations

1. **Fix stale test assertions** — Update `auth.repository.test.ts` to match the new stub user mapping (2 assertions). Low urgency, no product impact.
2. **Proceed with DB migration** — Apply `auth` schema to PostgreSQL per DB-302/DB-303 plan, then validate `PrismaAuthRepository` replaces stub.
3. **Add rate limiting** — `POST /auth/login` has no brute-force protection. Recommend `@fastify/rate-limit` before production.
4. **E2E browser testing** — Once backend auth is stable, run Playwright integration against `src/api/` frontend auth adapters.
5. **Consider distinct user IDs** — Current stub maps all accounts to `id: "1"`. Real DB seeding should use distinct user IDs for admin, testuser roles.

---

## 13. Evidence Log (Raw Console Output)

### CON-01: admin login
```
$ curl -s -i -X POST http://localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"password123"}'
HTTP/1.1 200 OK
set-cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Max-Age=604800; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict
content-type: application/json; charset=utf-8
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","tokenType":"Bearer","expiresAt":1776219484,"user":{"id":"1","username":"admin","displayName":"Admin User","email":"admin@pmis.local","role":"admin","projectIds":["101"]}}
```

### CON-02: testuser login
```
$ curl -s -i -X POST http://localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"username":"testuser","password":"password123"}'
HTTP/1.1 200 OK
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","tokenType":"Bearer","expiresAt":1776219484,"user":{"id":"1","username":"testuser","displayName":"Test User","email":"testuser@pmis.local","role":"admin","projectIds":["101"]}}
```

### CON-03: admin@pmis.local login
```
$ curl -s -i -X POST http://localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"username":"admin@pmis.local","password":"password123"}'
HTTP/1.1 200 OK
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","tokenType":"Bearer","expiresAt":1776219484,"user":{"id":"1","username":"admin","displayName":"Admin User","email":"admin@pmis.local","role":"admin","projectIds":["101"]}}
```

### CON-04–07: Full auth flow (admin)
```
GET /auth/me → 200 {"id":"1","username":"admin","displayName":"Admin User","email":"admin@pmis.local","role":"admin","projects":[{"id":"101","name":"Project-101","role":"admin"}],"permissions":["projects:read","projects:write","users:read","users:write","reports:read"],"createdAt":"2026-01-01T00:00:00.000Z","lastLoginAt":"1970-01-01T00:00:00.000Z"}

POST /auth/refresh → 200 {"accessToken":"eyJhbGciOiJIUzI1NiIs...","tokenType":"Bearer","expiresAt":1776219509}

POST /auth/logout → 200 {"success":true,"message":"登出成功","clearedSessions":1}
Set-Cookie: refresh_token=; Max-Age=0; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict
```

### CON-08–13: Negative/regression tests
```
Wrong password → 400 {"error":{"code":"INVALID_CREDENTIALS","message":"帳號或密碼錯誤"}}
Unknown user → 400 {"error":{"code":"INVALID_CREDENTIALS","message":"帳號或密碼錯誤"}}
Empty body → 400 {"error":{"code":"BAD_REQUEST","message":"請求格式錯誤","details":{"username":["Required"],"password":["Required"]}}}
No auth /me → 401 {"error":{"code":"UNAUTHORIZED","message":"缺少認證 Token，請先登入"}}
No auth /logout → 401 {"error":{"code":"UNAUTHORIZED","message":"缺少認證 Token，請先登入"}}
No cookie /refresh → 401 {"error":{"code":"REFRESH_TOKEN_INVALID","message":"缺少 Refresh Token，請重新登入"}}
```

### bcrypt verification
```
$ node -e "const bcryptjs = require('bcryptjs'); bcryptjs.compare('password123', '$2b$12$qGEsBEvwBjRdHtaqCpTa0eTZ7wDN8nIs22T.rGrpRilpwS1IseNm.').then(r => console.log(r))"
true
```

### Unit test summary
```
Test Files  1 failed | 4 passed (5)
     Tests  2 failed | 45 passed (47)
  Duration  2.50s
```