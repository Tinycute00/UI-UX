# Tester Task Board v1.0 — Wave 1 QA

**Repo:** `/home/beer8/team-workspace/UI-UX`  
**Scope:** Wave 1 static prototype validation for Dashboard / Billing / Safety  
**Audience:** PM, Frontend, Backend, DevOps  
**Status:** Ready for execution against current static frontend  
**Workspace rule:** any Tester-triggered OpenCode or terminal workflow must explicitly set `workdir=/home/beer8/team-workspace/UI-UX`
**Rule-sync guardrail:** when PM changes cross-role execution rules, the tester must update workflow/skill/memory/docs together and report the actual updated carrier(s); do not rely on chat memory alone

---

## 1. Board legend

- **P0** = must pass before release / blocker
- **P1** = high priority regression / must be verified before handoff
- **P2** = valuable but not blocking

Evidence types:
- **SS** = screenshot
- **REC** = screen recording
- **CON** = console capture
- **NET** = network capture
- **SRC** = source reference / static data check

---

## 2. P0 tasks

| ID | Task | Acceptance criteria | Dependencies | Evidence required | Status |
|---|---|---|---|---|---|
| QA-P0-01 | Verify app shell boots cleanly | App opens with no blank screen and no blocking JS errors | Vite dev server; static assets load | SS + CON | Pass — live login→dashboard shell loaded; console clean on shell nav |
| QA-P0-02 | Dashboard critical path smoke | Dashboard renders; KPI drilldowns and detail modals open correctly | App shell; static data modules | REC + SS + SRC | Blocked — live dashboard shows error state; backend contract gap still impacts initialization |
| QA-P0-03 | Billing critical path smoke | Billing view renders; billing detail modal opens for each period; “新增估驗” opens modal | App shell; `src/data/finance.js` | REC + SS + SRC | Blocked — not re-run in stable preview during this evidence pass |
| QA-P0-04 | Safety wizard critical path smoke | Safety wizard reaches steps 1–3 and send/reset behavior works | App shell; `src/js/safety.js` | REC + SS + CON | Blocked — not re-run in stable preview during this evidence pass |
| QA-P0-05 | Auth gap verification | Confirm login/session/RBAC are not implemented in current static repo and document as future-only | Source review of sidebar/shell | SS + SRC | Blocked / future-only — static auth shell only; no session/RBAC UI flow implemented |

### P0 acceptance gate
All P0 tasks must pass except the auth gap task, which must be **documented as blocked/future-only** rather than falsely passed.

---

## 3. P1 tasks

| ID | Task | Acceptance criteria | Dependencies | Evidence required | Status |
|---|---|---|---|---|---|
| QA-P1-01 | Dashboard data fidelity review | Dashboard visible values match `src/data/dashboard.js` and do not drift from static source | Dashboard modal/detail data | SS + SRC | Pending |
| QA-P1-02 | Billing data fidelity review | Billing table rows and detail modal values match `src/data/finance.js` | Billing view and modal access | SS + SRC | Pending |
| QA-P1-03 | Safety wizard state robustness | Step transitions, checklist generation, and pass/fail state changes remain stable under repeated toggles | Safety wizard interactions | REC + CON | Pending |
| QA-P1-04 | Navigation regression | Sidebar and mobile navigation preserve active view state when switching modules | Responsive layout / nav shell | REC + SS | Pending |
| QA-P1-05 | Modal close/open hygiene | Open/close behavior for primary modals does not leave stale overlay states | Modal stack in `src/partials/modals/*` | REC + SS | Pending |

### P1 acceptance gate
No broken navigation, no stale modal overlays, and no mismatch between visible content and static source data.

---

## 4. P2 tasks

| ID | Task | Acceptance criteria | Dependencies | Evidence required | Status |
|---|---|---|---|---|---|
| QA-P2-01 | Layout polish check | Dashboard, billing, and safety layouts avoid obvious clipping/overflow on desktop | Browser viewport testing | SS | Pending |
| QA-P2-02 | Checklist copy review | UAT labels and buttons are understandable and consistent in Chinese UI copy | Static screens | SS + notes | Pending |
| QA-P2-03 | Toast/message review | Toasts and inline hints appear for simulated actions without UI breakage | Safety and modal actions | REC | Pending |
| QA-P2-04 | Mobile responsiveness check | Core shell remains usable at mobile widths | Responsive browser checks | SS + REC | Pending |
| QA-P2-05 | Documentation completeness review | QA artifacts clearly separate static-only vs future API work | Docs review | SRC | Pending |

### P2 acceptance gate
Issues found here should be logged but should not block release unless they hide core workflows.

---

## 5. Critical path mapping by module

### Dashboard
- load shell
- view dashboard
- click KPI drilldown
- open work detail modal
- open subcontractor detail modal
- return to dashboard

### Billing
- load billing view
- inspect summary cards
- open billing detail modal
- open new estimate modal
- confirm display-only status of current prototype

### Safety
- open safety view
- start wizard
- complete step 1 selections
- verify step 2 checklist generation
- use pass/fail controls and remarks
- confirm step 3 upload/sign/send placeholders

### Auth
- confirm absence of auth UI
- confirm sidebar hardcoded identity only
- mark login/session/RBAC as future-only

---

## 6. Dependencies

### Present in repo and usable now
- `src/partials/views/dashboard.html`
- `src/partials/views/billing.html`
- `src/partials/views/safety.html`
- `src/js/safety.js`
- `src/js/navigation.js`
- `src/app/actions.js`
- `src/data/dashboard.js`
- `src/data/finance.js`
- `src/partials/shell/sidebar.html`

### Missing until future delivery
- backend APIs
- database persistence
- auth/session system
- file upload storage
- server-side role enforcement

---

## 7. Evidence requirements by task type

| Task type | Minimum evidence |
|---|---|
| Static smoke | screenshot + console capture |
| Multi-step interaction | screen recording |
| Data fidelity | screenshot + source reference |
| Future-only gap | source note showing absence |
| Backend phase | network trace + API response evidence |

---

## 8. Ready-to-execute checklist

- [ ] Run static smoke on dashboard, billing, safety
- [ ] Capture modal and wizard recordings
- [ ] Confirm no runtime errors in console
- [ ] Mark auth as future-only gap
- [ ] Attach screenshot/recording evidence for all P0 items
- [ ] Escalate any mismatch between UI and static source data

---

## 9. Exit criteria

The Wave 1 QA board may be closed when:
1. all P0 static prototype checks pass,
2. auth gap is documented clearly,
3. evidence package is complete,
4. remaining items are either P1/P2 or future-only backend work.
