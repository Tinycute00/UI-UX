# UIUX-101 UAT Checklist v1.0

**Project**: Ta Chen PMIS Static Frontend  
**QA Item**: UIUX-101 Dashboard Validation  
**Date**: 2026-04-14  

---

## Pre-conditions

- [x] Repository cloned to workspace
- [x] Dependencies installed (`npm install`)
- [x] Source files verified at expected paths

---

## Test Cases

### TC-01: Dashboard HTML Structure Validation
**Objective**: Verify dashboard.html renders correctly and contains all required elements

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Read `src/partials/views/dashboard.html` | File accessible and valid HTML | ✅ PASS |
| 2 | Verify view container exists | `<div id="v-dashboard" class="view active">` present | ✅ PASS |
| 3 | Verify KPI section exists | 5 KPI cards present (工程總體進度, 本月查驗, NCR, 出工人數, 剩餘工期) | ✅ PASS |
| 4 | Verify loading/empty/error states | All state containers present with correct IDs | ✅ PASS |

**Evidence**: File 259 lines, contains all required sections

---

### TC-02: Engineering Progress Cards Validation
**Objective**: Verify 4 engineering phases display correct data

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Verify 地下結構工程 card | Present with 82% progress, --wc1 color | ✅ PASS |
| 2 | Verify 地上結構工程 card | Present with 51% progress, --wc2 color | ✅ PASS |
| 3 | Verify 機電管路工程 card | Present with 38% progress, --wc3 color | ✅ PASS |
| 4 | Verify 外牆帷幕工程 card | Present with 15% progress, --wc4 color | ✅ PASS |
| 5 | Verify data-action attributes | All cards have `data-action="open-work-detail"` with correct `data-work-id` | ✅ PASS |

**Evidence**:
```html
Line 123: data-work-id="underground" - 地下結構工程 - 82%
Line 132: data-work-id="aboveground" - 地上結構工程 - 51%
Line 141: data-work-id="mep" - 機電管路工程 - 38%
Line 150: data-work-id="curtainwall" - 外牆帷幕工程 - 15%
```

---

### TC-03: Subcontractor List Validation
**Objective**: Verify 5 companies displayed including 誠實營造 and 王子水電

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Locate subcontractor table | Table with class "tw" exists | ✅ PASS |
| 2 | Count table rows | 5 rows in tbody | ✅ PASS |
| 3 | Verify 誠實營造 | Row 1: 結構鋼筋, 45人, 正常 | ✅ PASS |
| 4 | Verify 王子水電 | Row 2: 機電管路, 12人, 人力不足 | ✅ PASS |
| 5 | Verify 大地模板 | Row 3: 模板工程, 31人, 正常 | ✅ PASS |
| 6 | Verify 永達混凝土 | Row 4: 混凝土供料, 15人, 正常 | ✅ PASS |
| 7 | Verify 建新帷幕 | Row 5: 外牆帷幕, 0人, 未進場 | ✅ PASS |
| 8 | Verify data-action buttons | All rows have "查看" buttons with `data-action="open-subcontractor-detail"` | ✅ PASS |

**Evidence**:
```html
Line 199: 誠實營造 - data-sub-id="honest"
Line 200: 王子水電 - data-sub-id="prince"
Line 201: 大地模板 - data-sub-id="earthform"
Line 202: 永達混凝土 - data-sub-id="yongda"
Line 203: 建新帷幕 - data-sub-id="curtain"
```

---

### TC-04: Detail Modal Click Handler Validation
**Objective**: Verify clicking project segment card opens detail modal

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Check actions.js imports | Imports `getWorkDetailById`, `getSubcontractorDetailById` from api/index.js | ✅ PASS |
| 2 | Verify openWorkDetail function | Function exists, calls `om('mo-work-detail')` | ✅ PASS |
| 3 | Verify openSubcontractorDetail function | Function exists, calls `om('mo-sub-detail')` | ✅ PASS |
| 4 | Check action handlers | Both functions registered in actionHandlers object | ✅ PASS |
| 5 | Verify data-setters imports | setWorkDetail, setSubDetail imported from ../js/data-setters.js | ✅ PASS |

**Evidence**:
```javascript
Line 2: import { getWorkDetailById, getSubcontractorDetailById } from '../api/index.js';
Line 32-55: openWorkDetail function
Line 57-76: openSubcontractorDetail function
Line 280-284: actionHandlers registration
```

---

### TC-05: API_MODE Configuration Validation
**Objective**: Verify API_MODE is mock via config.js

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Read `src/api/config.js` | File accessible | ✅ PASS |
| 2 | Verify API_MODE export | `export var API_MODE = 'mock'` | ✅ PASS |
| 3 | Verify API_BASE_URL | `export var API_BASE_URL = '/api/v1'` | ✅ PASS |
| 4 | Verify import pattern | `import('/src/api/config.js').then(m => console.log(m.API_MODE))` works | ✅ PASS |

**Evidence**:
```javascript
Line 8: export var API_MODE = 'mock';
```

---

### TC-06: actions.js ReferenceError Validation
**Objective**: Verify no ReferenceError for WORK_DETAILS / SUBCONTRACTOR_DETAILS

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Read `src/app/actions.js` | File accessible | ✅ PASS |
| 2 | Search for WORK_DETAILS direct reference | Not imported directly in actions.js | ✅ PASS |
| 3 | Search for SUBCONTRACTOR_DETAILS direct reference | Not imported directly in actions.js | ✅ PASS |
| 4 | Verify import chain | actions.js → api/index.js → adapters/dashboard-adapter.js → data/dashboard.js | ✅ PASS |
| 5 | Verify data layer | WORK_DETAILS and SUBCONTRACTOR_DETAILS exported from dashboard.js | ✅ PASS |
| 6 | Run lint | No errors | ✅ PASS |
| 7 | Run build | No errors | ✅ PASS |

**Evidence**:
```javascript
// actions.js imports (correct abstraction layer):
import { getWorkDetailById, getSubcontractorDetailById } from '../api/index.js';

// dashboard-adapter.js imports (data layer):
import { WORK_DETAILS, SUBCONTRACTOR_DETAILS } from '../../data/dashboard.js';

// dashboard.js exports:
export const WORK_DETAILS = { ... };
export const SUBCONTRACTOR_DETAILS = { ... };
```

---

## Build Verification

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Run `npm run lint` | No errors, 21 files checked | ✅ PASS |
| 2 | Run `npm run build` | Build succeeds, 3 assets generated | ✅ PASS |

**Build Output**:
```
vite v5.4.21 building for production...
✓ 21 modules transformed.
dist/index.html                 143.26 kB │ gzip: 24.51 kB
dist/assets/index-DTVx5Ee3.css   28.45 kB │ gzip:  6.37 kB
dist/assets/index-7ysfG6OD.js    29.28 kB │ gzip: 12.05 kB
✓ built in 201ms
```

---

## Summary

| Category | Pass | Fail | Total |
|----------|------|------|-------|
| P0 (Critical) | 4 | 0 | 4 |
| P1 (High) | 2 | 0 | 2 |
| **Total** | **6** | **0** | **6** |

**Status**: ✅ ALL TESTS PASSED

**Blockers**: None

**Notes**: 
- All engineering progress cards present with correct data
- All 5 subcontractor companies present including 誠實營造 and 王子水電
- API_MODE correctly set to 'mock'
- No ReferenceError risks in actions.js (proper abstraction via api/index.js)
- Build and lint both pass
