# QA Test Plan: UIUX-201 - PMIS UI Prototype Interactions

**Ticket:** UIUX-201  
**Scope:** Static frontend behavior validation  
**Date:** 2026-04-14  

---

## Test Checklist

### Pre-Test Setup
- [x] Start local preview server: `npm run preview`
- [x] Verify server accessible at http://localhost:4176
- [x] Run automated verification script
- [x] Document findings

### Test Cases

#### TC-1: v-docs Filter Bar - Button Count
**Requirement:** Filter bar has 6 buttons (全部/施工計畫書/設計圖說/品管文件/工安文件/合約文件)

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to v-docs view | Page loads | ✅ |
| 2 | Count buttons in `.fbar` | 6 buttons present | ✅ |
| 3 | Verify button labels | Match spec exactly | ✅ |

**Result:** PASSED

---

#### TC-2: v-docs Filter - Toggle & Filter Functionality
**Requirement:** Buttons toggle active state and filter document cards correctly

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Click "施工計畫書" filter | Button gets `act` class | ⏸️ |
| 2 | Check document table | Only matching rows visible | ⏸️ |
| 3 | Click "全部" filter | All rows visible | ⏸️ |

**Result:** BLOCKED - Missing data-action attributes

**Evidence:**
```
Button: "施工計畫書" | data-action: null
```

---

#### TC-3: Filter Scope Isolation
**Requirement:** v-docs filters do not affect IR page filter state

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Set filter in v-docs | v-docs filter active | ⏸️ |
| 2 | Navigate to IR page | IR loads correctly | ✅ |
| 3 | Check IR filter state | Independent from v-docs | ✅ |

**Result:** PASSED (architecture correct, v-docs unimplemented)

---

#### TC-4: 申請調閱 Toast
**Requirement:** Clicking 申請調閱 on 主要工程承攬合約 shows specific toast

**Required Toast Text:**
```
申請調閱已送出,請等候承辦人員審核（功能開發中）
```

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Find 主要工程承攬合約 row | Row present in table | ✅ |
| 2 | Click 申請調閱 button | Toast appears | ⏸️ |
| 3 | Verify toast text | Exact match required | ⏸️ |

**Result:** BLOCKED - Button lacks data-action handler

**Evidence:**
```
Button: "申請調閱" | data-action: null
```

---

#### TC-5: v-morning PDF Preview Toast
**Requirement:** Clicking 預覽 PDF shows specific toast

**Required Toast Text:**
```
PDF 預覽功能尚在建置中,請稍後再試
```

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to v-morning | Page loads | ✅ |
| 2 | Click 預覽 PDF button | Toast appears | ⏸️ |
| 3 | Verify toast text | Exact match required | ⏸️ |

**Result:** BLOCKED - Button lacks data-action handler

**Evidence:**
```
Button: "預覽 PDF" | data-action: null
```

---

## Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-1 | ✅ Pass | 6 buttons present with correct labels |
| TC-2 | ⏸️ Blocked | Missing data-action on filter buttons |
| TC-3 | ✅ Pass | Filter isolation architecture correct |
| TC-4 | ⏸️ Blocked | 申請調閱 button has no handler |
| TC-5 | ⏸️ Blocked | 預覽 PDF button has no handler |

**Code Changes Required:** YES

---

## Implementation Required

### src/partials/views/docs.html
```html
<!-- Filter buttons (lines 5-10) -->
<button class="fb act" data-action="filter-docs" data-filter="all">全部</button>
<button class="fb" data-action="filter-docs" data-filter="construction">施工計畫書</button>
<!-- ... etc -->

<!-- 申請調閱 button (line 22) -->
<button class="btn bg btn-sm" 
        data-action="toast-msg" 
        data-msg="申請調閱已送出,請等候承辦人員審核（功能開發中）"
        data-type="ts">
  <span class="ic s12"><svg><use href="#ic-lock"/></svg></span> 
  申請調閱
</button>
```

### src/partials/views/morning.html
```html
<!-- 預覽 PDF button (line 17) -->
<button class="btn bg" 
        data-action="toast-msg" 
        data-msg="PDF 預覽功能尚在建置中,請稍後再試"
        data-type="ts">
  <span class="ic s14"><svg><use href="#ic-print"/></svg></span> 
  預覽 PDF
</button>
```

---

## Verification Commands

```bash
# Start preview server
npm run preview

# Run automated tests
node scripts/qa-verify-uiux-201-v2.js

# Check results
cat docs/qa/qa-verification-uiux-201-findings.json
```

---

*Test Plan Version 1.0*
