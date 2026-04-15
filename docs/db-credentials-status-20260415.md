# DB Credentials / Migration Pipeline Status — 2026-04-15

**Workspace:** `/home/beer8/team-workspace/UI-UX`  
**Scope:** H-01 / auth migration pipeline readiness  
**Status:** **Blocked by credentials / environment / ownership gaps**  
**Evidence basis:** repo docs + existing readiness reports in `docs/` (no new live DB credential verification was possible in this pass)

---

## 1) Current true blockers

### A. Missing live DB connection credentials
**What is missing**
- Production DB connection info / `DATABASE_URL`
- Host / port / dbname / SSL settings
- Root or DBA-level credential needed for schema validation and migration prep

**Why it blocks**
- Cannot validate the target DB before migration
- Cannot confirm whether auth schema already exists in staging/production
- Cannot execute or verify rollback against the real environment

**Who can provide it**
- **DevOps / DBA**: primary owner for connection details and environment access
- **Tiny**: decision/approval if access needs to be granted or escalated
- **External system**: managed DB provider may be the actual source of credentials / endpoint details

---

### B. Missing migration-role and backend-service-role credentials / boundaries
**What is missing**
- A dedicated **migration role**
- A dedicated **backend service role**
- Explicit privilege boundaries for each role (read/write/schema create/alter/rollback)

**Why it blocks**
- We cannot safely separate migration execution from runtime access
- Cannot produce a least-privilege rollout path
- Cannot finalize GRANTs or rollback permissions

**Who can provide it**
- **DevOps / DBA**: role creation and privilege assignment
- **Backend**: can confirm what runtime permissions the app actually needs
- **Tiny**: can resolve ownership if the DB role assignment is still undecided

---

### C. Rollback workflow is not yet executable on the live target
**What is missing**
- Production snapshot / backup before migration
- Verified restore path / rollback script path
- Clear go/no-go gate for production rollout

**Why it blocks**
- Migration cannot be considered safe without a tested rollback path
- Cannot move from staging-ready to production-ready

**Who can provide it**
- **DevOps**: snapshot / backup / restore workflow
- **DBA**: rollback SQL and validation steps
- **Tiny**: approval for rollback policy if a decision is needed

---

### D. Staging environment is still not fully defined for auth migration testing
**What is missing**
- Staging platform decision / URL
- Staging branch / deployment trigger in the deployment pipeline
- Staging secrets (when the platform exists)

**Why it blocks**
- Auth migration cannot be trialed end-to-end in a safe environment
- Cannot run a realistic rollback rehearsal

**Who can provide it**
- **Tiny**: platform decision if unresolved
- **DevOps**: environment setup and secrets injection
- **Backend**: may need to confirm app-side environment variables

---

### E. DB ownership / execution handoff is still ambiguous in the workspace
**What is missing**
- A clearly assigned DB executor for the auth migration work

**Why it blocks**
- Prevents clean ownership of the migration/rollback package
- Slows coordination for H-01 → H-02 → H-20 sequence

**Who can provide it**
- **Tiny**: assign or confirm DB owner

---

## 2) Responsibility matrix

| Blocker | Primary provider | Supporting provider |
|---|---|---|
| Live DB credentials / `DATABASE_URL` | DevOps / DBA | Tiny |
| Role credentials / privilege boundaries | DevOps / DBA | Backend, Tiny |
| Rollback / backup workflow | DevOps / DBA | Tiny |
| Staging platform / environment decision | Tiny | DevOps |
| DB task ownership | Tiny | PM / Backend |
| Auth schema runtime requirements | Backend | DevOps / DBA |

---

## 3) What can still be done today without production credentials

Yes — there is still useful work that does **not** require production credentials:

1. **Finalize the migration package draft**
   - lock the auth schema shape
   - keep placeholders for role names and secrets
   - document exact grant requirements

2. **Write the rollback checklist / runbook**
   - snapshot prerequisite
   - validation queries
   - abort conditions
   - restore decision points

3. **Prepare the staging-readiness checklist**
   - staging URL / branch / secrets matrix
   - app-side environment variables
   - rollback rehearsal steps

4. **Continue doc alignment**
   - `docs/db-302-auth-unblock-report.md`
   - `docs/auth-schema-architecture.md`
   - `docs/database-dashboard-auth-alignment.md`
   - `backend/prisma/schema.prisma`

5. **Prepare exact requests for DevOps / Backend**
   - credential request list
   - privilege request list
   - rollback ownership request

**What cannot be finished today without prod creds**
- live schema verification on the target production/staging DB
- actual production migration execution
- real rollback rehearsal on production-like credentials

---

## 4) Immediate next step

**Recommended next step:**
1. Tiny confirms DB ownership and the staging/production credential path.
2. DevOps provides the live DB endpoint + access boundary + backup/restore path.
3. Backend confirms the exact runtime role names / app-side permission needs.
4. Then DB can finalize the executable migration + rollback package.

---

## 5) Tiny notice

@Tiny

目前 DB 端對 H-01 / migration pipeline 的真實阻塞是：**live DB credentials、migration/backend service role 權限邊界、以及可執行 rollback workflow** 尚未齊備；另外 **staging 環境/平台決策** 也還沒完全落地。

**今天可以先做的事**：把 migration package、GRANT/rollback checklist、staging readiness matrix 先定稿，不必等 production credentials。

如果你要我繼續，我會先把「要向 DevOps / Backend 索取的精準清單」整理成可直接轉發的版本。
