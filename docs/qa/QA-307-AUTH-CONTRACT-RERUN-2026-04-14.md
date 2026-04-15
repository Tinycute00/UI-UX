# Auth Contract Rerun Report

**Date:** 2026-04-14  
**Baseline:** 638f717 (main)  
**Report ID:** QA-307-AUTH-CONTRACT-RERUN-2026-04-14  
**Status:** ⚠️ PARTIAL  

---

## Executive Summary

This report documents the final auth contract verification conducted on baseline **638f717** (main branch). The verification confirms PM's prior validation of commits c5b862d and 638f717, focusing on four auth endpoints: POST /api/v1/auth/login, POST /api/v1/auth/refresh, POST /api/v1/auth/logout, and GET /api/v1/auth/me.

**Verdict:** ⚠️ **PARTIAL** — Contract-aligned on all verifiable paths. Runtime smoke tests confirm no _stub fields in responses, REFRESH_TOKEN_REUSED path is exposed and functional, and lastLoginAt conforms to the published string contract. Login success path is blocked by stub password hash limitation (documented, not a contract regression).

---

## 1. Baseline Verification

### 1.1 Git Status
```
HEAD: 638f717 fix(BE-314): reconcile auth.ts response schemas with runtime and contract
Branch: main
Status: Ahead of origin/main by 1 commit (local docs changes only)
Drift from expected baseline: NONE
```

### 1.2 Relevant Commits in Baseline
- `638f717` - fix(BE-314): reconcile auth.ts response schemas with runtime and contract
- `c5b862d` - fix(auth): remove _stub from responses, add REFRESH_TOKEN_REUSED path, fix lastLoginAt type (BE-312)
- `8e307df` - be(prisma): BE-311 init_auth_schema — first migration generated and applied

**Conclusion:** HEAD is at the expected commit. No drift detected.

---

## 2. Implementation Evidence

### 2.1 Key Files Reviewed

| File | Purpose | Lines |
|------|---------|-------|
| `backend/src/routes/auth.ts` | Route handlers for 4 endpoints | 173 |
| `backend/src/types/auth.ts` | Zod schemas and TypeScript types | 212 |
| `backend/src/services/auth.service.ts` | Business logic | 359 |
| `backend/src/errors/auth.errors.ts` | Error classes (inc. RefreshTokenReusedError) | 129 |
| `backend/src/repositories/auth.repository.ts` | Repository interface + stub implementation | 209 |
| `docs/api-contracts-v1.md` | Published API contract | 1552 |

### 2.2 Contract Alignment Verification

#### LoginResponseSchema (lines 145-151 in types/auth.ts)
```typescript
export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresAt: z.number().int().positive(),  // Unix timestamp (seconds)
  user: LoginUserSchema,
});
```
✅ **Aligned** with contract LoginResponseDTO

#### RefreshResponseSchema (lines 156-161 in types/auth.ts)
```typescript
export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresAt: z.number().int().positive(),  // Unix timestamp (seconds)
});
```
✅ **Aligned** with contract RefreshTokenResponseDTO

#### LogoutResponseSchema (lines 166-171 in types/auth.ts)
```typescript
export const LogoutResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  clearedSessions: z.number().int().nonnegative(),
});
```
✅ **Aligned** with contract LogoutResponseDTO

#### MeResponseSchema (lines 177-189 in types/auth.ts)
```typescript
export const MeResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'supervisor', 'vendor']),
  projects: z.array(ProjectSummarySchema),
  permissions: z.array(z.string()),
  createdAt: z.string(),
  lastLoginAt: z.string(),  // ← ISO 8601 string, NOT nullable
});
```
✅ **Aligned** with contract GetCurrentUserResponseDTO

---

## 3. Runtime Smoke Tests

### 3.1 Environment Setup
- **Backend started:** ✅ Port 3000
- **Health check:** ✅ `{ "status": "ok", ... }`
- **Test tool:** curl with cookie jar

### 3.2 Test Results by Endpoint

#### TEST 1: GET /api/v1/auth/me (Success Path)
**Request:**
```bash
curl -s -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <valid_jwt>"
```

**Response:**
```json
{
  "id": "1",
  "username": "stub_user",
  "displayName": "Stub User",
  "email": "stub@example.com",
  "role": "admin",
  "projects": [
    {
      "id": "101",
      "name": "Project-101",
      "role": "admin"
    }
  ],
  "permissions": [
    "projects:read",
    "projects:write",
    "users:read",
    "users:write",
    "reports:read"
  ],
  "createdAt": "2026-01-01T00:00:00.000Z",
  "lastLoginAt": "1970-01-01T00:00:00.000Z"
}
```

**Verification:**
- ✅ Returns 200 OK
- ✅ No `_stub` field present
- ✅ `lastLoginAt` is **string** type (ISO 8601 format)
- ✅ All contract fields present: id, username, displayName, email, role, projects, permissions, createdAt, lastLoginAt
- ✅ projects array contains objects with id, name, role

