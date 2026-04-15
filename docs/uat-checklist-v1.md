# UAT & Smoke Checklist v1.0 — Ta Chen PMIS Wave 1

**Repo:** `/home/beer8/team-workspace/UI-UX`  
**Date:** 2026-04-14  
**Scope:** Dashboard / Billing / Safety / Auth  
**Test mode:** Static prototype now; backend-dependent items marked future-only

---

## 1. How to use this checklist

- **Smoke** = quick verification of major flows after each local build / deploy.
- **UAT** = deeper scenario-based validation of the current static prototype.
- Mark each item as:
  - ✅ Pass
  - ⚠️ Partial / blocked in static prototype
  - ⛔ Future-only

**Evidence to collect when passing a case:**
- screenshot for the current screen
- short recording for multi-step flows
- console check for JS/runtime errors
- network tab note if future API behavior is involved

---

## 2. Environment / preflight smoke

| ID | Case | Steps | Expected | Evidence |
|---|---|---|---|---|
| SMK-00 | App loads | Open local app | Main shell renders without blank screen | Full-page screenshot + console |
| SMK-01 | Sidebar navigation | Click Dashboard / Billing / Safety | View switches correctly | Short recording |
| SMK-02 | Mobile nav shell | Use bottom nav / drawer if on mobile | Active state changes correctly | Mobile screenshot / recording |
| SMK-03 | No runtime errors | Open DevTools console on load | No blocking JS errors | Console capture |

---

## 3. Dashboard checklist

### Dashboard smoke cases

| ID | Case | Steps | Expected | Evidence | Status note |
|---|---|---|---|---|---|
| DSH-SMK-01 | KPI cards render | Open Dashboard | 5 KPI cards display correctly | Screenshot | Testable now |
| DSH-SMK-02 | Drilldown to daily view | Click “施工日報” KPI | Switches to Daily view | Recording | Testable now |
| DSH-SMK-03 | Drilldown to IR view | Click “查驗資料 (IR)” KPI | Switches to IR view | Recording | Testable now |
| DSH-SMK-04 | Drilldown to NCR view | Click “缺失追蹤 (NCR)” KPI | Switches to NCR view | Recording | Testable now |
| DSH-SMK-05 | Drilldown to Morning view | Click “工地晨會記錄” KPI | Switches to Morning view | Recording | Testable now |
| DSH-SMK-06 | Drilldown to Billing view | Click “估驗請款” KPI | Switches to Billing view | Recording | Testable now |

### Dashboard UAT cases

| ID | Case | Steps | Expected | Evidence | Status note |
|---|---|---|---|---|---|
| DSH-UAT-01 | Work detail modal | Click each progress row | Correct modal opens for underground / aboveground / mep / curtainwall | Modal screenshots | Testable now |
| DSH-UAT-02 | Subcontractor detail modal | Click each “查看” button | Modal content matches selected subcontractor | Modal screenshots | Testable now |
| DSH-UAT-03 | Checklist toggle | Toggle several “本週待辦” items | Checkbox state changes without page error | Recording | Testable now |
| DSH-UAT-04 | Static data sanity | Compare displayed values with `src/data/dashboard.js` | Visible detail values are consistent with source data | Screenshot + source note | Testable now |
| DSH-UAT-05 | Layout sanity | Verify chart, cards, table, and cards at desktop width | No overlap or clipping in main dashboard layout | Screenshot | Testable now |

**Dashboard critical path:** load dashboard → open drilldown → open detail modal → return to shell.

**Future-only dashboard items:** backend-fed progress values, live timeline refresh, role-based slices.

---

## 4. Billing checklist

### Billing smoke cases

| ID | Case | Steps | Expected | Evidence | Status note |
|---|---|---|---|---|---|
| BIL-SMK-01 | Open Billing | Navigate to Billing | Billing shell renders | Screenshot | Testable now |
| BIL-SMK-02 | Summary cards | Inspect top KPI cards | 4 summary cards render with values | Screenshot | Testable now |
| BIL-SMK-03 | Billing table rows | Review periods 1–5 | Table rows are visible and ordered | Screenshot | Testable now |
| BIL-SMK-04 | Open “新增估驗” | Click new estimate button | Billing modal opens | Recording | Testable now |

### Billing UAT cases

| ID | Case | Steps | Expected | Evidence | Status note |
|---|---|---|---|---|---|
| BIL-UAT-01 | View period detail | Click “查看” for periods 1–4 | Detail modal shows matching data for selected period | Modal screenshots | Testable now |
| BIL-UAT-02 | Data consistency | Compare table values with `src/data/finance.js` | Period/range/percent/amounts match source data | Screenshot + source note | Testable now |
| BIL-UAT-03 | Cash flow block | Inspect cash flow summary | Progress bar and amounts display without error | Screenshot | Testable now |
| BIL-UAT-04 | Add estimate flow | Open new billing modal and inspect fields | Modal is usable as static placeholder only | Recording | Testable now / no submit |
| BIL-UAT-05 | Submit/persist gap | Attempt to complete billing workflow | No real save/persist exists in static repo | Console/network note | Future-only |

