# DB-304 Live / Staging Auth Migration Blocker Status

**Date:** 2026-04-14  
**Workspace:** `/home/beer8/team-workspace/UI-UX`  
**Scope:** live/staging auth migration blocker status only  
**Evidence reviewed:**
- `docs/db-302-auth-unblock-report.md`
- `docs/db-303-live-auth-migration-plan.md`
- `docs/ops-305-auth-migration-exec-readiness.md`
- `backend/prisma/schema.prisma`

## Status

**⚠️ 部分完成** — current repo evidence still shows the live/staging auth migration is blocked. No document or file in the repo proves the live auth schema has been migrated or the required grants are active.

## What is still blocked

### 1) Live DB access / credentials
- No production DB host / port / dbname / SSL details are available in repo evidence.
- No `DATABASE_URL` / `MIGRATION_DATABASE_URL` / root credential is present for production execution.
- `opencode auth list` returned `0 credentials`, so OpenCode CLI execution is not authenticated in this environment.

### 2) Role / grants setup
- `docs/db-303-live-auth-migration-plan.md` still uses placeholders:
  - `<migration_role>`
  - `<backend_service_role>`
- Those real role names and credentials are not yet confirmed.
- Therefore the GRANT statements remain draft-only.

### 3) Target dependency verification
- `project.projects` existence and `project_id bigint` are only referenced from prior evidence; this task did **not** re-verify the target DB.
- The `auth.user_project_roles.project_id` FK still depends on `project.projects(project_id)`.
- Until the target DB is rechecked, this FK is a live blocker, not a confirmed fact.

### 4) Staging / pipeline readiness
- `docs/ops-305-auth-migration-exec-readiness.md` still marks the environment as **Not Ready**.
- Missing items include:
  - DB migration step in CI/CD
  - backup / snapshot step
  - staging target DB / independent deploy path
  - rollback workflow
  - `prisma/migrations/` baseline

### 5) Prisma / schema convergence
- `backend/prisma/schema.prisma` still marks auth models as pending live migration.
- `UserProjectRole` still has the `project` relation commented out, so Prisma vs DDL is not yet fully converged.
- `updated_at` trigger policy remains undecided.

## Dependencies by owner

### Backend
- Replace placeholders in DB-303 with the real role names once DBA/DevOps provides them.
- Align Prisma FK choice for `auth.user_project_roles.project_id` with the migration DDL.
- Decide whether `updated_at` is Prisma-managed only or needs a DB trigger.
- Create `prisma/migrations/` baseline and wire `migrate deploy` after local init is complete.

### DevOps
- Provide production/staging DB connection material and secrets.
- Add migration execution and backup/snapshot steps to deployment flow.
- Stand up a staging target with independent migration validation.
- Add rollback workflow / release controls.

### Database
- Re-verify the target DB rather than relying on prior evidence.
- Confirm whether `project.projects` and `project_id bigint` are present in the actual target.
- Produce the final migration/grants design only after the live prerequisites are confirmed.
- Keep the deliverable scope limited to auth schema migration + grants, and do not state deployment completion until verified.

## Database next step

1. Re-check target DB schema facts on the real environment.
2. Confirm live role names and connection material from DevOps/DBA.
3. Finalize or adjust the DB-303 draft to the actual environment.
4. Hand off the executable migration/grants package to Backend + DevOps.

## Can be done now

- File/documentation work can continue immediately:
  - keep the DB-303 draft aligned to BE-305 Prisma schema
  - keep the ops readiness checklist updated
  - prepare a rollback / verification checklist

## Hard constraint

Do **not** describe the auth schema as live, deployed, or granted until the live DB has been verified.