#### TEST 2: GET /api/v1/auth/me (Unauthorized)
**Request:**
```bash
curl -s -X GET http://localhost:3000/api/v1/auth/me
```

**Response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "缺少認證 Token，請先登入"
  }
}
```

**Verification:**
- ✅ Returns 401 Unauthorized
- ✅ Error format matches contract: `{ error: { code, message } }`

#### TEST 3: POST /api/v1/auth/logout (Success Path)
**Request:**
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <valid_jwt>" \
  -b "refresh_token=<valid_refresh_token>"
```

**Response:**
```json
{
  "success": true,
  "message": "登出成功",
  "clearedSessions": 1
}
```

**Verification:**
- ✅ Returns 200 OK
- ✅ No `_stub` field present
- ✅ Response matches LogoutResponseDTO: success (literal true), message, clearedSessions

#### TEST 4: POST /api/v1/auth/refresh (Token Reuse Detection - REFRESH_TOKEN_REUSED)
**Scenario:** After logout, attempt to refresh with the same token

**Request:**
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/refresh \
  -b "refresh_token=<revoked_token>"
```

**Response:**
```json
{
  "error": {
    "code": "REFRESH_TOKEN_REUSED",
    "message": "偵測到 refresh token 重複使用，所有 session 已撤銷"
  }
}
```

**Verification:**
- ✅ Returns 403 Forbidden
- ✅ Error code is `REFRESH_TOKEN_REUSED` (not generic UNAUTHORIZED)
- ✅ **CRITICAL:** This path is exposed and functional per BE-312

**Evidence in Code (auth.service.ts lines 274-280):**
```typescript
// BE-312: Check if token hash is in the revoked set (reuse detection)
if (_revokedRefreshJtis.has(tokenHash)) {
  await this.repo.revokeAllUserSessions(BigInt(payload.userId));
  throw new RefreshTokenReusedError();
}
```

#### TEST 5: POST /api/v1/auth/login (Invalid Credentials)
**Request:**
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bad_user","password":"bad_password"}'
```

**Response:**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "帳號或密碼錯誤"
  }
}
```

**Verification:**
- ✅ Returns 400 Bad Request
- ✅ Error code matches contract: `INVALID_CREDENTIALS`

#### TEST 6: POST /api/v1/auth/login (Validation Error)
**Request:**
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"a","password":"short"}'
```

