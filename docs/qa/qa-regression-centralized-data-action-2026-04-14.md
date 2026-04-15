# QA Regression Report: centralized data-action refactor

**Project**: Ta Chen PMIS Static Frontend
**Task ID**: QA-UIUX-REF-20260414-001
**Baseline / HEAD**: f18ac7b5501fa93452a61333040edeadb3bd7ea1
**Workspace**: /home/beer8/team-workspace/UI-UX
**Date**: 2026-04-14

## Scope
Regression validation for dashboard, modals, IR, NCR, materials, billing, docs, safety after centralized data-action dispatch refactor.

## Verified facts
- `git rev-parse HEAD` = `f18ac7b5501fa93452a61333040edeadb3bd7ea1`
- `npm run lint` passed: `Checked 22 files in 11ms. No fixes applied.`
- `npm run build` passed: Vite production build completed successfully.
- `npm run format:check` failed on 4 files: `src/js/state-controller.js`, `src/app/dashboard-init.js`, `scripts/verify-fe201.js`, `scripts/verify-safety-mobile.js`.
- Local preview served successfully at `http://127.0.0.1:4173/`.

## UI regression checks performed
### Dashboard
- Dashboard loaded and displayed KPI cards, progress graph, contractor table, finance snapshot, and to-do rows.
- `window.showDashState` and `window.showBillingState` are exposed.
- `data-action="reload-dashboard"` and `data-action="retry-dashboard"` both exist in DOM.
- Clicking the dashboard work-detail and subcontractor-detail actions opened the expected modals.

### Modals
- `open-work-detail` → `mo-work-detail` opened with engineering detail content.
- `open-subcontractor-detail` → `mo-sub-detail` opened with contractor detail content.
- `open-billing-detail` → `mo-billing-detail` opened with billing detail content.
- `open-doc-view` → `mo-doc-view` opened with document content.

### IR / NCR / Materials / Billing / Docs / Safety
- `open-ir-detail` opened IR detail modal.
- `open-ncr-detail` opened NCR detail modal.
- `open-mat-detail` opened material detail modal.
- `open-mat-qc` opened material QC modal.
- `open-morning-view` opened morning meeting modal.
- `open-doc-review` opened document review modal.
- `filter-ir` switched IR filter selection; active filter text became `全部 (24)`.
- `retry-billing` toggled billing empty/loading state: `billing-loading` visible, `billing-empty` hidden.
- `safety-step` displayed the safety wizard (`#safety-wizard` = block).

## Risks / gaps
1. `npm run format:check` is red, so CI parity is not fully reproducible from this workspace without fixing formatting drift.
2. I did not complete a deep probe of all safety wizard sub-steps / mobile responsive branches within this session.
3. Backend/data-driven behavior is still mock/static; no live backend validation was possible in this repo.

## Verdict
**PARTIAL** — core centralized dispatch interactions validated successfully, but format check remains failing and some adjacent branches were not exhaustively covered.
