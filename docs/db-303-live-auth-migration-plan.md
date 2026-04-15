# DB-303 Live Auth Migration / Grants Plan

**Date:** 2026-04-14  
**Workspace:** `/home/beer8/team-workspace/UI-UX`  
**Scope:** `auth` schema migration + grants only  
**Input sources:**
- `docs/db-302-auth-unblock-report.md`
- `docs/database-dashboard-auth-alignment.md`
- `docs/auth-schema-architecture.md`
- `backend/prisma/schema.prisma`

**Status:** `⚠️ 部分完成` — this document is a **migration/grants draft**.  
**Important:** this task **does not re-verify live DB directly** and does **not** claim migration completion.

---

## 1. What is verified vs. what is not

### Verified from existing workspace evidence
- `auth` tables were previously reported as **missing in live DB** in `docs/database-dashboard-auth-alignment.md`.
- `project.projects` exists and uses `project_id bigint` in the same live alignment report.
- Backend has prepared a BE-305 Prisma schema in `backend/prisma/schema.prisma`.
- The current BE-305 Prisma shape is:
  - `auth.users`
  - `auth.sessions`
  - `auth.audit_login_attempts`
  - `auth.user_project_roles`
  - `auth.UserRole` enum in `auth` schema
  - `project.projects` FK for `user_project_roles` is present in the business design, but the Prisma file still marks it as pending/commented.

### Not verified in this task
- No direct live PostgreSQL inspection was performed in this task.
- No live migration was applied.
- No live GRANT statements were executed.
- No claim is made that the auth schema already exists in live DB.

---

## 2. BE-305 Prisma alignment summary

This section states what can be adopted directly, and what needs adjustment before live rollout.

### 2.1 Directly adoptable from BE-305 Prisma

| Model / Field | Status | Notes |
|---|---|---|
| `auth.users.user_id` | adopt | `BigInt`, PK, autoincrement, maps from `id` |
| `auth.users.username` | adopt | unique, `varchar(100)` |
| `auth.users.email` | adopt | unique, `varchar(255)` |
| `auth.users.password_hash` | adopt | stored as hash only |
| `auth.users.role` | adopt | enum `auth.UserRole` with `admin/supervisor/vendor` |
| `auth.users.is_active` | adopt | boolean default true |
| `auth.users.last_login_at` | adopt | nullable timestamptz |
| `auth.users.created_at` | adopt | default now() |
| `auth.users.updated_at` | adopt with note | Prisma `@updatedAt` needs either app-side update or DB trigger policy |
| `auth.sessions.session_id` | adopt | PK, autoincrement |
| `auth.sessions.user_id` | adopt | FK to `auth.users.user_id` with cascade |
| `auth.sessions.refresh_token_hash` | adopt | unique hash, do not store token plaintext |
| `auth.sessions.expires_at` | adopt | required timestamptz |
| `auth.sessions.revoked_at` | adopt | nullable |
| `auth.sessions.device_info` | adopt | JSONB is the natural DB mapping for Prisma `Json` |
| `auth.sessions.ip_address` | adopt | `varchar(45)` is acceptable |
| `auth.sessions.user_agent` | adopt | text/varchar |
| `auth.sessions.created_at` | adopt | default now() |
| `auth.sessions.last_used_at` | adopt | default now() |
| `auth.audit_login_attempts.*` | adopt | structure matches the BE-305 draft well |
| `auth.user_project_roles.user_id` | adopt | FK to `auth.users.user_id` |
| `auth.user_project_roles.project_id` | adopt | intended FK to `project.projects.project_id` |
| `auth.user_project_roles.role` | adopt | enum `auth.UserRole` |
| `auth.user_project_roles.assigned_at` | adopt | default now() |
| `auth.user_project_roles.assigned_by` | adopt | nullable; FK can remain deferred if no stable referent exists |
| `auth.user_project_roles unique(user_id, project_id)` | adopt | matches current BE-305 model |

### 2.2 Needs adjustment before live rollout

