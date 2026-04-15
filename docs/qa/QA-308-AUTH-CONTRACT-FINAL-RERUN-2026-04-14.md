# Auth Contract Final Rerun Report

**Date:** 2026-04-14  
**Baseline:** 638f717 (main)  
**Report ID:** QA-308-AUTH-CONTRACT-FINAL-RERUN-2026-04-14  
**Status:** ⚠️ PARTIAL

---

## Executive Summary

This report records the final auth contract rerun on the current baseline **638f717**. Scope was restricted to the four requested endpoints only:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Latest verdict
**⚠️ partial**

### Pass basis
- Success payloads observed during runtime did **not** include `_stub`.
- `POST /api/v1/auth/refresh` exposed the `REFRESH_TOKEN_REUSED` path at runtime.
- `GET /api/v1/auth/me` returned `lastLoginAt` as a **string** and not nullable.
- The current baseline remains `638f717`; no baseline drift was found.

### Remaining drift
- The auth runtime is still **stub-backed / DB_PENDING** in behavior and documentation.
- Login success could not be proven end-to-end because the stub password hash does not authenticate like a real bcrypt-backed user.
- Refresh success with a freshly generated token also remained stub-limited; only the reuse/error path was verified.
- This is **not** live DB completion and must not be reported as such.

---

## 1. Baseline Verification

### 1.1 Git state
- `HEAD`: `638f71773466c06ca634db6a143ea15dbfd00e5b`
- Branch: `main`
- Baseline drift: **none**

### 1.2 Baseline commits
- `638f717` — `fix(BE-314): reconcile auth.ts response schemas with runtime and contract`
- `c5b862d` — `fix(auth): remove _stub from responses, add REFRESH_TOKEN_REUSED path, fix lastLoginAt type (BE-312)`

---

## 2. Source Evidence Reviewed

- `backend/src/routes/auth.ts`
- `backend/src/types/auth.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/errors/auth.errors.ts`
- `backend/src/repositories/auth.repository.ts`
- `docs/api-contracts-v1.md`

### Contract checks
- `LoginResponseSchema` matches the published login response contract.
- `RefreshResponseSchema` matches the published refresh response contract.
- `LogoutResponseSchema` matches the published logout response contract.
- `MeResponseSchema.lastLoginAt` is `z.string()` and non-nullable.

---

## 3. Runtime Smoke Results

### 3.1 `GET /api/v1/auth/me`
**Request:**
```bash
curl -s -X GET http://localhost:3000/api/v1/auth/me -H "Authorization: Bearer <valid token>"
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
    { "id": "101", "name": "Project-101", "role": "admin" }
  ],
  "permissions": ["projects:read", "projects:write", "users:read", "users:write", "reports:read"],
  "createdAt": "2026-01-01T00:00:00.000Z",
  "lastLoginAt": "1970-01-01T00:00:00.000Z"
}
```

**Result:**
- Smoke: **PASS**
- Contract: **PASS**
- `_stub`: **not present**
- `lastLoginAt`: **string**, non-null

### 3.2 `POST /api/v1/auth/logout`
**Request:**
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <valid token>" \
  -b "refresh_token=<valid refresh token>"
```

**Response:**
```json
{
  "success": true,
  "message": "登出成功",
  "clearedSessions": 1
}
```

**Result:**
- Smoke: **PASS**
- Contract: **PASS**
- `_stub`: **not present**

### 3.3 `POST /api/v1/auth/refresh`
**Reuse-path request:**
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/refresh \
  -b "refresh_token=<revoked token>"
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

**Result:**
- Smoke: **PASS** for reuse detection path
- Contract: **PASS** for the error path
- `REFRESH_TOKEN_REUSED`: **verified**

**Fresh-token note:**
- A freshly generated token still hit stub limitations and did not prove live refresh success.

### 3.4 `POST /api/v1/auth/login`
**Request:**
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bad_user","password":"********"}'
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

**Validation error check:**
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "請求格式錯誤",
    "details": { "password": ["Password must be at least 8 characters"] }
  }
}
```

**Result:**
- Smoke: **PASS** for error handling
- Contract: **PASS** for error format
- Login success path: **not proven** because stub password hashing blocks real authentication

---

## 4. Contract Compliance Summary

### 4.1 No `_stub` in success payloads
**Status:** PASS

Evidence:
- `/api/v1/auth/me` success payload: no `_stub`
- `/api/v1/auth/logout` success payload: no `_stub`
- Response schemas in `backend/src/types/auth.ts` do not define `_stub`

### 4.2 `REFRESH_TOKEN_REUSED` path
**Status:** PASS

Evidence:
- Runtime returned `REFRESH_TOKEN_REUSED` after token reuse
- Error class exists in `backend/src/errors/auth.errors.ts`
- Service path is present in `backend/src/services/auth.service.ts`

### 4.3 `me.lastLoginAt` string type
**Status:** PASS

Evidence:
- Schema uses `z.string()`
- Runtime returned `"1970-01-01T00:00:00.000Z"`
- No nullable value observed

### 4.4 Stub vs live DB
**Status:** DOCUMENTED, not claimed as complete

Evidence:
- Repo and runtime still indicate stub-backed behavior
- Comments and code paths still refer to `DB_PENDING`
- This does **not** mean live DB is completed

---

## 5. Endpoint Verdict Table

| Endpoint | Smoke Result | Contract Result | Notes |
|---|---:|---:|---|
| `POST /api/v1/auth/login` | PASS (error paths) | PASS | Success path still stub-limited |
| `POST /api/v1/auth/refresh` | PASS (reuse path) | PASS | Fresh-token success not proven |
| `POST /api/v1/auth/logout` | PASS | PASS | No `_stub` present |
| `GET /api/v1/auth/me` | PASS | PASS | `lastLoginAt` is string |

---

## 6. Final Verdict

**⚠️ partial**

Reason:
- The requested contract checks are aligned on all verifiable paths.
- However, the runtime remains stub-backed and not live DB-complete, so I cannot honestly mark the overall rerun as fully complete.

---

## 7. Notes for PM

- Do **not** interpret the current runtime as live DB readiness.
- Do **not** treat `DB_PENDING` comments as proof of completion.
- The key contract issues from the prior rerun are still resolved on the current baseline.

---

*Generated during QA-308 final auth contract rerun on baseline 638f717.*
