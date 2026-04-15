# OpenCode Team Standard — Ta Chen PMIS

- Canonical workspace: `/home/beer8/team-workspace/UI-UX`
- Every OpenCode invocation must explicitly set this workspace.
- Required execution pattern: `opencode run '/ulw-loop [role-specific task]'` with workdir `/home/beer8/team-workspace/UI-UX`.
- **Model Selection**: All tasks must follow the governance rules in `docs/opencode-model-selection-policy.md` — this includes mandatory workdir usage, role-based model selection, **frontend-specialist models (Section 3.2)**, and **data-query specialist models (Section 3.3)**.
  - **Executable Whitelist Matrix**: See `docs/opencode-executable-whitelist-matrix.md` for the runtime-verified model whitelist with tier classification (P0/P1/P2), task-type try-order tables, and prefix rules.
  - **Execution Principle**: Always try premium models first (Tier P0), but after 2 consecutive premium failures, switch immediately to stable mid-tier (Tier P2). Never assume premium availability.
  - **前端專職模型**：依 `docs/opencode-executable-whitelist-matrix.md` 執行；高端前端模型（Gemini 3.1 Pro / Gemini 2.5 Pro）屬 Tier P0 exploratory，Claude Sonnet 4.6 屬 Tier P1 且僅建議 `/ulw-loop`，穩定回退為 Minimax M2.7 (Tier P2)
  - **資料查詢模型**：Kimi K2.5 (長文比對/文件核對主選)
- UI/UX tasks must use role-specific acceptance criteria from `docs/uiux-task-board.md`.
- Database tasks must use role-specific acceptance criteria from `docs/implementation-backlog.md` and must not be rerouted implicitly to generic backend without explicit routing confirmation.
- PM report-back target for this thread: `discord:1491771769072255208:1493410206351102003`
