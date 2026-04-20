# DB-307 — Live Auth State Snapshot for PM / Tiny

**Date:** 2026-04-15  
**Workspace:** `/home/beer8/team-workspace/UI-UX`  
**Target report thread:** `discord:1491771769072255208:1493781212853178458`  
**Scope:** live auth schema / login seed / credentials unblock check

## Executive status

**⚠️ Auth is still blocked in the live DB path.**

I verified the running PostgreSQL container and the live database from the workspace. The result is:
- `auth` and `project` schemas **exist**
- the `auth` schema currently has **no relations / types / functions / tables visible to the app role**
- the app role `pmis` has **no USAGE / CREATE privilege on `auth` or `project`**
- live `project.*` tables exist, but live `auth.users / auth.sessions / auth.audit_login_attempts / auth.user_project_roles` are **not present**
- therefore the current 400 `INVALID_CREDENTIALS` is consistent with **missing live auth seed/state**, not merely a frontend issue

## Verified live facts

### 1) Database / role identity
Command run:
- `docker exec -i pmis-postgres psql -U pmis -d public_works_db ...`

Verified result:
- current database: `public_works_db`
- current user: `pmis`

### 2) Schema presence
Verified schema names:
- `auth`
- `project`

### 3) App-role privileges
Checked via `has_schema_privilege`:
- `auth` USAGE = `false`
- `auth` CREATE = `false`
- `project` USAGE = `false`
- `project` CREATE = `false`

This is a hard blocker for any runtime path that expects the backend to read/write auth tables using this role.

### 4) Live catalog object presence
A catalog scan under `auth` returned:
- `auth_relations=0`
- `auth_types=0`
- `auth_funcs=0`

A relation scan under `project` returned only project tables/indexes/sequences, for example:
- `project.projects`
- `project.progress_measurement_baselines`

No live `auth.users`, `auth.sessions`, `auth.audit_login_attempts`, or `auth.user_project_roles` objects were visible in the live catalog scan.

### 5) Repo evidence of intended auth design
The repo contains a draft auth schema and migration plan:
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260414143005_init_auth_schema/migration.sql`
- `docs/db-303-live-auth-migration-plan.md`
- `docs/auth-schema-architecture.md`

But these are still marked as pending / draft / not yet verified live.

## Answer to PM’s questions

### 1. Does auth-related table data already exist for login?
**No verified live login seed is present.**

There is no live evidence of:
- `auth.users`
- `auth.sessions`
- `auth.refresh_tokens` or equivalent live token table
- `auth.audit_login_attempts`

So the current login failure is best explained by **missing live auth data and/or missing auth schema execution path**, not by an isolated credential typo.

### 2. Is this migration-only, seed-only, or credentials/permissions?
**It is a combination, with the strongest live blocker being permissions + missing auth objects.**

Current evidence points to:
- **schema not fully deployed live** for the auth layer
- **seed not visible / not verified live** for `testuser`, `admin`, or `admin@pmis.local`
- **backend service role cannot access `auth` / `project` schemas** from the `pmis` role path I could verify

So the responsibility split is:
- **Database/DevOps:** publish the live auth schema and grants, then seed test users
- **Backend:** ensure it is using the correct credential path and role expectations
- **Tiny:** decide whether we unblock with a minimal seed now or wait for the full migration/grant path

### 3. If we can unblock today, what is the minimal viable seed/insert/fixture?
Minimal unblock package, in priority order:
1. Ensure backend can actually read the live `auth` schema with the intended service role.
2. Create the minimal auth tables if absent:
   - `auth.users`
   - `auth.sessions`
   - `auth.audit_login_attempts`
   - `auth.user_project_roles`
3. Seed at least one known-good login identity with a bcrypt hash for `password123`:
   - `testuser`
   - `admin`
   - `admin@pmis.local` if the app uses email as an alternate identifier anywhere
4. Seed at least one active session only if the login flow requires a pre-existing refresh-token fixture; otherwise let login create it dynamically.
5. Grant the backend service role only the exact CRUD/USAGE permissions it needs.

### 4. What I need from Tiny right now
@Tiny
目前我這邊的結論是：**live auth 沒有閉合，且 app role 對 `auth` / `project` schema 沒有可用權限**。如果你要今天直接 unblock，請決定要我走哪條路：
- **A. 先補最小 seed + grants**，讓 `testuser/password123` 先通；
- **B. 先補完整 migration + seed + grants**，再一起驗證；
- **C. 先繼續排除，等 DevOps / Backend 把正確 DB 連線與角色邊界補齊。**

## Immediate next step recommendation

**最小可行的今天 unblock 路徑：**
- 先確認 backend 連的是哪個 live DB role
- 再補 `auth.users` 的最小 seed（至少 `testuser` / `admin` 之一）
- 同步補 `auth.sessions` 的生成路徑與必要 grants
- 驗證 `/api/v1/auth/login` → `/auth/me` → `/auth/refresh` 的閉環

## Responsibility summary

- **Database:** schema / grants / seed state
- **Backend:** credential path + repository implementation + token persistence
- **DevOps:** live DB access, backup/rollback path, and role credential distribution
- **Tiny:** decide minimal unblock vs full rollout path

## Notes

The repo already has a clear draft auth design, but that is not a substitute for live verification. Until the live auth schema and seed are present and accessible, `INVALID_CREDENTIALS` is expected behavior for the happy-path accounts.