| Item | Why it needs adjustment |
|---|---|
| `auth.user_project_roles.project` relation | Prisma currently leaves this as pending/commented; live DDL should decide whether to enable FK now or keep it deferred only if the target environment is inconsistent |
| `auth.users.updated_at` behavior | Prisma `@updatedAt` is application-aware; if non-Prisma writers exist, add a DB-side trigger or accept app-managed updates only |
| Missing indexes | BE-305 Prisma does not encode all operational indexes needed for login/session lookups and cleanup |
| Schema grants | Prisma schema does not express service-account permissions; these must be handled in migration/ops SQL |
| `assigned_by` FK | no stable referent is defined in BE-305; keep nullable or add later when an auth operator table exists |
| Separate `refresh_tokens` table | do **not** carry forward the older architecture proposal; BE-305 collapses token lifecycle into `auth.sessions.refresh_token_hash` |

---

## 3. Recommended migration order

1. `CREATE SCHEMA auth`
2. Create enum type `auth."UserRole"`
3. Create `auth.users`
4. Create `auth.sessions`
5. Create `auth.audit_login_attempts`
6. Create `auth.user_project_roles`
7. Add indexes
8. Apply GRANT / DEFAULT PRIVILEGES
9. Verify in live DB with `information_schema` / `pg_indexes`
10. Hand off to Backend for Prisma client wiring and to DevOps for release coordination

---

## 4. Draft DDL / migration SQL

> This is a draft for Backend / DevOps execution.  
> It is intentionally conservative and aligned to BE-305, not to the older broader auth design.

```sql
-- 0) schema
CREATE SCHEMA IF NOT EXISTS auth;

-- 1) enum used by BE-305 Prisma
-- Prisma enum UserRole in schema auth.
CREATE TYPE auth."UserRole" AS ENUM ('admin', 'supervisor', 'vendor');

-- 2) auth.users
CREATE TABLE auth.users (
    user_id        BIGSERIAL PRIMARY KEY,
    username       VARCHAR(100) NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           auth."UserRole" NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- recommended operational indexes
CREATE INDEX idx_auth_users_username ON auth.users (username);
CREATE INDEX idx_auth_users_email ON auth.users (email);
CREATE INDEX idx_auth_users_is_active ON auth.users (is_active);

-- 3) auth.sessions
CREATE TABLE auth.sessions (
    session_id         BIGSERIAL PRIMARY KEY,
    user_id            BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at         TIMESTAMPTZ NOT NULL,
    revoked_at         TIMESTAMPTZ,
    device_info        JSONB,
    ip_address         VARCHAR(45),
    user_agent         TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_user_id ON auth.sessions (user_id);
CREATE INDEX idx_auth_sessions_expires_at ON auth.sessions (expires_at);
CREATE INDEX idx_auth_sessions_revoked_at ON auth.sessions (revoked_at);
CREATE INDEX idx_auth_sessions_created_at ON auth.sessions (created_at);

-- 4) auth.audit_login_attempts
CREATE TABLE auth.audit_login_attempts (
    attempt_id      BIGSERIAL PRIMARY KEY,
    username        VARCHAR(100) NOT NULL,
    email           VARCHAR(255),
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    success         BOOLEAN NOT NULL,
    failure_reason  VARCHAR(100),
    attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_audit_login_attempts_username ON auth.audit_login_attempts (username);
CREATE INDEX idx_auth_audit_login_attempts_ip_address ON auth.audit_login_attempts (ip_address);
CREATE INDEX idx_auth_audit_login_attempts_attempted_at ON auth.audit_login_attempts (attempted_at);
CREATE INDEX idx_auth_audit_login_attempts_success ON auth.audit_login_attempts (success);

-- 5) auth.user_project_roles
-- project.projects(project_id) exists in prior live alignment evidence and is bigint.
CREATE TABLE auth.user_project_roles (
    user_project_role_id BIGSERIAL PRIMARY KEY,
    user_id              BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE CASCADE,
    project_id           BIGINT NOT NULL REFERENCES project.projects(project_id) ON DELETE CASCADE,
    role                 auth."UserRole" NOT NULL,
    assigned_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by          BIGINT,
    CONSTRAINT uq_auth_user_project_roles UNIQUE (user_id, project_id)
);

CREATE INDEX idx_auth_user_project_roles_user_id ON auth.user_project_roles (user_id);
CREATE INDEX idx_auth_user_project_roles_project_id ON auth.user_project_roles (project_id);
CREATE INDEX idx_auth_user_project_roles_role ON auth.user_project_roles (role);
```

