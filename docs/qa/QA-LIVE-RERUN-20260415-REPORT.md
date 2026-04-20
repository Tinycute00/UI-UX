# QA LIVE RERUN 2026-04-15

- **Task**: PM QA live rerun — health, auth basics, frontend API preconditions
- **Workspace**: `/home/beer8/team-workspace/UI-UX`
- **Backend**: live at `http://localhost:3000/api/v1`
- **Report target**: `discord:1491771769072255208:1493781212853178458`
- **Status**: partial

## PASS

1. **Health endpoint is live and healthy**
   - Request: `curl -i http://localhost:3000/api/v1/health`
   - Result: `HTTP/1.1 200 OK`
   - Body: `{"status":"ok","timestamp":"2026-04-15T01:31:31.085Z","version":"1.0.0"}`
   - Evidence: live HTTP response headers/body from terminal verification.

2. **Backend auth routes are mounted and enforce auth on protected paths**
   - `GET /api/v1/auth/me` without token → `401 UNAUTHORIZED`
   - `POST /api/v1/auth/logout` without token → `401 UNAUTHORIZED`
   - `POST /api/v1/auth/refresh` without refresh cookie → `401 REFRESH_TOKEN_INVALID`
   - Evidence: live HTTP response headers/body from terminal verification.

3. **Frontend API wiring preconditions are present in source**
   - `src/api/config.js` sets `API_BASE_URL = '/api/v1'`
   - `src/api/client.js` attaches `Authorization: Bearer <token>` when session storage token exists
   - `src/app/dashboard-init.js` calls API adapters via `Promise.all(...)`
   - Evidence: source inspection in workspace.

## FAIL

1. **Auth happy-path login could not be completed with the obvious test credentials**
   - Attempt: `POST /api/v1/auth/login` with `{"username":"testuser","password":"password123"}`
   - Result: `HTTP/1.1 400 Bad Request`
   - Body: `{"error":{"code":"INVALID_CREDENTIALS","message":"帳號或密碼錯誤"}}`
   - Interpretation: the live backend did not accept the expected test credential pair; this blocks a full login → me/refresh/logout cycle.

## BLOCKED

1. **Auth full flow closure is still blocked by credentials / migration / seed-data uncertainty**
   - The live backend responds correctly to protected-route unauthenticated checks, but there is no confirmed valid live user credential set available in this workspace to complete the happy path.
   - The repo also still contains stub/layered DB_PENDING auth code paths and unresolved live DB schema/credential dependencies in docs/source.
   - Remaining failure points are therefore precise:
     - no confirmed working login credential for the live backend
     - no verified live user/session seed for a successful `/auth/login`
     - no end-to-end proof that refresh cookie issuance + reuse path works on live data
     - no proof that live DB migration/role credentials are fully reconciled for auth persistence

2. **Frontend-to-live-backend contract validation remains precondition-only**
   - We confirmed the frontend points to `/api/v1`, but we did not complete a browser-side live login because auth credentials are unresolved.
   - So the frontend is wiring-ready, but its live auth integration remains blocked by backend credential/state availability, not by a missing API base URL.

## Evidence

### Live HTTP probes
- `GET /api/v1/health` → `200 OK`
- `POST /api/v1/auth/login` with `testuser/password123` → `400 BAD_REQUEST`, `INVALID_CREDENTIALS`
- `GET /api/v1/auth/me` without token → `401 UNAUTHORIZED`
- `POST /api/v1/auth/refresh` without cookie → `401 REFRESH_TOKEN_INVALID`
- `POST /api/v1/auth/logout` without token → `401 UNAUTHORIZED`

### Source inspection
- `src/api/config.js`: `API_BASE_URL = '/api/v1'`
- `src/api/client.js`: Bearer token handling for requests
- `src/app/dashboard-init.js`: dashboard loads through API adapters
- `backend/src/routes/auth.ts`: login/logout/refresh/me routes present
- `backend/src/repositories/auth.repository.ts`: stub repository still used
- `backend/src/services/auth.service.ts`: DB_PENDING markers remain for live DB operations

## Recommendation

- Backend/DB: provide the confirmed live auth seed or production/staging credentials that should succeed on `/api/v1/auth/login`.
- QA: rerun the same minimal sequence once the credential issue is resolved, then complete the cookie-backed `/me` and `/refresh` checks.
- Frontend: keep the current `/api/v1` wiring, but do not mark the auth integration fully closed until the live login path is demonstrated.
