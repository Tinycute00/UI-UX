# AGENTS.md — `backend/`

**Separate Fastify 5 + TypeScript + Prisma 7 service.** Lives in the same repo but is fully independent:

- Own `node_modules`, own `package.json`, own `tsconfig.json`
- Excluded from frontend `tsconfig.json` (`"exclude": [..., "backend", ...]`)
- Excluded from root ESLint (`ignorePatterns: ["backend/**", ...]`)
- Frontend does NOT currently call it — frontend talks directly to Supabase. Backend exists for upcoming Prisma-backed auth/API flows (see `docs/auth-schema-architecture.md`, `docs/api-contracts-v1.md`).

## Stack

- Fastify 5.2 + `@fastify/cookie` (httpOnly refresh token) + `@fastify/helmet` + `@fastify/cors`
- Prisma 7 (multiSchema: `auth` + `project` — schemas pre-created by `infra/init-schemas.sql`)
- JWT: `jsonwebtoken` (access 15min, refresh 7d) + `bcryptjs` for password hashing
- Validation: Zod 3 (including env via `src/config.ts`)
- Tests: Vitest

## Layout

```
backend/src/
  server.ts              Fastify app factory (main entry)
  config.ts              Zod-validated env
  plugins/
    requestId.ts         X-Request-Id injection
    jwtAuth.ts           JWT verification plugin
  routes/
    health.ts            GET /api/v1/health (+ .test.ts)
    auth.ts              login / refresh / logout
    projects.ts
    safety-inspections.ts
    valuations.ts
  services/auth.service.ts        business logic (+ .test.ts)
  repositories/auth.repository.ts Prisma access  (+ .test.ts)
  utils/{password,jwt}.ts         bcrypt + JWT helpers (+ .test.ts)
  types/auth.ts
  errors/auth.errors.ts
prisma/schema.prisma     multiSchema: auth + project
```

Architecture: `Route → Service → Repository → Prisma`. Do NOT call Prisma from a route directly; always go through a repository.

## Database

- **Separate DB from Supabase.** `DATABASE_URL` points at `pmis-postgres` (via `docker-compose.yml` for dev: `host.docker.internal:5432/public_works_db`).
- Schemas `auth` and `project` must exist before `prisma migrate` — bootstrapped by `infra/init-schemas.sql`.
- Migration history is Prisma-managed (`prisma/migrations/`), NOT the `supabase/migrations/` files (those are for the frontend's Supabase DB).

## Commands (run from `backend/`)

```bash
npm install              # own deps
npm run dev              # tsx watch :3000
npm run build            # tsc → dist/
npm start                # node dist/server.js
npm test                 # vitest
npm run db:migrate:dev   # prisma migrate dev
npm run db:generate      # prisma generate
npm run db:studio        # prisma studio
```

## Rules

1. **Never import from `backend/` inside `src/`** and vice versa. Enforced by tsconfig excludes.
2. **Env via `src/config.ts`.** Don't read `process.env.*` ad-hoc — add to the Zod schema.
3. **Refresh tokens live in httpOnly cookies** via `@fastify/cookie`. Never return refresh token in JSON body.
4. **Error types centralized** in `src/errors/auth.errors.ts`. Routes map them to HTTP status — don't throw raw `Error` from services.
5. **Prisma client is a plugin-provided singleton** — don't `new PrismaClient()` in handlers.
6. **docker-compose secrets are DEV-ONLY.** `.env.example` JWT_SECRET must be rotated for any non-local use.

## Anti-patterns

- Adding Next.js-style `app/api` routes to frontend that duplicate backend endpoints.
- Bypassing services to call repositories from routes.
- Sharing Prisma types with frontend via import — publish via `docs/api-contracts-v1.md` DTOs instead.
- Editing `supabase/migrations/*.sql` to match backend schema — they are different databases.

## Status

Auth (BE-001 / BE-002) is implemented with tests. Other routes (`projects`, `safety-inspections`, `valuations`) are scaffolded — check `docs/backend-task-board.md` for current readiness before depending on them.
