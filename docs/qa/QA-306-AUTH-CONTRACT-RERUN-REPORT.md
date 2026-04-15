# QA-306 Auth Contract Rerun Report

**Date:** 2026-04-14  
**Workspace:** `/home/beer8/team-workspace/UI-UX`  
**Scope:** backend auth contract rerun only (`/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`, `/api/v1/auth/me`)  
**Target contract:** `docs/api-contracts-v1.md`

---

## 1) Baseline / branch check

Commands used:
```bash
git rev-parse --short main
git rev-parse --short HEAD
git rev-list --left-right --count main...HEAD
```

Observed at rerun time:
- `main` = `a1267d1`
- `HEAD` = `a1267d1`
- `main...HEAD` = `0 0`

Interpretation:
- The current branch tip and `HEAD` are identical.
- The PM-provided older baseline hash (`d1a1d7a`) is no longer the live ref tip in this workspace snapshot.

---

## 2) Commands used for verification

Scoped backend tests:
```bash
npm test -- src/services/auth.service.test.ts src/repositories/auth.repository.test.ts
```

Results:
- 2 test files passed
- 30 tests passed

Source review files:
- `backend/src/routes/auth.ts`
- `backend/src/types/auth.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/repositories/auth.repository.ts`
- `backend/src/errors/auth.errors.ts`
- `docs/api-contracts-v1.md`

---

## 3) Endpoint verdict table

| Endpoint | Smoke result | Contract result | Verdict |
|---|---:|---:|---|
| `POST /api/v1/auth/login` | PASS | FAIL | Stub is runnable, but response payload still contains `_stub`; request schema also accepts optional `email` in addition to contract's `username + password + rememberMe`. |
| `POST /api/v1/auth/refresh` | PASS | FAIL | Cookie-only behavior is aligned, but error model is not fully aligned and response still contains `_stub`; contract expects `REFRESH_TOKEN_INVALID` / `SESSION_REVOKED` / `REFRESH_TOKEN_REUSED`. |
| `POST /api/v1/auth/logout` | PASS | FAIL | Returns `success + message + clearedSessions`, but still appends `_stub`; contract does not include `_stub`. |
| `GET /api/v1/auth/me` | PASS | FAIL | Core fields are close, but response still includes `_stub` and `lastLoginAt` is nullable in implementation while contract requires a string. |

---

## 4) Contract-shape check by endpoint

### `POST /api/v1/auth/login`
**Contract expects:**
- request: `username`, `password`, optional `rememberMe`
- response: `accessToken`, `tokenType`, `expiresAt`, `user`
- errors: `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `RATE_LIMIT_EXCEEDED`

**Current implementation evidence:**
- `LoginBodySchema` requires `username` and `password`, and also allows optional `email`.
- service call is `authService.login(username, password, ..., rememberMe)`.
- response body includes `accessToken`, `tokenType`, `expiresAt`, `user`, plus `_stub`.
- invalid credentials currently map to `INVALID_CREDENTIALS` / `ACCOUNT_LOCKED` in service logic.

**Assessment:** request/response are materially close, but not fully aligned because of extra request field support and `_stub` in the response.

### `POST /api/v1/auth/refresh`
**Contract expects:**
- no request body
- refresh token from httpOnly cookie only
- response: `accessToken`, `tokenType`, `expiresAt`
- errors: `REFRESH_TOKEN_INVALID`, `SESSION_REVOKED`, `REFRESH_TOKEN_REUSED`

**Current implementation evidence:**
- route reads `cookies['refresh_token']` only; body fallback is removed.
- if cookie is missing, route returns `401 REFRESH_TOKEN_INVALID`.
- service validates JWT, looks up session, and may throw `SESSION_REVOKED` or `SESSION_EXPIRED`.
- `RefreshTokenReusedError` exists in `backend/src/errors/auth.errors.ts`, but I did not find a route/service path that emits `REFRESH_TOKEN_REUSED` for this rerun scope.
- response body includes `accessToken`, `tokenType`, `expiresAt`, plus `_stub`.

**Assessment:** cookie-only request shape is aligned, but error model and response payload are not fully aligned.

### `POST /api/v1/auth/logout`
**Contract expects:**
- request body: optional `logoutAllDevices`
- response: `success: true`, `message`, `clearedSessions`

**Current implementation evidence:**
- route accepts body schema with optional `logoutAllDevices`.
- service returns `clearedSessions`.
- response body includes `success: true`, `message`, `clearedSessions`, plus `_stub`.

**Assessment:** core contract fields are aligned, but `_stub` remains in the response.

### `GET /api/v1/auth/me`
**Contract expects:**
- response: `id`, `username`, `displayName`, `email`, `role`, `projects`, `permissions`, `createdAt`, `lastLoginAt`
- `lastLoginAt` is documented as a string

**Current implementation evidence:**
- service returns `id`, `username`, `displayName`, `email`, `role`, `projects`, `permissions`, `createdAt`, `lastLoginAt`.
- implementation uses `lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null`.
- response body includes `_stub`.

**Assessment:** mostly aligned, but `lastLoginAt` nullable behavior and `_stub` prevent full contract alignment.

---

## 5) `_stub` / `DB_PENDING` check

Confirmed still present in the current backend auth stack:
- `_stub` is still emitted by all four auth endpoints in `backend/src/routes/auth.ts` / `backend/src/types/auth.ts`.
- `DB_PENDING` markers remain in route, service, repository, and type comments.
- repository is still `AuthRepositoryStub`; no live DB migration path is completed here.
- There is no evidence that live DB auth is being falsely claimed as finished.

Verdict:
- `_stub` / `DB_PENDING` are **still retained**.
- The implementation **does not** incorrectly claim live DB completion.

---

## 6) Error-model notes

Observed aligned/error-related changes:
- `RefreshTokenInvalidError` exists and is mapped to `REFRESH_TOKEN_INVALID`.
- `RefreshTokenReusedError` exists with `REFRESH_TOKEN_REUSED / 403`.
- `AccountDisabledError` maps to `ACCOUNT_LOCKED / 400`.
- `INVALID_CREDENTIALS` remains the invalid-login code.

Observed mismatch/risk:
- `/refresh` does not show a clear runtime path in this rerun that emits `REFRESH_TOKEN_REUSED`.
- `/me` returns `lastLoginAt` as nullable, while the contract describes a string.
- Success responses still contain `_stub`, which is not part of the published contract.

---

## 7) Final determination

**Overall status: PARTIAL**

- Stub smoke: **PASS**
- Contract alignment: **FAIL**

Reason:
- The auth stub remains runnable and clearly marked as stub/DB_PENDING.
- The BE-307 changes improved the shapes, but the current implementation is **not yet fully contract-aligned** with `docs/api-contracts-v1.md` because of remaining response-field drift and incomplete error-model alignment.

### Can this be the current auth stub baseline?
**Yes, as the current stub baseline for smoke verification.**  
**No, as a fully contract-aligned baseline.**

---

## 8) Recommended next step

Keep this as the current stub smoke baseline, but do **not** mark auth as contract-complete until the remaining drift is resolved:
1. remove or document the `_stub` marker in success payloads,
2. align `/me.lastLoginAt` to the published contract type,
3. confirm the `/refresh` error path for `REFRESH_TOKEN_REUSED`,
4. re-run the same four-endpoint contract check after that fix.
