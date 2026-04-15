# QA Verification Report: PMIS UI Prototype - UIUX-201

**Date:** 2026-04-14  
**Tester:** Automated QA (Playwright)  
**Scope:** Static frontend behaviors validation (no backend)  
**Environment:** Local Vite preview server (http://localhost:4176)  

---

## Executive Summary

| Metric | Count |
|--------|-------|
| ✅ Passed | 2 |
| ❌ Failed | 0 |
| ⏸️ Blocked | 3 |
| **Code Changes Required** | **YES** |

**Overall Status:** Requirements partially met. Three critical interactions are non-functional due to missing JavaScript handlers (data-action attributes).

---

## Test Environment

- **Browser:** Chromium (Playwright)
- **Viewport:** 1280x800
- **Build:** Vite production build (`dist/` folder)
- **Commands Used:**
  ```bash
  npm run preview  # Port 4176
  node scripts/qa-verify-uiux-201-v2.js
  ```

---

## Detailed Findings

**Rule-sync note:** This report must be revalidated against the current workspace using the latest QA rule set: `/ulw-loop` with `workdir=/home/beer8/team-workspace/UI-UX`, and all conclusions must distinguish source-review evidence from browser/runtime/live evidence.

### Requirement 1: v-docs Filter Bar - 6 Buttons
**Status:** ✅ **PASSED**

**Evidence:**
- Found exactly 6 filter buttons in `#v-docs .fbar`
- Button labels match specification exactly:
  1. 全部
  2. 施工計畫書
  3. 設計圖說
  4. 品管文件
  5. 工安文件
  6. 合約文件

**File Location:** `src/partials/views/docs.html` lines 5-10

---

### Requirement 2: Filter Functionality - Toggle Active State & Filter Cards
**Status:** ⏸️ **BLOCKED**

**Evidence:**
```
Button: "全部" | data-action: null
Button: "施工計畫書" | data-action: null
Button: "設計圖說" | data-action: null
Button: "品管文件" | data-action: null
Button: "工安文件" | data-action: null
Button: "合約文件" | data-action: null
```

**Root Cause:** Filter buttons lack `data-action` attributes. The action dispatcher in `src/app/actions.js` only handles clicks on elements with `data-action` attributes (line 430).

**Required Implementation:**
Add document filter logic similar to `filterIR()` in `src/js/data-setters.js`. The filter buttons need:
- `data-action="filter-docs"` attribute
- `data-filter` attribute with category value
- Corresponding handler in `actionHandlers`

**Code Changes Required:** YES

---

### Requirement 3: Filter Scope Isolation
**Status:** ✅ **PASSED**

**Evidence:**
- IR page has independent filter bar with different buttons:
  - 全部 (24)
  - 待審查 (3)
  - 已通過 (18)
  - 不合格 (3)
- IR filters have proper `data-action="filter-ir"` handlers
- Filter states are isolated by view (different DOM scopes: `#v-docs` vs `#v-ir`)

**Note:** While IR filters work correctly, v-docs filters are non-functional. The isolation architecture is correct but one side is unimplemented.

---

### Requirement 4: 申請調閱 Button Toast Message
**Status:** ⏸️ **BLOCKED**

**Required Toast Text:**
```
申請調閱已送出,請等候承辦人員審核（功能開發中）
```

**Evidence:**
- Button exists in row 7 of document table
- Button text: "申請調閱"
- **data-action: null** (NO HANDLER)

**Current HTML (docs.html line 22):**
```html
<button class="btn bg btn-sm">
  <span class="ic s12"><svg><use href="#ic-lock"/></svg></span> 
  申請調閱
</button>
```

**Required HTML:**
```html
<button class="btn bg btn-sm" 
        data-action="toast-msg" 
        data-msg="申請調閱已送出,請等候承辦人員審核（功能開發中）"
        data-type="ts">
  <span class="ic s12"><svg><use href="#ic-lock"/></svg></span> 
  申請調閱
</button>
```

**Code Changes Required:** YES

---

### Requirement 5: v-morning PDF Preview Toast
**Status:** ⏸️ **BLOCKED**

**Required Toast Text:**
```
PDF 預覽功能尚在建置中,請稍後再試
```

**Evidence:**
- Button exists: "預覽 PDF"
- **data-action: null** (NO HANDLER)

**Current HTML (morning.html line 17):**
```html
<button class="btn bg">
  <span class="ic s14"><svg><use href="#ic-print"/></svg></span> 
  預覽 PDF
</button>
```

**Required HTML:**
```html
<button class="btn bg" 
        data-action="toast-msg" 
        data-msg="PDF 預覽功能尚在建置中,請稍後再試"
        data-type="ts">
  <span class="ic s14"><svg><use href="#ic-print"/></svg></span> 
  預覽 PDF
</button>
```

**Code Changes Required:** YES

---

## Code Changes Summary

### Files Requiring Modification

1. **src/partials/views/docs.html**
   - Lines 5-10: Add `data-action` attributes to filter buttons
   - Line 22: Add `data-action`, `data-msg`, `data-type` to 申請調閱 button

2. **src/partials/views/morning.html**
   - Line 17: Add `data-action`, `data-msg`, `data-type` to 預覽 PDF button

3. **src/js/data-setters.js** (Optional)
   - Add `filterDocs()` function (similar to `filterIR()`)
   - Add `initDocsFilter()` function

4. **src/app/actions.js** (Optional)
   - Add `'filter-docs'` handler to `actionHandlers` object

### Implementation Pattern Reference

Working example from IR filters (`src/partials/views/ir.html` lines 4-9):
```html
<div class="fbar">
  <button class="fb act" data-action="filter-ir" data-filter="all">全部 (24)</button>
  <button class="fb" data-action="filter-ir" data-filter="wait">待審查 (3)</button>
  <button class="fb" data-action="filter-ir" data-filter="pass">已通過 (18)</button>
  <button class="fb" data-action="filter-ir" data-filter="fail">不合格 (3)</button>
</div>
```

Working example from existing toast buttons (`src/partials/views/docs.html` line 16):
```html
<button class="btn bg btn-sm" 
        data-action="toast-msg" 
        data-msg="正在下載 綜合施工計畫書_Rev.3.pdf" 
        data-type="ts">
  <span class="ic s12"><svg><use href="#ic-dl"/></svg></span> 
  下載
</button>
```

---

## Git Status Comparison

**Current Branch State:**
```
 M .github/workflows/ci.yml
 M package-lock.json
 M package.json
 M src/app/actions.js
 M src/app/bootstrap.js
 M src/js/safety.js
 M src/js/state-controller.js
 M src/partials/icons/sprite.html
 M src/partials/views/dashboard.html
 M src/styles/main.css
?? .hermes/
?? .sisyphus/
?? OPENCODE_TEAM_STANDARD.md
?? docs/
?? scripts/verify-fe201.js
?? scripts/verify-safety-mobile.js
?? src/api/
?? src/app/dashboard-init.js
```

**Key Finding:** `src/partials/views/docs.html` and `src/partials/views/morning.html` are **NOT modified** (no 'M' flag). This confirms the required handlers are missing from the current codebase.

**No uncommitted changes** are present in the target files. The verification was performed against the committed codebase state.

---

## Risk Notes

1. **Toast System Works:** The toast notification system (`toast()` function in `src/js/modals.js`) is fully functional. Once buttons have proper `data-action` attributes, toasts will display correctly.

2. **Filter Architecture Exists:** The IR filter implementation provides a complete reference pattern for implementing document filters.

3. **No Backend Dependencies:** All requirements are frontend-only and can be implemented with static HTML/JS changes.

4. **Low Implementation Risk:** Changes required are straightforward attribute additions, no complex logic needed.

---

## Recommendation

**Priority: MEDIUM**

Implement the missing `data-action` attributes in:
1. `src/partials/views/docs.html` (filter buttons + 申請調閱)
2. `src/partials/views/morning.html` (預覽 PDF)

Estimated effort: 15-30 minutes

Re-run this QA verification after implementation to confirm all requirements pass.

---

## Appendix: Raw Verification Output

```json
{
  "timestamp": "2026-04-14T02:46:23.996Z",
  "environment": {
    "baseUrl": "http://localhost:4176",
    "viewport": "1280x800"
  },
  "summary": {
    "passed": 2,
    "failed": 0,
    "blocked": 3
  },
  "codeChangesRequired": true
}
```

---

*Report generated by automated QA verification system*
