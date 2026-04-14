-- ============================================================
-- OPS-306: Local DB init — create required PostgreSQL schemas
-- Runs automatically on first `docker compose up` via
-- docker-entrypoint-initdb.d/
--
-- Required by Prisma multiSchema (schema.prisma: schemas = ["auth","project"])
-- ============================================================

-- auth schema: users, sessions, audit_login_attempts, user_project_roles
CREATE SCHEMA IF NOT EXISTS auth;

-- project schema: reserved for future project domain tables
CREATE SCHEMA IF NOT EXISTS project;

-- Grant usage to app user (pmis)
GRANT USAGE ON SCHEMA auth    TO pmis;
GRANT USAGE ON SCHEMA project TO pmis;
GRANT CREATE ON SCHEMA auth    TO pmis;
GRANT CREATE ON SCHEMA project TO pmis;

-- Allow pmis to create objects in default public schema as well
GRANT CREATE ON SCHEMA public TO pmis;