**Billing critical path:** open billing → inspect current period → open detail modal → confirm static data consistency.

**Future-only billing items:** create/update/approve persistence, server-calculated statuses, payment posting, ledger integration.

---

## 5. Safety checklist

### Safety smoke cases

| ID | Case | Steps | Expected | Evidence | Status note |
|---|---|---|---|---|---|
| SAF-SMK-01 | Open Safety | Navigate to Safety | Safety page renders | Screenshot | Testable now |
| SAF-SMK-02 | Start wizard | Click “新增巡檢日誌” | Wizard appears at step 1 | Recording | Testable now |
| SAF-SMK-03 | Cancel wizard | Click cancel | Wizard hides/reset behavior works | Recording | Testable now |

### Safety UAT cases

| ID | Case | Steps | Expected | Evidence | Status note |
|---|---|---|---|---|---|
| SAF-UAT-01 | Step 1 location selection | Select one or more locations | Selection remains visible and usable | Recording | Testable now |
| SAF-UAT-02 | Step 1 inspection items | Select inspection items | Selected items remain available for step 2 generation | Recording | Testable now |
| SAF-UAT-03 | Step 2 checklist generation | Advance to step 2 | Checklist is generated from step 1 selections | Screenshot | Testable now |
| SAF-UAT-04 | Pass/fail state | Toggle pass/fail buttons | UI state changes for checklist item | Recording | Testable now |
| SAF-UAT-05 | Remarks input | Enter defect remarks | Remarks field accepts text | Screenshot | Testable now |
| SAF-UAT-06 | Photo upload trigger | Click upload zone | Toast appears; no real upload stored | Recording | Static placeholder |
| SAF-UAT-07 | Confirmation + signature | Check confirmation and click signature zone | Confirmation UI and signature simulation behave as designed | Recording | Testable now |
| SAF-UAT-08 | Send action | Click send button | Success/reset behavior appears; no persistence expected | Full recording + console | Testable now / future-only persistence |

**Safety critical path:** open wizard → complete step 1 → step 2 checks → step 3 confirmation/signature → send.

**Future-only safety items:** file upload storage, signature capture persistence, backend validation, audit trail.

---

## 6. Auth checklist

### Auth smoke cases

| ID | Case | Steps | Expected | Evidence | Status note |
|---|---|---|---|---|---|
| AUT-SMK-01 | Auth presence check | Inspect shell/navigation for login entry point | No login UI is currently present | Screenshot / source note | Future-only gap check |
| AUT-SMK-02 | User identity display | Inspect sidebar user area | Hardcoded user identity appears | Screenshot | Testable now (negative gap) |

### Auth UAT cases

| ID | Case | Steps | Expected | Evidence | Status note |
|---|---|---|---|---|---|
| AUT-UAT-01 | Login flow | Attempt to sign in | Not available in current repo | N/A | ⛔ Future-only |
| AUT-UAT-02 | Logout/session | Attempt session logout | Not available in current repo | N/A | ⛔ Future-only |
| AUT-UAT-03 | Protected routes | Attempt route restriction | Not available in current repo | N/A | ⛔ Future-only |
| AUT-UAT-04 | RBAC | Verify role-based access | Not available in current repo | N/A | ⛔ Future-only |

**Auth critical path:** currently only an absence check can be performed. The sidebar shows a fixed identity (`王建明 / Site Manager`) and there is no login/logout/session flow in the current static prototype.

---

## 7. Evidence checklist by artifact type

### Required for P0 acceptance
- [ ] Dashboard full-page screenshot
- [ ] Billing full-page screenshot
- [ ] Safety step 1 screenshot
- [ ] Safety step 2 screenshot
- [ ] Safety step 3 screenshot
- [ ] One recording each for dashboard drilldown, billing modal, safety wizard
- [ ] Console capture with no blocking JS errors
- [ ] Network note confirming no missing local resources

### Required for future backend validation
- [ ] Request/response capture for auth
- [ ] Request/response capture for billing submit/approve
- [ ] Request/response capture for safety submission and file upload
- [ ] Error-state captures for 401/403/500/timeouts

---

## 8. Sign-off rule

Pass the current Wave 1 UAT smoke only when:
1. All smoke cases in dashboard, billing, and safety pass in the static prototype.
2. Auth absence is documented as a known gap, not treated as a pass.
3. Console shows no blocking runtime errors.
4. Evidence package is complete.

---

## 9. Notes for the next phase

When backend/database delivery lands, extend this checklist with:
- real login/logout flows
- persisted billing submissions
- persisted safety reports and uploads
- API error handling and retries
- role-based route access
