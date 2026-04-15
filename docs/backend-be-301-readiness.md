# BE-301 Backend Readiness Note

Date: 2026-04-14
Scope: `/home/beer8/team-workspace/UI-UX`

## Decision Summary

This workspace is **not a backend implementation repo**. It contains a static Vite frontend, API client/adapters, and documentation that already defines the backend contract and task board. Therefore:

- **BE-001 is only partially actionable here**: the repo already has frontend-facing API scaffolding, but no actual backend server scaffold is present in this workspace.
- **BE-002 cannot be implemented end-to-end here** because it depends on backend auth endpoints and a database-auth schema that are explicitly marked as pending design/verification.
- The safest immediate work is to keep the frontend API contract aligned and document the backend handoff points rather than invent a backend implementation that does not exist.

## Evidence from the workspace

### 1) Backend task board
- `docs/backend-task-board.md`
  - BE-001 requires a TypeScript Fastify/Express server with `/api/v1/health`, CORS, Helmet, request logging, and Zod env validation.
  - BE-002 depends on BE-001 and on DB role design for `users`, `roles`, and `refresh_tokens` (or equivalent).
  - The board also marks several schemas as **待 DB role 設計**.

### 2) API contract
- `docs/api-contracts-v1.md`
  - Auth endpoints (`/api/v1/auth/login`, `/logout`, `/refresh`, `/me`) explicitly reference **待 database role 設計** tables such as `auth.users`, `auth.sessions`, and `auth.user_project_roles`.
  - This confirms BE-002 is blocked by missing/unstable schema decisions.

### 3) Implementation backlog
- `docs/implementation-backlog.md`
  - Backend P0 items list `BE-001` as foundation, `BE-002` as JWT auth, and show `BE-002` depends on `DB-001`.
  - The Wave 1 plan shows backend foundation first, then auth, then dashboard/billing/safety.

### 4) PM analysis
- `docs/pm-opencode-analysis-latest.md`
  - The current repo is summarized as **Vite + Vanilla JS, static frontend**.
  - It notes that `src/api/` exists as a new frontend API module, but the data layer is still mock-based.
  - It records the key blocker: backend API and DB schema work are still pending.

### 5) Actual repo structure
Observed files in this workspace:
- `src/main.js`
- `src/app/bootstrap.js`
- `src/app/actions.js`
- `src/api/index.js`
- `src/api/client.js`
- `src/api/config.js`
- `src/api/adapters/dashboard-adapter.js`
- `src/data/*.js` mock data files

Notably absent from this workspace:
- No backend server entrypoint such as `server.js`, `app.ts`, `main.ts`, `src/server/*`, `src/routes/*`, or similar
- No Express/Fastify/Nest/Koa backend scaffold
- No auth service or route implementation
- No DB migration or schema files in this repo for auth tables

## BE-001 status

**Status:** Partially complete / scaffold exists only on the frontend side

### What already exists in this repo
- `src/api/client.js` provides a basic fetch wrapper
- `src/api/config.js` defines `API_MODE`, `API_BASE_URL`, and a token key
- `src/api/index.js` and `src/api/adapters/dashboard-adapter.js` provide an API adapter layer that can switch between mock and API mode

### What does NOT exist here
- No runnable backend HTTP server
- No health endpoint implementation
- No middleware stack (CORS, Helmet, request logging) on the backend side
- No environment variable validation for a Node backend runtime

### Conclusion for BE-001
BE-001 cannot be marked complete in this workspace. The repo already has **frontend API plumbing**, but not the backend server scaffold required by the acceptance criteria.

## BE-002 dependency map

### Can-do-now in this repo
- Keep frontend API adapter boundaries clean
- Preserve contract shape alignment for future auth integration
- Document the exact endpoint expectations and auth payloads

### Blocked until backend/database are ready
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- JWT middleware behavior
- bcrypt hashing and token rotation flows
- Account lockout enforcement

### Database handoff points
BE-002 depends on the backend and database team agreeing on:
- user identity table design
- refresh/session token storage model
- login attempt tracking / lockout model
- role/permission mapping
- whether `auth.*` schemas exist or whether auth data lives in a shared schema

## Minimal backend-ready plan for this repo

If the goal is to unblock later backend work without fabricating a server, this repo should only do the following now:
1. Keep `src/api/` as the contract-aware client/adapters layer.
2. Avoid hardcoding backend assumptions that are not confirmed by schema.
3. Maintain API path versioning under `/api/v1`.
4. Preserve mock fallback behavior until the backend workspace exists.
5. Add/maintain documentation of backend expectations and dependency points.

## Overall assessment for BE-301

- **BE-001:** partial, frontend-side scaffolding exists; backend server still missing
- **BE-002:** blocked on backend + database auth schema
- **Repo readiness:** sufficient for contract alignment, not sufficient for backend implementation
