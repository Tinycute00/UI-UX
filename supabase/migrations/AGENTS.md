# AGENTS.md — `supabase/migrations/`

Plain SQL migrations applied via `supabase db push` or Dashboard SQL Editor. **Frontend authoritative schema lives here**, not in Prisma (`backend/prisma/` is a separate DB for the Fastify service — see `backend/AGENTS.md`).

## Files

- `0001_init.sql` (~485 lines) — enums, tables, RLS policies, progress-calc SQL functions
- `0002_mvp2_core.sql` (~139 lines) — storage bucket `photos` + RLS, `handle_new_user` profile auto-provision trigger, daily-log → WBS progress trigger, `scurve_series(project_id)` RPC

## Schema anchors

- Enum `user_role`: `office_chief | engineer | qc_inspector | safety_officer | admin_staff` — keep in sync with `src/lib/navigation.ts` `UserRole` type.
- Enum `form_status`: `draft | submitted | approved | rejected`
- Enum `wbs_status`: `planned | in_progress | completed | on_hold`
- Enum `inspection_result`: `pass | fail | pending`
- `profiles` FKs `auth.users(id) on delete cascade` and is auto-provisioned by `handle_new_user()` trigger on Supabase auth signup (uses `raw_user_meta_data.name` / `.role`, falls back to `admin_staff`).

## Conventions (MUST follow)

1. **Never edit `0001` or `0002`.** Add `0003_*.sql`, `0004_*.sql`, etc. Migrations are forward-only.
2. **Every new table needs RLS.** Pattern from `0001`: `alter table ... enable row level security;` then project-member policies via `public.is_project_member(project_id uuid)` helper.
3. **Storage paths use `{project_id}/...` as first folder.** RLS in `0002` uses `(storage.foldername(name))[1]::uuid` to extract and check membership. Bucket name `photos` is not public.
4. **Progress % is trigger-computed.** Do not add a user-writable `progress_percent` column anywhere. The `0002` trigger re-aggregates WBS weights on `daily_logs` insert/update.
5. **`do $$ ... exception when duplicate_object then null; end $$;`** pattern for enum creation — makes migrations re-runnable on an existing DB.
6. **`drop policy if exists` before `create policy`.** Same idempotency reason.

## Running

```bash
supabase db push
# or: paste each file in Dashboard → SQL Editor in order
```

## Anti-patterns

- Renaming columns without a compensating migration (breaks deployed frontend instantly).
- Adding a `public` storage bucket — photos MUST stay private + RLS-gated.
- Writing RLS that allows `authenticated` globally without a project-membership check.
- Hard-coding JWT role checks in policies — use `profiles.role` lookup via helper.

## NOT in this directory

- Prisma schema for `backend/` service → `backend/prisma/schema.prisma` (different DB, `auth` + `project` PG schemas, bootstrapped by `infra/init-schemas.sql`).
