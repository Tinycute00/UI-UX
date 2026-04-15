# Test Plan v1.0 — Ta Chen PMIS Static Frontend

**Repository:** `/home/beer8/team-workspace/UI-UX`  
**Last Updated:** 2026-04-14  
**Scope:** Wave 1 critical paths for Dashboard / Billing / Safety, plus Auth gap analysis  
**Status:** Static prototype validation only

---

## 1. Purpose

This plan validates the current **static frontend prototype** of the PMIS. The repo is built from HTML partials, client-side JS handlers, and hardcoded data modules. At this stage, QA can verify:

- rendering and layout of static views
- view navigation and drawer/bottom-nav switching
- modal opening/closing and client-side state updates
- safety wizard interactions
- data binding from local JS modules
- obvious absence of auth/backend-dependent behavior

QA cannot yet validate:

- server-side persistence
- login/session/RBAC
- real API-driven CRUD
- upload pipelines
- database correctness
- network error handling from live endpoints

---

## 2. Evidence-based scope split

### 2.1 Currently testable in the repo
Confirmed from repository evidence:

- Dashboard view and drilldowns in `src/partials/views/dashboard.html`
- Billing view and detail modal in `src/partials/views/billing.html`
- Safety wizard in `src/partials/views/safety.html` and `src/js/safety.js`
- Navigation wiring in `src/partials/shell/sidebar.html`, `src/app/actions.js`, `src/js/navigation.js`
- Modal/detail panels in `src/partials/modals/*.html`
- Static data binding from `src/data/*.js`
- Checklist toggles, toast actions, and modal state changes

### 2.2 Must wait for backend/database delivery
Not verifiable yet in this repo:

- authentication and authorization
- real user identity/session state
- persisted billing submission / approval workflow
- persisted safety submissions and uploaded photo storage
- real dashboard aggregation from backend data
- network contract validation and API failure handling
- audit trail / DB integrity checks

---

## 3. Testing strategy

### 3.1 Strategy by layer

| Layer | Goal | Current status | Evidence |
|---|---|---:|---|
| L1 Static rendering | Verify layout, typography, responsive shell, empty/error-free load | ✅ Testable now | Full-page screenshots |
| L2 Client-side interaction | Verify clicks, navigation, modals, toggles, wizard transitions | ✅ Testable now | Screen recording + console |
| L3 Local data binding | Verify static data modules populate details correctly | ✅ Testable now | Modal screenshots + DOM/console |
| L4 Integration/API | Verify real requests, response handling, persistence | ⛔ Future-only | Network logs after backend delivery |
| L5 Auth/security | Verify login, session, permissions, protected routes | ⛔ Future-only | Requires auth implementation |

### 3.2 Risk grading

| Risk | Definition | Current examples |
|---|---|---|
| P0 | Blocks Wave 1 user flow or exposes no-workaround gap | Auth missing; no persistence for submitted workflows |
| P1 | Breaks primary module behavior or key navigation | Drilldown modal mismatch; wizard step transition failure |
| P2 | Secondary interaction or content quality issue | Copy/label issues, alignment issues, non-critical toast behavior |
| P3 | Cosmetic only | Spacing, icon alignment, minor visual polish |

### 3.3 Test method

1. **Static prototype verification**
   - open the app locally
   - verify all views render
   - navigate through dashboard, billing, safety
   - inspect modal content against static data modules

2. **Interaction regression**
   - verify clickable dashboard cards and rows
   - verify checklist toggle behavior
   - verify safety wizard steps 1→2→3
   - verify mobile sidebar/bottom-nav switching where available

3. **Future integration prep**
   - document which workflows depend on backend delivery
   - define evidence needed once APIs exist
   - keep static prototype cases as smoke regression after API migration

---

## 4. Wave 1 critical paths

### 4.1 Dashboard critical path
1. Load app and land on dashboard
2. Confirm top KPI cards render
3. Click progress/drilldown surfaces to open detail panels
4. Verify subcontractor table actions open correct modal content
5. Toggle checklist items without breaking the page
6. Navigate to Billing and Safety from the shell

**Primary risk:** dashboard data is currently hardcoded, so the critical regression is broken click-to-modal wiring or stale labels when static content changes.

### 4.2 Billing critical path
1. Open Billing view from sidebar or dashboard
2. Confirm summary KPI cards render
3. Open billing detail for periods 1–4
4. Open new billing modal from “新增估驗”
5. Confirm table and modal content match `src/data/finance.js`