**Response:**
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "請求格式錯誤",
    "details": {
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

**Verification:**
- ✅ Returns 400 Bad Request
- ✅ Validation details provided

---

## 4. Contract Compliance Verification

### 4.1 Requirement: No _stub Fields in Success Payloads

**Status:** ✅ **PASSED**

**Evidence:**
- `/me` response: No `_stub` field
- `/logout` response: No `_stub` field
- Response schemas in `types/auth.ts` do not define any `_stub` fields
- BE-312 explicitly removed `_stub` from responses

### 4.2 Requirement: REFRESH_TOKEN_REUSED Path Exposed

**Status:** ✅ **PASSED**

**Evidence:**
- Error class exists: `RefreshTokenReusedError` (auth.errors.ts lines 112-117)
- Error code: `REFRESH_TOKEN_REUSED`
- HTTP status: 403
- Runtime test confirmed: After logout + refresh with revoked token, server returns REFRESH_TOKEN_REUSED
- Implementation in auth.service.ts lines 274-280 uses `_revokedRefreshJtis` Set for detection

**Note:** This is stub-level implementation. Production will use `auth.revoked_tokens` table.

### 4.3 Requirement: /me.lastLoginAt is String (Not Nullable)

**Status:** ✅ **PASSED**

**Evidence:**
- Schema definition (types/auth.ts line 188): `lastLoginAt: z.string()`
- Runtime response: `"lastLoginAt": "1970-01-01T00:00:00.000Z"` — ISO 8601 string format
- Contract definition (api-contracts-v1.md line 216): `lastLoginAt: string`
- BE-312 fixed this from nullable Date to required string

**Implementation Note:** In the stub, when `lastLoginAt` is null in the user record, the service falls back to epoch ISO string (`new Date(0).toISOString()`), ensuring the response always contains a valid string per contract.

### 4.4 Requirement: DB vs Stub Status Documentation

**Status:** ✅ **DOCUMENTED**

**Evidence:**
- Multiple `DB_PENDING` comments throughout codebase (auth.service.ts, auth.repository.ts, types/auth.ts)
- Repository uses `AuthRepositoryStub` explicitly (auth.ts line 26)
- Comments indicate what will change when live DB is connected:
  - `// DB_PENDING: Replace AuthRepositoryStub with PrismaAuthRepository once live DB is ready`
  - `// DB_PENDING: queries auth.sessions WHERE refresh_token_hash = $1`
  - `// DB_PENDING: updates auth.users.last_login_at`

---

## 5. Limitations and Blockers

### 5.1 Login Success Path: BLOCKED by Stub Limitation

**Issue:** Cannot test successful login due to stub password hash not being a valid bcrypt hash.

**Technical Details:**
- Stub password hash: `$2b$12$stubHashForTestingDoNotUseInProduction000000000000000000`
- This is not a valid bcrypt hash structure
- `bcrypt.compare()` always returns false for this hash
- No password will successfully authenticate with the stub

**Impact:** 
- Cannot test full login success flow
- Cannot obtain refresh token via login for testing
- Workaround: Manually generate JWT tokens for authenticated endpoint testing

**Classification:** 
- This is a **stub limitation**, NOT a contract regression
- The login response schema and error handling are contract-aligned
- When PrismaAuthRepository is connected with real bcrypt hashes, login will work

### 5.2 Refresh Success Path: LIMITED by Stub Session Lookup

**Issue:** Stub repository only recognizes specific hardcoded session hash `'stub-token-hash'`.

**Impact:**
- Cannot test refresh with normally-generated tokens
- REFRESH_TOKEN_INVALID is returned for valid JWTs not in stub's hardcoded list
- REFRESH_TOKEN_REUSED path was verified using logout-triggered revocation

**Classification:**
- This is a **stub limitation**, NOT a contract regression
- The refresh response schema and error codes are contract-aligned

---

## 6. Remaining Drift

The following items represent technical debt or future work, NOT contract violations:

| Item | Status | Notes |
|------|--------|-------|
| AuthRepositoryStub → PrismaAuthRepository | ⏳ PENDING | Waiting for live DB connection |
| Real bcrypt password comparison | ⏳ PENDING | Blocked by stub hash limitation |
| Session persistence in PostgreSQL | ⏳ PENDING | auth.sessions table exists but not connected |
| lastLoginAt real timestamp | ⏳ PENDING | Currently falls back to epoch string |
| projectIds from auth.user_project_roles | ⏳ PENDING | Currently stub returns hardcoded values |

**None of these items represent contract drift.** The API responses conform to the published contract; the data sources are stubbed pending DB connection.

---

## 7. Final Verdict

### Overall Status: ⚠️ PARTIAL

| Endpoint | Smoke Result | Contract Result | Notes |
|----------|--------------|-----------------|-------|
| POST /api/v1/auth/login | ⚠️ Partial | ✅ Aligned | Error paths verified; success blocked by stub hash |
| POST /api/v1/auth/refresh | ⚠️ Partial | ✅ Aligned | REFRESH_TOKEN_REUSED verified; success limited by stub |
| POST /api/v1/auth/logout | ✅ Pass | ✅ Aligned | Full success path verified |
| GET /api/v1/auth/me | ✅ Pass | ✅ Aligned | Full success path verified; lastLoginAt is string |

### Key Findings

1. **✅ No _stub fields** in any success payloads
2. **✅ REFRESH_TOKEN_REUSED** path exposed and functional (verified via logout-triggered reuse detection)
3. **✅ lastLoginAt** is string type per contract (ISO 8601 format, non-null)
4. **✅ Error codes** match contract specifications
5. **⚠️ Login success** blocked by stub password hash limitation (not a regression)
6. **✅ DB_PENDING status** clearly documented throughout codebase

### Acceptance Criteria Assessment

| Criterion | Status |
|-----------|--------|
| Confirm HEAD is 638f717/main | ✅ Confirmed |
| Inspect route/service/type/contract evidence | ✅ Completed |
| Runtime smoke for 4 endpoints | ✅ Completed (with noted limitations) |
| Verify no _stub in payloads | ✅ Verified |
| Verify REFRESH_TOKEN_REUSED path | ✅ Verified |
| Verify /me.lastLoginAt is string | ✅ Verified |
| Distinguish stub from live DB | ✅ Documented |
| State environment blockers plainly | ✅ Documented |

---

## 8. Appendices

### A. Test Commands Reference

```bash
# Generate valid JWT for testing
node -e "const { sign } = require('jsonwebtoken'); console.log(sign({ userId: '1', role: 'admin' }, 'dev-secret-key-at-least-32-characters-long!', { expiresIn: 900 }));"

# Test /me
curl -s -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"

# Test /logout
curl -s -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <token>" \
  -b "refresh_token=<refresh_token>"

# Test /refresh
curl -s -X POST http://localhost:3000/api/v1/auth/refresh \
  -b "refresh_token=<refresh_token>"

# Test /login (error path)
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bad","password":"wrong"}'
```

### B. File References

- `backend/src/routes/auth.ts` - Route handlers
- `backend/src/types/auth.ts` - Response schemas (contract source of truth)
- `backend/src/services/auth.service.ts` - Business logic with _revokedRefreshJtis
- `backend/src/errors/auth.errors.ts` - RefreshTokenReusedError definition
- `docs/api-contracts-v1.md` - Published contract

### C. Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-04-14 | 1.0 | Initial rerun report |

---

*Report generated by: ulw-loop / Sisyphus*  
*Verification method: Runtime smoke testing with curl*  
*Baseline: 638f717 (main branch HEAD)*