### Optional DB-side update behavior for `updated_at`

If non-Prisma writers exist, add a trigger for `auth.users.updated_at`.  If all writes go through Prisma, the trigger can be deferred.

---

## 5. Draft grants design

> Role names below are placeholders if the live environment already has different service-account roles.  
> Replace `<backend_service_role>` and `<migration_role>` with the actual production role names.

### 5.1 Schema ownership / migration role

```sql
-- migration role owns the auth schema objects
GRANT USAGE ON SCHEMA auth TO <migration_role>;
GRANT CREATE ON SCHEMA auth TO <migration_role>;
```

### 5.2 Backend service account grants

```sql
-- allow the app to see the schema
GRANT USAGE ON SCHEMA auth TO <backend_service_role>;
GRANT USAGE ON SCHEMA project TO <backend_service_role>;

-- auth.users
GRANT SELECT, INSERT, UPDATE ON auth.users TO <backend_service_role>;

-- auth.sessions
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.sessions TO <backend_service_role>;

-- audit table is append-heavy; avoid delete/update by default
GRANT SELECT, INSERT ON auth.audit_login_attempts TO <backend_service_role>;

-- project lookup needed to assemble /auth/me project payload
GRANT SELECT ON project.projects TO <backend_service_role>;

-- user-project assignments
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.user_project_roles TO <backend_service_role>;

-- sequences created by BIGSERIAL / nextval() columns
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO <backend_service_role>;
```

### 5.3 Default privileges for future objects

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA auth
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO <backend_service_role>;

ALTER DEFAULT PRIVILEGES IN SCHEMA auth
GRANT USAGE, SELECT ON SEQUENCES TO <backend_service_role>;
```

### 5.4 Recommended constraints on grants
- Do **not** grant superuser or broad database-owner privileges to the backend service account.
- Keep `audit_login_attempts` append-only unless a specific administrative use-case requires correction.
- If row-level security is introduced later, the above grants remain the base layer but RLS policies will need to be layered on top.

---

## 6. Acceptance criteria for rollout

This plan should be considered ready for the next step only if:

1. The migration SQL is applied successfully in the target environment.
2. The resulting live schema matches BE-305 field names and relations.
3. `auth.users`, `auth.sessions`, `auth.audit_login_attempts`, `auth.user_project_roles` all exist.
4. `auth.sessions.user_id` FK cascades correctly.
5. `auth.user_project_roles` can resolve `project.projects(project_id)`.
6. Backend service account can read/write exactly the intended tables, not more.
7. No claim is made that live DB was already migrated before verification.

---

## 7. Rollback plan

Rollback order should be the reverse of creation:
1. Revoke grants from `<backend_service_role>`.
2. Drop `auth.user_project_roles`.
3. Drop `auth.audit_login_attempts`.
4. Drop `auth.sessions`.
5. Drop `auth.users`.
6. Drop enum type `auth."UserRole"` after dependent objects are gone.
7. Optionally drop schema `auth` only if it is empty and no other objects depend on it.

> Rollback must be executed only after confirming no live data depends on the new auth objects.

---

## 8. Final handoff summary

### Can be directly adopted now
- BE-305 Prisma model names and column mappings.
- `auth.users` / `auth.sessions` / `auth.audit_login_attempts` / `auth.user_project_roles` as the auth scope.
- Enum-based role model using `admin / supervisor / vendor`.
- `auth.sessions.refresh_token_hash` as the token storage pattern.

### Still needs live confirmation
- The exact backend service role name.
- Whether `project.projects` FK should be enabled in the first deployment or deferred to a second migration.
- Whether DB-side `updated_at` trigger is required.
- Whether any additional auth administrative tables are required later.

### Explicit non-claim
- This task does **not** claim live DB completion.
- This task does **not** claim migration execution.
- This task does **not** claim live GRANT verification.
