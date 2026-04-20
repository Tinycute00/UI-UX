# AGENTS.md — `docs/`

~44 markdown files. **NOT user-facing documentation** — this is the team's operational workspace: per-role task boards, cross-team handoff reports, specs, and QA evidence.

## File families

| Prefix / suffix | Purpose | Edit discipline |
|---|---|---|
| `{role}-task-board.md` (uiux, backend, devops, tester, pm) | Live Kanban per role | Owned by that role; cross-role edits require dispatch note |
| `pm-*.md` | PM dispatch, heartbeat policy, status snapshots | PM-owned; agents read for context |
| `db-*.md`, `ops-*.md`, `devops-*.md` | Numbered incident/readiness reports (e.g. `db-307-auth-live-state-20260415.md`) | Append-only; create new dated file instead of editing |
| `QA-*.md`, `qa-*.md` | QA verification + regression reports | Append-only; evidence under `qa/evidence/` |
| `be-*.md`, `backend-*.md` | Backend-specific planning | Owned by backend role |
| `api-contracts-v1.md` | REST contract between frontend & `backend/` Fastify service | Treat as frozen v1; new version = `-v2.md` |
| `uiux-delivery-spec.md` | Top-level UX spec (layout, components, flows) | Primary design reference for frontend work |
| `auth-schema-architecture.md` | Auth design across Supabase + Prisma backend | Cross-team, PM-coordinated edits |
| `opencode-model-selection-policy.md`, `opencode-executable-whitelist-matrix.md` | Workspace governance for AI agent tooling | Referenced by `OPENCODE_TEAM_STANDARD.md` |
| `system-inventory.md`, `implementation-backlog.md` | Project-wide indices | Keep in sync when adding major components |

## Subfolders

- `qa/evidence/` — screenshots, videos, traces. **Large binary dir.** Do not grep it by default; ignore in searches unless explicitly asked.

## Rules

1. **Do not delete dated reports.** They are audit trail. Supersede by creating a newer-dated file and linking from the task board.
2. **Respect role ownership.** If you (as an agent) are not acting for that role, propose edits via the role's task board instead of direct edits.
3. **Task-board status updates go at the top** (most-recent-first convention across all `*-task-board.md`).
4. **New reports** follow the pattern `{role}-{ticket}-{topic}-{YYYYMMDD}.md` (e.g. `db-307-auth-live-state-20260415.md`).
5. **Cross-links use relative paths** (`./api-contracts-v1.md`), not workspace-absolute.

## When reading for context

Start with: `pm-status-latest.md`, `pm-dispatch-board.md`, your role's `{role}-task-board.md`, then drill into dated reports only if referenced.

## Anti-patterns

- Rewriting `api-contracts-v1.md` in place when changing API shape — bump to `-v2.md`.
- Moving files between folders (breaks cross-links in existing reports).
- Committing `qa/evidence/` screenshots without referencing them from a QA report.
