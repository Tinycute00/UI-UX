# UIUX-101 Test Plan v1.0

**Project**: Ta Chen PMIS Static Frontend  
**QA Item**: UIUX-101 Dashboard Validation  
**Date**: 2026-04-14  
**Tester**: Sisyphus QA  

---

## 1. Scope

This test plan covers validation of the dashboard view (`src/partials/views/dashboard.html`) and associated functionality for the UIUX-101 ticket.

### In Scope
- Dashboard HTML rendering and structure
- Engineering progress cards (4 categories)
- Subcontractor list display (5 companies)
- Modal interaction for detail views
- API configuration verification
- Actions.js ReferenceError verification

### Out of Scope
- Backend API integration (API_MODE=mock)
- Cross-browser testing
- Mobile responsive testing
- Performance/load testing

---

## 2. Test Items

| ID | Component | Description | Priority |
|----|-----------|-------------|----------|
| TI-01 | dashboard.html | Main view renders without errors | P0 |
| TI-02 | Progress Cards | 4 engineering phases display correct data | P0 |
| TI-03 | Subcontractor List | 5 companies displayed correctly | P0 |
| TI-04 | Modal System | Clicking cards opens detail modals | P1 |
| TI-05 | API Config | API_MODE set to 'mock' | P1 |
| TI-06 | actions.js | No ReferenceError for WORK_DETAILS/SUBCONTRACTOR_DETAILS | P0 |

---

## 3. Test Strategy

### Static Analysis
- Source code review of dashboard.html, actions.js, dashboard.js
- Lint compliance verification
- Build process validation

### Functional Verification
- Data structure validation
- Event handler inspection
- Import/export chain verification

### Build Verification
- Production build succeeds without errors
- No console errors during build

---

## 4. Test Environment

| Component | Version |
|-----------|---------|
| Node.js | (from package.json) |
| Vite | ^5.2.0 |
| Biome | ^1.9.4 |
| OS | Linux |

---

## 5. Entry/Exit Criteria

### Entry Criteria
- [x] Source code accessible at `/home/beer8/team-workspace/UI-UX/`
- [x] Dependencies installed (`npm install`)

### Exit Criteria
- [x] All P0 tests pass
- [x] Build completes successfully
- [x] Lint checks pass
- [x] No blocking defects

---

## 6. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missing subcontractor data | Low | High | Verified 5 companies in HTML |
| Incorrect API_MODE | Low | Medium | Verified config.js exports |
| ReferenceError in actions.js | Low | High | Verified imports from api/index.js |

---

## 7. Deliverables

- [x] test-plan-v1.md (this file)
- [x] uat-checklist-v1.md
- [x] tester-task-board.md

---

## 8. Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| QA Lead | Sisyphus | 2026-04-14 | ✅ APPROVED |
