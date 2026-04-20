# AGENTS.md — `src/app/(app)/` (Authenticated Route Group)

Next 15 App Router **route group** `(app)` — parentheses mean the segment is NOT in the URL. Everything here shares the authenticated shell (Header + Sidebar + MobileTabBar + A11yProvider) defined in the group's `layout.tsx`.

## Modules (12)

| Folder | URL | Status | Notes |
|---|---|---|---|
| `today/` | `/today` | ✅ MVP1 | Root `/` redirects here |
| `morning-meeting/` | `/morning-meeting` | ⚠️ UI done, Supabase insert stubbed (`page.tsx:73` TODO) |
| `daily-log/` | `/daily-log`, `/daily-log/new`, `/daily-log/[id]` | ✅ MVP2 | WBS checkbox submit → trigger in migration `0002` recomputes S-Curve |
| `upload/` | `/upload` | ✅ MVP2 | Client-side compress ≤1.5MB + EXIF GPS/timestamp via `@/lib/photos` |
| `wbs/` | `/wbs` | ✅ MVP2 | Calls `scurve_series` RPC (plan vs actual) |
| `qc`, `safety`, `materials`, `office`, `billing`, `labor`, `reports` | — | 🔨 Stub | Render `<StubPage>` from `@/components/layout` |

## Conventions

- **Stub modules** use `components/layout/StubPage.tsx` + `<BackButton>`. Replace wholesale when implementing — don't incrementally mutate the stub.
- **RBAC visibility**: each module is gated by role in `src/lib/navigation.ts`. Adding a new module = add entry to `NAV` there, don't hard-code sidebar items.
- **Forms** use RHF + Zod schemas colocated next to the page (e.g. `morning-meeting/schema.ts` pattern). Submit handlers should call Supabase client directly, NOT a Next API route.
- **Photo handling**: always route through `@/lib/photos.ts` (compression + EXIF + thumb). Storage path MUST be `{project_id}/{uuid}-{filename}` — RLS in migration `0002` depends on this prefix.
- **S-Curve data**: never compute in the page. Call the `scurve_series(project_id)` RPC.

## Anti-patterns

- Adding a manual `progress %` input on any WBS/daily-log page (system-wide hard rule).
- Creating a `page.tsx` outside `(app)/` that reuses the authenticated shell — route group membership IS the auth boundary.
- Fetching project/WBS data in a Client Component when an RSC parent could hand it down (needless RTT + loses RLS session context on first paint).
- Using `router.push("/daily-log")` string literals instead of `NAV` constants.

## Adding a new module

1. Add entry to `src/lib/navigation.ts` (`NAV`) with allowed `roles`.
2. Create `src/app/(app)/<slug>/page.tsx` + optional `layout.tsx` for per-module state.
3. If write paths → create matching table + RLS in a NEW migration file (never edit `0001`/`0002`).
4. Verify sidebar/tab-bar auto-pick it up (they iterate `NAV`).
