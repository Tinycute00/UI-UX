# AGENTS.md — Ta Chen PMIS Frontend

> Generated 2026-04-20 · HEAD `2f8983e` (main) · `feat(mvp2+deploy): daily-log, photo upload, wbs/s-curve + Vercel pipeline`

## OVERVIEW

**公共工程甲級營造廠工務所管理系統** — Next.js 15 App Router frontend for on-site construction supervision at Ta Chen Construction. Primary users: **age 50–70 site engineers**, hence non-standard UX defaults.

- `package.json` name: `ta-chen-pmis-frontend` v2.0.0, Node `>=20`
- Stack: Next 15.1.3 + React 19 + TS 5.7 (strict) + Tailwind 3.4 + Supabase SSR 0.5
- State: TanStack Query 5 (server) + Zustand 5 (client) + React Context (a11y)
- Forms: React Hook Form 7 + Zod 3 · Charts: Recharts 2 · Signature: `react-signature-canvas`
- Data plane: **Supabase direct from browser/RSC** (no Next API routes). Auth, Storage, Realtime, RLS all Supabase.

## REPO LAYOUT (non-obvious parts only)

```
src/               → Next frontend (tsconfig scoped here)
backend/           → SEPARATE Fastify+Prisma service, own node_modules,
                     EXCLUDED from tsconfig + eslint; see backend/AGENTS.md
supabase/          → SQL migrations (0001 schema+RLS, 0002 MVP2)
infra/             → init-schemas.sql (creates `auth` + `project` PG schemas
                     for Prisma multiSchema — used by backend, NOT frontend)
docs/              → ~50 files: task boards per role + specs + QA evidence
docker-compose.yml → DEV-ONLY backend stack against host pmis-postgres
```

## WHERE TO LOOK

| Need | Path |
|---|---|
| Route map & RBAC | `src/lib/navigation.ts` (single source of truth) |
| Auth / session sync | `src/middleware.ts` + `src/lib/supabase/middleware.ts` |
| DB schema & RLS | `supabase/migrations/` (see subdir AGENTS.md) |
| Font-scale / high-contrast CSS vars | `src/app/globals.css` |
| Design tokens, breakpoints | `tailwind.config.ts` |
| A11y provider (大字/高對比) | `src/components/a11y/` |
| Photo upload + EXIF + compress | `src/lib/photos.ts`, `src/app/(app)/upload/` |
| S-Curve | `src/components/charts/` + migration `0002` `scurve_series` RPC |

## HARD RULES (domain-specific, non-generic)

1. **No manual progress %.** S-Curve progress is derived from daily-log WBS checkboxes via Postgres trigger (migration `0002`). Never expose a `%` input field.
2. **Base font 18px, buttons ≥56/60px.** User base is 50–70yo. `tailwind.config.ts` sets `fontSize.base = 18px`, `.btn-mobile` min-height `60px`. Never ship sub-18px body text.
3. **SVG icons only.** See `src/components/icons.tsx`. Emoji is explicitly forbidden in UI copy (see README).
4. **Supabase-direct, no proxy API.** Frontend talks to Supabase from RSC / browser. Do NOT introduce Next `app/api/**` routes for data — put logic in RLS + RPC instead. (`backend/` is a separate unused-by-frontend Fastify service; do not wire it in without explicit request.)
5. **5-role RBAC enforced in DB, not UI.** `user_role` enum: `office_chief | engineer | qc_inspector | safety_officer | admin_staff`. UI hides nav via `navigation.ts` roles, but RLS is the source of truth.
6. **`@/*` alias → `./src/*`.** Always use `@/...` imports inside `src/`.
7. **Prettier: double quotes, trailing commas.** See `.prettierrc`.
8. **Env-var-missing = soft warn, not crash.** `src/lib/supabase/{client,server,middleware}.ts` all fall back to placeholders so dev-without-Supabase still renders. Preserve this behavior.

## ANTI-PATTERNS (reviewed-out before merge)

- Adding a `progress_percent` form field anywhere.
- Importing from `backend/**` inside `src/**` (tsconfig excludes it; ESLint ignores `backend/**`, `supabase/**`).
- Creating Next API routes for CRUD — use Supabase client + RLS instead.
- Hard-coding routes as strings instead of consuming `NAV` from `src/lib/navigation.ts`.
- `as any`, `@ts-ignore`, `@ts-expect-error` — strict TS, zero tolerance.
- Emoji in product UI copy (pure SVG only).

## COMMANDS

```bash
npm run dev         # Next dev
npm run build       # production build (CI runs this)
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # next/core-web-vitals + next/typescript
npm run format      # prettier
# backend is independent:
cd backend && npm run dev          # Fastify :3000
cd backend && npm run db:migrate:dev   # Prisma migrate (separate DB)
```

CI: `.github/workflows/ci.yml` (lint + typecheck + build) · Deploy: `deploy.yml` → Vercel region `hnd1`.

## NOTES

- PWA: `public/sw.js` served with `Cache-Control: no-cache` (see `vercel.json`). Offline queue is stubbed — real sync is post-MVP2.
- `next.config.ts` sets `optimizePackageImports: ["recharts","date-fns","lucide-react"]` and Supabase image `remotePatterns`.
- CSP/HSTS/permissions headers live in `vercel.json` — mirror any auth-related origin changes there.
- Known TODO: `src/app/(app)/morning-meeting/page.tsx:73` — Supabase insert + photo upload + signature still stubbed.
- Workspace standard: `OPENCODE_TEAM_STANDARD.md` mandates `opencode run '/ulw-loop [task]'` with workdir `/home/beer8/team-workspace/UI-UX`.
