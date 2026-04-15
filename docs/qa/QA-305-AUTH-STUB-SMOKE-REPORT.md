# QA-305 Auth Stub Smoke / Contract Verification Report

**Date:** 2026-04-14  
**Workspace:** `/home/beer8/team-workspace/UI-UX`  
**Scope:** backend auth stub endpoints only (`/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`, `/api/v1/auth/me`)  
**Baseline check:** `main == HEAD` (`4ce1a83d520bde0ff86ef2664f817946ee68c8f6`)

---

## 1) Summary Verdict

**Overall status: PARTIAL**

- The backend auth stub is runnable and the scoped backend unit tests pass.
- Runtime smoke confirms the routes return stub-marked responses and do **not** claim live DB auth is already connected.
- However, the current implementation is **not contract-aligned** with `docs/api-contracts-v1.md` for several auth response/error shapes.

---

## 2) Evidence Collected

### 2.1 Scoped test execution
Command:
```bash
npm test -- src/services/auth.service.test.ts src/repositories/auth.repository.test.ts
```
Result: **PASS**
- 2 test files passed
- 28 tests passed

### 2.2 Runtime smoke
Backend server started locally from `backend/` with:
```bash
NODE_ENV=development npm run dev
```
Smoke requests were sent against `http://127.0.0.1:3000/api/v1/auth/*`.

### 2.3 Baseline check
- `git rev-parse main` = `4ce1a83d520bde0ff86ef2664f817946ee68c8f6`
- `git rev-parse HEAD` = `4ce1a83d520bde0ff86ef2664f817946ee68c8f6`
- `main` and `HEAD` are identical.

---

## 3) Endpoint Smoke Conclusions

| Endpoint | Smoke result | Contract result | Notes |
|---|---:|---:|---|
| `POST /api/v1/auth/login` | PASS | FAIL | Returns stub 401 on bad credentials; no live DB claim. Successful happy-path is stubbed in source and returns `_stub`, but response shape differs from API contract. |
| `POST /api/v1/auth/refresh` | PASS | FAIL | Returns 200 with `_stub`; supports cookie or body token fallback. Contract says cookie-only and different error codes. |
| `POST /api/v1/auth/logout` | PASS | FAIL | Returns 200 with `_stub` and clears cookie, but response body lacks `success` and `clearedSessions`. |
| `GET /api/v1/auth/me` | PASS | FAIL | Returns 200 with `_stub`, but response fields differ from contract (`userId`/`name` vs `id`/`displayName`, missing `createdAt`/`lastLoginAt`). |

---

## 4) Verified Stub Behaviour

### 4.1 `/login`
Confirmed in source and tests:
- Uses `AuthRepositoryStub`
- Hardcoded stub user: `stub@example.com` / `stub_user`
- Successful response includes `_stub`
- `refresh_token` cookie is set on success
- Invalid credentials return `401` with:
  ```json
  {"error":{"code":"INVALID_CREDENTIALS","message":"帳號或密碼錯誤"}}
  ```

### 4.2 `/refresh`
Confirmed in source and runtime:
- Accepts refresh token from httpOnly cookie, and also body fallback (`refreshToken`) if present
- Returns `200` with `_stub`
- JWT signature is validated
- Stub repository path is still present; live DB session lookup is not connected
- Missing token returns `401 UNAUTHORIZED`

### 4.3 `/logout`
Confirmed in source and runtime:
- Requires auth preHandler
- Clears `refresh_token` cookie with `Max-Age=0`
- Returns `200` with `_stub`
- Uses stub revocation path, not live DB

### 4.4 `/me`
Confirmed in source and runtime:
- Requires auth preHandler
- Returns stub user/project summary data with `_stub`
- Uses stub repo data, not live DB

---

## 5) Contract Mismatches / Risks

### 5.1 Login contract mismatch
`docs/api-contracts-v1.md` expects:
- request body: `username`, `password`, optional `rememberMe`
- success response includes `accessToken`, `tokenType`, `expiresAt`, and `user`

Current implementation uses:
- request body schema: `email`, `password` (plus optional `username` field in schema, but route reads `email`)
- success response: `accessToken`, `tokenType`, `expiresIn`, `_stub`
- no `user` object in body

### 5.2 Refresh contract mismatch
Contract says:
- refresh token is cookie-based
- errors use `REFRESH_TOKEN_INVALID`, `SESSION_REVOKED`, `REFRESH_TOKEN_REUSED`

Current implementation:
- accepts cookie or body fallback
- returns `UNAUTHORIZED` for missing/invalid token path
- service can throw `SESSION_REVOKED` and `SESSION_EXPIRED`, but not the contract’s `REFRESH_TOKEN_INVALID` / `REFRESH_TOKEN_REUSED`

### 5.3 Logout contract mismatch
Contract expects:
- `success: true`
- `message`
- `clearedSessions: number`

Current implementation returns:
- `message: 'logged out'`
- `_stub`
- no `success`
- no `clearedSessions`

### 5.4 Me contract mismatch
Contract expects:
- `id`, `username`, `displayName`, `email`, `role`
- `projects[]`
- `permissions[]`
- `createdAt`, `lastLoginAt`

Current implementation returns:
- `userId`, `email`, `role`, `name`, `projects`, `permissions`, `_stub`
- no `displayName`, `createdAt`, or `lastLoginAt`
- `name` is stubbed from `username`

### 5.5 Error model alignment
The implementation is internally consistent, but not fully aligned to API contract:
- `INVALID_CREDENTIALS` / `UNAUTHORIZED` / `SESSION_REVOKED` / `SESSION_EXPIRED` are used in code
- contract also mentions `ACCOUNT_LOCKED`, `REFRESH_TOKEN_INVALID`, `REFRESH_TOKEN_REUSED`, `SESSION_CLEAR_FAILED`
- no evidence in the current runtime that those contract error codes are implemented for these routes

### 5.6 Live DB claim risk
No source path or runtime response claims live DB auth is already connected. Instead, the implementation repeatedly marks the path as DB_PENDING and returns `_stub` in successful responses. That is correct for this stage.

---

## 6) Final Endpoint Status

- **POST /api/v1/auth/login** — PASS for stub smoke, FAIL for contract alignment
- **POST /api/v1/auth/refresh** — PASS for stub smoke, FAIL for contract alignment
- **POST /api/v1/auth/logout** — PASS for stub smoke, FAIL for contract alignment
- **GET /api/v1/auth/me** — PASS for stub smoke, FAIL for contract alignment

---

## 7) Recommendations

1. Keep the current stub smoke gate as-is until live DB integration lands.
2. Update `docs/api-contracts-v1.md` or the backend implementation so response/error shapes match one canonical contract.
3. Decide whether `/login` should use `email` or `username` as the primary request field; current code and contract diverge.
4. Decide whether `/refresh` should remain cookie-only or keep the body fallback; if fallback stays, document it.
5. Align `/logout` and `/me` response payloads to the published contract before declaring BE-305 contract-complete.

---

## 8) Notes

- No unrelated UI QA was run.
- Baseline and HEAD are identical, so this verification is against the current mainline state.
- The current auth stub is correctly marked as stubbed and should **not** be reported as live auth complete.
