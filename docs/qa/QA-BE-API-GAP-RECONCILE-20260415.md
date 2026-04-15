# QA Report — BE-API-GAP-RECONCILE-20260415

- **Date**: 2026-04-15
- **Scope**: `GET /api/v1/projects/:projectId/progress`, `GET /api/v1/valuations`, `POST /api/v1/safety-inspections`
- **Environment**: local backend at `http://localhost:3000`
- **Auth test account**: `admin / password123`
- **Verification mode**: live HTTP checks against running backend

## Evidence summary

### 1) `GET /api/v1/projects/:projectId/progress`
- `GET /api/v1/projects/101/progress` with Bearer token → **200 OK**
- Response includes `projectId`, `name`, `overallProgress`, `phases`, `lastUpdated`
- `GET /api/v1/projects/0/progress` with Bearer token → **400 BAD_REQUEST**
- `GET /api/v1/projects/101/progress` without token → **401 UNAUTHORIZED**

### 2) `GET /api/v1/valuations`
- `GET /api/v1/valuations` with Bearer token → **200 OK**
- Response includes `items` array and `pagination`
- `GET /api/v1/valuations?projectId=101` → **200 OK**, filtered to project 101 only
- `GET /api/v1/valuations?status=approved` → **200 OK**, filtered to approved items only
- `GET /api/v1/valuations` without token → **401 UNAUTHORIZED**

### 3) `POST /api/v1/safety-inspections`
- Valid JSON body with Bearer token and `Content-Type: application/json` → **201 Created**
- Response returns full inspection object with generated `inspectionId`, timestamps, and `createdBy`
- Missing `items` field → **400 BAD_REQUEST** with `fieldErrors.items = ["Required"]`
- Without token → **401 UNAUTHORIZED**
- Missing `Content-Type: application/json` → **415 Unsupported Media Type**

## Result assessment

### Passed
- Authentication gate works on all three endpoints
- Successful response shapes match the requested contract at a practical QA level
- `projectId=0` validation returns 400 as required
- `valuations` filters by `projectId` and `status` correctly
- `safety-inspections` validates required payload fields and returns field-level errors

### Partial / note
- `POST /api/v1/safety-inspections` is in-memory only; created records are not persistent across server restarts
- Response `inspectionId` advanced from `4`, indicating the running server already had prior in-memory state

### Blocked
- None for the scoped API contract checks

## Risks / follow-up
- `safety-inspections` is stub/in-memory; backend must replace it with persistent storage before production release
- Add explicit contract tests for malformed `projectId`, invalid `inspectionDate`, and empty `items` if not already covered
- Confirm whether `415 Unsupported Media Type` is the desired behavior for missing JSON content type

## Conclusion
The three endpoints are reachable and behave as expected for the requested success and error paths in the current local backend. No contract-breaking defect was observed during this QA pass.
