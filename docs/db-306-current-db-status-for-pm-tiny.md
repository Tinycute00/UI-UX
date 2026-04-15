# DB Current Status for PM / Tiny

**Date:** 2026-04-15  
**Workspace:** `/home/beer8/team-workspace/UI-UX`  
**Scope:** auth schema, migration, live/staging blockers, confirmed vs unconfirmed items, and Tiny handoff guidance

## Status

**⚠️ 部分完成** — repo evidence shows the auth schema design and migration draft exist, but live deployment / grant execution is **not verified** and current live/staging readiness is still blocked by missing credentials and unresolved environment prerequisites.

---

## 1) 已驗證事實（repo / 現有文件 / 實際環境可支持）

### A. Auth schema design exists in repo
- `backend/prisma/schema.prisma` defines the BE-305 auth models:
  - `auth.users`
  - `auth.sessions`
  - `auth.audit_login_attempts`
  - `auth.user_project_roles`
  - enum `auth.UserRole` with values `admin`, `supervisor`, `vendor`
- The auth migration SQL draft also exists at:
  - `backend/prisma/migrations/20260414143005_init_auth_schema/migration.sql`

### B. The repo still marks this as pending live rollout
- `backend/prisma/schema.prisma` explicitly notes:
  - `DB_PENDING: live DB migration + service account GRANTS not yet applied`
  - `project` relation for `UserProjectRole` is still commented/pending
- `docs/db-303-live-auth-migration-plan.md` states it is a **draft** and does **not** claim live migration completion.
- `docs/ops-305-auth-migration-exec-readiness.md` marks the auth migration environment as **Not Ready**.

### C. Live / staging blockers are still present in repo evidence
- `docs/db-304-live-migration-blocker-status.md` says live/staging auth migration is blocked and no repo file proves live auth schema migration or required grants are active.
- It also notes missing production DB connection material and missing role names:
  - no production DB host / port / dbname / SSL details in repo evidence
  - no `DATABASE_URL` / `MIGRATION_DATABASE_URL` / root credential present
  - placeholder roles remain: `<migration_role>`, `<backend_service_role>`
- The same blocker report says `project.projects` existence and `project_id bigint` were only referenced from prior evidence and were **not re-verified** in that task.

### D. Environment check: OpenCode is not authenticated here
- `opencode auth list` returned `0 credentials` in this environment.
- So OpenCode-based execution is not currently usable from this session as an authenticated runner.

---

## 2) 未完成事項

### A. Live migration not yet verified
- No document in repo proves the auth schema has been applied to the live DB.
- No live `information_schema` / `pg_catalog` verification was performed in this task.
- Therefore, the schema is still a **design + migration draft**, not a confirmed live state.

### B. Grants are still draft-only
- The grants section in `docs/db-303-live-auth-migration-plan.md` still contains placeholders.
- Real migration role / backend service role names are not confirmed in the repo evidence.
- As a result, GRANT execution remains blocked.

### C. Staging readiness is incomplete
- `docs/ops-305-auth-migration-exec-readiness.md` lists missing prerequisites:
  - DB migration step in CI/CD
  - backup / snapshot step
  - staging target DB / independent deploy path
  - rollback workflow
  - `prisma/migrations/` baseline

---

## 3) 阻塞點（live / staging）

1. **Missing live DB access material**
   - no verified production DB connection details in repo evidence
   - no authenticated OpenCode execution in this environment

2. **Role / grants unresolved**
   - placeholders still present in the migration plan
   - actual service role names and credentials are not confirmed

3. **FK dependency not re-verified in this task**
   - `auth.user_project_roles.project_id` depends on `project.projects(project_id)`
   - current task evidence does not re-check that live target

4. **Pipeline / rollback not fully wired**
   - staging and deployment readiness remain `Not Ready`
   - rollback and backup flow still need implementation/confirmation

---

## 4) Tiny 下一步需要怎麼跟 DB 對接

### Tiny should do now
1. **Treat auth schema as draft, not live.**
   - Do not assume the tables or grants already exist in production/staging.

2. **Confirm the target environment details with DevOps/DBA first.**
   - production/staging DB host, port, dbname, SSL requirements
   - actual migration role name
   - actual backend service role name
   - actual connection secrets / deployment path

3. **Use the existing Prisma + migration draft as the starting point.**
   - `backend/prisma/schema.prisma`
   - `backend/prisma/migrations/20260414143005_init_auth_schema/migration.sql`
   - `docs/db-303-live-auth-migration-plan.md`

4. **Verify `project.projects` in the real target DB before enabling the project FK.**
   - if the table or type is not confirmed, keep that FK deferred

5. **Implement / confirm the missing rollout machinery.**
   - backup before deploy
   - migrate deploy step
   - rollback workflow
   - staging validation path

### Tiny should not do yet
- Do not claim auth migration is live
- Do not claim GRANTs are active
- Do not finalize the `user_project_roles.project_id` FK without live verification

---

## 5) Evidence summary by file

- `backend/prisma/schema.prisma` — pending live migration markers and BE-305 auth model shape
- `backend/prisma/migrations/20260414143005_init_auth_schema/migration.sql` — auth schema DDL draft exists
- `docs/database-dashboard-auth-alignment.md` — live auth tables reported missing previously
- `docs/db-302-auth-unblock-report.md` — minimal auth scope and design proposal
- `docs/db-303-live-auth-migration-plan.md` — migration/grants draft, not live execution
- `docs/db-304-live-migration-blocker-status.md` — blockers still unresolved
- `docs/ops-305-auth-migration-exec-readiness.md` — environment not ready
- `opencode auth list` — 0 credentials in current environment

---

## 6) Conclusion

Current DB situation:
- **Auth schema design exists**
- **Migration draft exists**
- **Live migration / grants are not verified**
- **Live/staging execution is still blocked** by missing credentials, unresolved role names, and incomplete rollout readiness

Tiny can now start by aligning with the existing BE-305 Prisma + DB-303 draft, but must first confirm live environment credentials and role names before any claim of deployment completion.

## 7) Closed-loop reporting rule added

- Any Database task that produces a completed or partially completed result must be reported to the exact PM target thread immediately after the evidence-backed summary is written.
- A local report file is **not** considered closed-loop completion.
- The required carriers for this rule are:
  - this document
  - `docs/db-patrol-reality-20260415.md`
  - shared memory / workflow guidance
