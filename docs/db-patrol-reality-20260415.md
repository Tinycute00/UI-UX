# DB Reality Patrol Report — PATROL-DB-REALITY-20260415

**Date:** 2026-04-15 12:15:54 +08:00  
**Workspace:** `/home/beer8/team-workspace/UI-UX`  
**Scope:** database / schema / data-contract-support boundary audit  
**Status:** draft report backed by repo evidence; no live DB queries were executed in this session

---

## 1) 已驗證屬於 DB / schema / data 層的真問題

### 1.1 Live auth schema / runtime access is not closed
- Evidence: `docs/db-307-auth-live-state-20260415.md:13-17, 34-53`
- Findings:
  - `auth` and `project` schemas exist in the live catalog scan.
  - app role `pmis` has `USAGE=false` and `CREATE=false` on both `auth` and `project`.
  - live `auth.users`, `auth.sessions`, `auth.audit_login_attempts`, `auth.user_project_roles` are not present in the live catalog scan.
- Impact: backend runtime cannot safely read/write auth tables from the verified app-role path.

### 1.2 Missing live auth seed/state
- Evidence: `docs/db-307-auth-live-state-20260415.md:66-75, 90-103`
- Findings:
  - no verified live login seed exists for `testuser`, `admin`, or `admin@pmis.local`.
  - current `INVALID_CREDENTIALS` is consistent with missing live auth seed/state and/or missing auth execution path.
- Impact: login flow cannot be considered unblocked from data-layer perspective.

### 1.3 Migration / grants remain draft-only
- Evidence: `backend/prisma/schema.prisma:31-106`, `backend/prisma/migrations/20260414143005_init_auth_schema/migration.sql:1-80`, `docs/db-303-live-auth-migration-plan.md:12-35, 87-219`
- Findings:
  - Prisma schema marks auth models as `DB_PENDING` / live migration not yet applied.
  - migration SQL exists, but only as draft repository content.
  - GRANTs in the migration plan still contain placeholders `<migration_role>` and `<backend_service_role>`.
- Impact: schema design exists, but live deployment / grants are not verified complete.

### 1.4 Sample data / fixture gap
- Evidence: `docs/auth-schema-architecture.md:291-301`, `docs/db-307-auth-live-state-20260415.md:90-103`
- Findings:
  - repo includes a suggested seed for `admin / admin@pmis.local` with password hash for `password123`.
  - that seed is proposal-level only; no live insertion was verified in this session.
- Impact: test login accounts remain a real missing data item until seeded live.

---

## 2) 目前常被誤認為 DB 問題，但其實屬於 backend contract / alias / mapping

### 2.1 `/auth/me` 里的 `displayName`, `permissions[]`, `projectIds[]` 是 contract/mapping 問題，不是純 DB 缺表
- Evidence: `docs/api-contracts-v1.md:57-65, 191-217`
- Findings:
  - login response requires `displayName`, `role`, `projectIds`.
  - `/auth/me` requires `projects[]` and `permissions[]`.
  - repo auth schema draft currently models identity + session + project-role linkage, but permissions are not a dedicated DB table in the verified BE-305 Prisma schema.
- Classification:
  - `displayName` is a DTO mapping field; may be derived from `full_name` or other backend alias.
  - `permissions[]` is backend authorization mapping, not a verified missing DB table.
  - `projectIds[]` / `projects[]` depends on how backend materializes `auth.user_project_roles` + `project.projects`.

### 2.2 Role vocabulary mismatch is largely contract-level
- Evidence: `docs/api-contracts-v1.md:59-64`, `backend/prisma/schema.prisma:21-27, 33-48`, `docs/auth-schema-architecture.md:126-132`
- Findings:
  - contract exposes roles as `'admin' | 'supervisor' | 'vendor'`.
  - Prisma schema uses `auth.UserRole` with the same three literal values.
  - Any mismatch in response shape or label translation is a mapping issue, not a missing DB table by itself.

### 2.3 Stale test fixtures / stub remapping are not DB schema defects
- Evidence: `docs/qa/QA-LIVE-RERUN-AUTH-20260415.md:114-125, 176-186`
- Findings:
  - some assertions still expect stub fixture data such as `stub_user` / `stub@example.com`.
  - actual runtime stub remapping now returns `admin / admin@pmis.local`.
