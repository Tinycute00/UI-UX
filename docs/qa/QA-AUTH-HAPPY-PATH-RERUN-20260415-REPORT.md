# QA AUTH HAPPY PATH RERUN 2026-04-15

- **Task**: PM live auth happy-path / refresh preflight rerun
- **Workspace**: `/home/beer8/team-workspace/UI-UX`
- **Report target**: `discord:1491771769072255208:1493781212853178458`
- **Test accounts used**: `admin / password123`, `testuser / password123`, `admin@pmis.local / password123`
- **Status**: PASS

## Summary

I reran the live auth happy path against the running backend and verified:
- login succeeds for the provided accounts
- `/api/v1/auth/me` succeeds with a valid bearer token
- `/api/v1/auth/refresh` succeeds with the issued refresh cookie
- the backend issues the refresh cookie with the expected `httpOnly` / `path=/api/v1/auth` shape

The earlier auth-blocker interpretation is no longer current for this live rerun.

## PASS

1. **Live login succeeds for all PM-provided test accounts**
   - `POST /api/v1/auth/login` with `admin / password123` → `200 OK`
   - `POST /api/v1/auth/login` with `testuser / password123` → `200 OK`
   - `POST /api/v1/auth/login` with `admin@pmis.local / password123` → `200 OK`
   - Observed response includes `accessToken`, `tokenType: Bearer`, `expiresAt`, and `user`.

2. **Protected `/api/v1/auth/me` works with a valid bearer token**
   - `GET /api/v1/auth/me` with `Authorization: Bearer <accessToken>` → `200 OK`
   - Response body includes `id`, `username`, `displayName`, `email`, `role`, `projects`, `permissions`, `createdAt`, `lastLoginAt`.

3. **Refresh preflight is present and works with the issued cookie**
   - `POST /api/v1/auth/login` sets `refresh_token` as an `HttpOnly` cookie.
   - Cookie scope observed in curl cookie jar: `Path=/api/v1/auth`.
   - `POST /api/v1/auth/refresh` with that cookie → `200 OK`.
   - Response includes new `accessToken`, `tokenType: Bearer`, `expiresAt`.

4. **Residual issue classification is now precise**
   - This rerun does **not** show a cookie-setting failure.
   - This rerun does **not** show a refresh-flow failure.
   - This rerun does **not** show a frontend-wiring failure for the backend contract itself.
   - The previously observed auth block is therefore best treated as stale / environment-state-specific, not a current product blocker.

## FAIL

- **No live product failure reproduced in this rerun** for the scoped happy path.
- I did not find a current failure that needs to be classified as cookie-setting, refresh-flow, frontend-wiring, or migration/DB_PENDING for the verified flow.

## BLOCKED

- **Browser-side frontend wiring was not rechecked in this rerun**.
  - I verified the backend contract directly via HTTP.
  - I did not need a browser session to prove the live login / refresh preflight because the backend endpoints already closed successfully.
  - If PM wants a UI-specific rerun, that would be a separate frontend-browser verification task.

## Evidence

### Live HTTP results
- `POST /api/v1/auth/login` with `admin / password123` → `200 OK`
- `POST /api/v1/auth/login` with `testuser / password123` → `200 OK`
- `POST /api/v1/auth/login` with `admin@pmis.local / password123` → `200 OK`
- `GET /api/v1/auth/me` with bearer token → `200 OK`
- `POST /api/v1/auth/refresh` with refresh cookie → `200 OK`

### Cookie evidence
- `refresh_token` set by login response
- `HttpOnly`
- `Path=/api/v1/auth`
- cookie jar confirms the backend is issuing refresh state for the auth path

### Source evidence relevant to the residual-risk question
- `src/api/adapters/auth-adapter.js` uses `/api/v1/auth/login`, `/refresh`, and `/me`
- `backend/src/routes/auth.ts` exposes `/login`, `/logout`, `/refresh`, `/me`
- `backend/src/routes/auth.ts` sets the refresh cookie on login
- `backend/src/plugins/jwtAuth.ts` accepts bearer tokens or `access_token` cookie for protected routes

## Residual risk notes

- If anyone still sees `UNAUTHORIZED` on `/auth/me`, the most likely cause is a missing/incorrect bearer token on the request, not a missing route.
- If anyone still sees `REFRESH_TOKEN_INVALID`, the most likely cause is an absent refresh cookie or a request that did not carry cookie state.
- I did not reproduce a `migration/DB_PENDING` blocker in the live happy path.

## PM-ready conclusion

**Current rerun verdict: PASS.**

The live auth happy path is working with the provided credentials, the refresh preflight is working, and the earlier blocker classification should be considered outdated for this rerun.