**Primary risk:** billing is currently display-only; the highest gap is missing persistence / submit flow once backend arrives.

### 4.3 Safety critical path
1. Open Safety view
2. Start the 3-step wizard
3. Select locations and inspection items
4. Advance to checklist generation
5. Mark pass/fail states and add remarks
6. Continue to upload/confirmation/signature step
7. Trigger send action and confirm UI reset/toast behavior

**Primary risk:** wizard state transitions and validation order must remain stable; actual upload/signature persistence is future-only.

### 4.4 Auth critical path
1. Confirm whether any login UI exists in the current repo
2. Confirm whether session state or protected routes exist
3. Confirm whether any user-switching or logout behavior is present

**Current finding:** auth is not implemented; only a hardcoded sidebar identity (`王建明 / Site Manager`) is present. This is a **future-only** verification area.

---

## 5. Module-level test focus

### 5.1 Dashboard
**Testable now**
- KPI card click navigation
- work detail modal opening
- subcontractor detail modal opening
- checklist toggle behavior
- static charts and summary blocks

**Not testable yet**
- backend refresh
- live totals
- role-based dashboard slicing

### 5.2 Billing
**Testable now**
- summary cards render
- billing table rows match static data
- billing detail modal content matches data module
- modal open/close behavior

**Not testable yet**
- submit/approve/persist flows
- payment status updates from server
- concurrency/edit conflicts

### 5.3 Safety
**Testable now**
- wizard entry/cancel
- step 1 selection controls
- dynamic step 2 checklist generation
- pass/fail button state changes
- remarks input
- photo upload trigger toast
- confirmation checkbox and signature simulation
- send action and reset behavior

**Not testable yet**
- file upload storage
- signature capture persistence
- submission API response handling
- audit log generation

### 5.4 Auth
**Testable now**
- negative verification only: prove auth is absent

**Not testable yet**
- login/logout
- token lifecycle
- permission-gated routing
- password reset/MFA

---

## 6. Test data requirements

### 6.1 Static test data already present
- `src/data/dashboard.js` for work and subcontractor details
- `src/data/finance.js` for billing periods
- `src/data/quality.js` for IR/NCR scenarios
- `src/data/meetings.js` for meeting summaries
- `src/data/documents.js` for document views and reviews
- `src/data/materials.js` for material verification

### 6.2 Data needed for future integration testing
- authenticated test user roles: admin / site manager / engineer / reviewer
- billing records across approved / pending / rejected states
- safety inspection records with uploaded photo attachments
- network failure cases: 401 / 403 / 500 / timeout
- empty-state records for new project / no records / no permission

---

## 7. Evidence requirements

### 7.1 Screenshots
Capture:
- dashboard full page
- billing full page
- safety step 1, step 2, step 3
- each relevant modal/detail panel
- mobile and desktop layouts if responsive behavior is in scope

### 7.2 Recordings
Capture:
- dashboard drilldown flow
- billing detail modal flow
- safety wizard end-to-end flow
- any nav/drawer mobile interactions

### 7.3 Console / network evidence
Capture:
- zero load-time JS errors
- no broken imports for static modules
- no failed local asset requests
- future phase: API request/response traces for auth, billing, safety

### 7.4 Acceptance for evidence package
Each P0 case should include:
- 1 screenshot or short clip for the current state
- console note if any warning/error appears
- a short statement of whether the step is static-only or backend-dependent

---

## 8. Dependencies and blockers

| Dependency | Status | Impact |
|---|---|---|
| Vite local run | Required now | Must be available to exercise interactions |
| Static partials/data modules | Present | Enables prototype validation |
| Backend APIs | Missing | Blocks persistence and auth testing |
| Database | Missing | Blocks data integrity checks |
| File storage | Missing | Blocks real photo upload validation |

---

## 9. Release gate recommendation

**Static prototype gate:** pass if all Wave 1 critical path interactions work and there are no blocking console/runtime errors.

**Full Wave 1 gate:** requires backend/database/auth delivery and a second pass on persistence, network, and role-based cases.

---

## 10. Summary

This release can be tested thoroughly as a static prototype. The main QA focus should be on navigation integrity, modal correctness, safety wizard stability, and protecting the boundary between static mock behavior and future API-backed behavior.