- Classification: test fixture drift / mapping issue, not live DB schema failure.

### 2.4 `updated_at` behavior is implementation policy, not a missing table
- Evidence: `docs/db-303-live-auth-migration-plan.md:78-83, 186-188`; `backend/prisma/schema.prisma:41-42, 62-63`
- Findings:
  - Prisma `@updatedAt` may be app-managed.
  - If non-Prisma writers exist, a DB trigger is needed; otherwise app-side update is acceptable.
- Classification: backend/ORM policy decision, not a schema absence.

---

## 3) 待協調邊界問題

### 3.1 `auth.user_project_roles.project_id` FK depends on verified live `project.projects`
- Evidence: `backend/prisma/schema.prisma:88-105`, `backend/prisma/migrations/20260414143005_init_auth_schema/migration.sql:52-80`, `docs/db-303-live-auth-migration-plan.md:67-80, 169-183`
- Current state:
  - docs previously asserted `project.projects(project_id)` exists.
  - the Prisma file still marks the `project` relation as pending/commented.
- Boundary issue:
  - if backend wants the FK now, live target must be re-verified.
  - if target environment is inconsistent, the FK should remain deferred.

### 3.2 GRANT ownership and role names are unresolved
- Evidence: `docs/db-303-live-auth-migration-plan.md:194-219`, `docs/db-304-live-migration-blocker-status.md:23-48`, `docs/db-credentials-status-20260415.md:37-44`
- Current state:
  - placeholders remain for migration role and backend service role.
  - no verified production/staging connection material is present in repo evidence.
- Boundary issue:
  - DevOps must provide actual role names / secrets.
  - Backend must confirm runtime permission needs.
  - DB cannot finalize least-privilege grants without that input.

### 3.3 Need for Tiny decision
- Evidence: `docs/db-307-auth-live-state-20260415.md:105-125`
- Tiny-facing decision point:
  - whether to unblock with minimal seed + grants now, or wait for full migration / grant path.
- This is not a schema inference problem; it is an execution priority decision.

---

## 4) 是否存在真實缺失？

### Yes — real gaps that are still unresolved
- Live auth tables are not verified present.
- Live schema access via app role is blocked by missing `USAGE`.
- Live seed data for test/login accounts is not verified.
- GRANTs are draft-only and unresolved.
- `project_id` FK on `auth.user_project_roles` is not yet safely closed in the live target.

### No — items that are not DB defects by themselves
- `displayName`, `permissions[]`, `projectIds[]` in DTOs.
- role label translation between DTO and schema.
- stale test fixture assertions.
- `updated_at` write policy.

---

## 5) Need Tiny involvement?

**Need Tiny involvement: YES, but only for decision ownership, not for schema discovery.**

Why:
- The live data-layer blockers are already clear enough from repo evidence.
- The remaining unknown is execution policy: whether to prioritize minimal unblock seed/grants or full rollout alignment.
- Tiny must decide the release path once DevOps/Backend role ownership is confirmed.

If the team prefers to keep moving without Tiny, the next practical step is still the same: confirm actual DB role names and live credentials, then apply the auth migration + grants + seed verification path.

---

## 6) Evidence summary

- `docs/db-307-auth-live-state-20260415.md`
- `docs/database-dashboard-auth-alignment.md`
- `docs/db-303-live-auth-migration-plan.md`
- `docs/db-304-live-migration-blocker-status.md`
- `docs/auth-schema-architecture.md`
- `docs/api-contracts-v1.md`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260414143005_init_auth_schema/migration.sql`

---

## 7) Bottom line

The true DB layer gap is not "the backend forgot a table". The gap is:
1. live auth schema access is not actually open to the app role,
2. live auth seed/state is not closed,
3. grants are unresolved,
4. and backend contract fields such as `permissions[]` / `displayName` are being misread as schema failures.

The DB work item is therefore real, but it must be handled as **schema + grants + seed + backend mapping** rather than a vague "DB problem".
