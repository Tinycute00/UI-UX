# QA Master Status Report — UI-UX Shared Repo
## RALPH-LOOP ULW Comprehensive QA Reconciliation

**Report ID:** QA-MASTER-STATUS-RERUN-20260415  
**Date:** 2026-04-15  
**Reporter:** Sisyphus Agent (opencode-go/kimi-k2.5)  
**Workspace:** `/home/beer8/team-workspace/UI-UX`  
**Branch:** `main`  
**HEAD Commit:** `2c185417f104e3eba3da90c08789352f46ce2c6d`  
**Status:** Ahead of origin/main by 3 commits  
**Uncommitted Changes:** 5 modified, 4 untracked (QA artifacts)

---

## Executive Summary

This report reconciles all existing QA artifacts against current codebase state to provide PM with **verified facts only**. All conclusions are classified by evidence strength and source reliability.

| Category | Count | Description |
|----------|-------|-------------|
| ✅ Verified/Trustworthy | 8 | Live HTTP/browser verified, reproducible |
| ⏳ Pending/Rerun Needed | 5 | Insufficient evidence, single-run, or conflicting reports |
| ⚠️ High Risk | 3 | Blocks release or reflects real product gaps |

---

## 1. Verified/Trustworthy ✅

*Items with live HTTP/browser evidence, reproducible commands, and clear source documentation.*

### 1.1 FE-002 Auth Integration — VERIFIED ✅

| Aspect | Evidence | Method | Status |
|--------|----------|--------|--------|
| Login with admin/password123 | CON-01 | Live HTTP curl + browser | ✅ 200 OK |
| Login with testuser/password123 | CON-02 | Live HTTP curl | ✅ 200 OK |
| Login with admin@pmis.local/password123 | CON-03 | Live HTTP curl | ✅ 200 OK |
| Token storage in sessionStorage | SS-01 | Browser devtools | ✅ Verified |
| Auth guard redirects | SS-02 | Browser manual test | ✅ Verified |
| Full flow: login→/me→refresh→logout | CON-04~07 | Live HTTP curl | ✅ All 200 |
| Build passes | — | npm run build | ✅ PASS |
| Lint passes | — | npm run lint | ✅ PASS |

**Source Reports:**
- `QA-LIVE-RERUN-AUTH-20260415.md` — Full auth flow verified
- `QA-AUTH-HAPPY-PATH-RERUN-20260415-REPORT.md` — Three accounts pass
- `FE-002-QA-REPORT.md` — Browser-based verification

**Evidence Taxonomy:**
- CON (Console/HTTP logs): 13 live curl outputs
- SS (Screenshot): Browser sessionStorage verification
- SRC (Source review): auth-adapter.js, login.html, index.html auth guard

**Trust Level:** HIGH — Multiple independent reports, all reproducible with provided commands.

---

### 1.2 FE-004 Valuations Status Contract — VERIFIED ✅

| Scenario | Expected | Actual | Status |
|----------|----------|--------|--------|
| status=pending (alias) | 200 | 200 | ✅ PASS |
| status=submitted (alias) | 200 | 200 | ✅ PASS |
| status=pending_review (canonical) | 200 | 200 | ✅ PASS |
| status=garbage (invalid) | 400 | 400 | ✅ PASS |
| No status param | 200 | 200 | ✅ PASS |

**Key Findings:**
- Backend alias mechanism correctly maps `pending`/`submitted` → `pending_review`
- Frontend adapter correctly passes status through (no hardcoded values)
- Commit `916c0b1` successfully resolved previous BLOCKER status

**Source Report:** `QA-FE004-VALUATIONS-STATUS-VERIFICATION-20260415.md`

**Evidence Taxonomy:**
- CON: 5 live curl commands with HTTP status and response bodies
- SRC: valuations.ts backend code, valuation-adapter.js frontend code

**Trust Level:** HIGH — All 5 scenarios verified with exact curl commands provided.

---

### 1.3 FE-005 Safety Inspections POST — VERIFIED ✅

| Aspect | Evidence | Status |
|--------|----------|--------|
| POST /api/v1/safety-inspections | 201 Created | ✅ PASS |
| Valid payload accepted | Returns persisted inspection | ✅ PASS |
| Required field validation | 400 with fieldErrors | ✅ PASS |
| Auth protection | 401 without token | ✅ PASS |

**Source Report:** `QA-BE-API-GAP-RECONCILE-20260415.md`

**Evidence Taxonomy:**
- CON: Live HTTP with request/response payloads
- SRC: safety.js frontend validation logic

**Trust Level:** HIGH — Live HTTP verified.

**⚠️ Important Note:** Endpoint is **in-memory only** — created records do not persist across server restarts. This is documented as a known limitation, not a bug.

---

### 1.4 Backend API Contract (Partial) — VERIFIED ✅

| Endpoint | Status | Evidence |
|----------|--------|----------|
| GET /api/v1/projects/:id/progress | 200 OK | CON verified |
| GET /api/v1/valuations | 200 OK | CON verified |
| POST /api/v1/safety-inspections | 201 Created | CON verified |
| POST /api/v1/auth/login | 200 OK | CON verified |
| GET /api/v1/auth/me | 200 OK | CON verified |
| POST /api/v1/auth/refresh | 200 OK | CON verified |
| POST /api/v1/auth/logout | 200 OK | CON verified |

**Trust Level:** HIGH — All verified via live HTTP.

---

## 2. Pending/Rerun Needed ⏳

*Items requiring additional verification, conflicting reports, or source-only conclusions without live evidence.*

### 2.1 FE-003 Dashboard — BLOCKED (Backend Contract Gap) ⏳

**Current State:**
- `GET /api/v1/projects/101/progress` → **200 OK** ✅ (Verified)
- `GET /api/v1/projects/101/work-items` → **404 NOT_FOUND** ❌
- `GET /api/v1/projects/101/subcontractors` → **404 NOT_FOUND** ❌

**Conflict/Clarification Needed:**
- Report `QA-LIVE-RERUN-FE-003-004-005-20260415.md` marks FE-003 as BLOCKED due to missing endpoints
- Frontend mapping is correct (verified via source review)
- Dashboard initialization depends on all three calls in Promise.all()

**Evidence Gap:**
- No live browser verification of dashboard error state (only reported)
- No confirmation of error message "找不到請求的資料" being displayed

**Rerun Required:**
```bash
# Verify backend endpoints
curl -s http://localhost:3000/api/v1/projects/101/work-items -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:3000/api/v1/projects/101/subcontractors -H "Authorization: Bearer $TOKEN"

# Browser verification: Load dashboard and capture console + screenshot
```

**Trust Level:** MEDIUM — Source mapping verified, but full browser behavior not independently confirmed.

---

### 2.2 Tester Task Board P0 Items — NOT EXECUTED ⏳

**Critical Finding:** The `docs/tester-task-board.md` defines 5 P0 tasks, but **all remain in "Pending" status**.

| Task ID | Description | Status in Board | Evidence Found |
|---------|-------------|-----------------|----------------|
| QA-P0-01 | App shell boots cleanly | Pending | None |
| QA-P0-02 | Dashboard critical path smoke | Pending | None |
| QA-P0-03 | Billing critical path smoke | Pending | None |
| QA-P0-04 | Safety wizard critical path smoke | Pending | None |
| QA-P0-05 | Auth gap verification | Pending | Partial (FE-002 covers some) |

**Issue:** Despite multiple QA reports, the core static prototype verification tasks from the official task board have **not been executed**.

**Rerun Required:**
```bash
# Start dev server
npm run dev

# Execute P0 tests manually or via Playwright
# - Screenshot app shell boot
# - Screen record dashboard drilldowns
# - Screen record billing modal flows
# - Screen record safety wizard steps 1-3
```

**Trust Level:** LOW — No evidence of execution found in any QA artifact.

---

### 2.3 FE-002 Error Message UX Issue — PARTIAL ⏳

**Finding:** Wrong password error shows generic message instead of specific auth error.

| Expected | Actual | Source |
|----------|--------|--------|
| "帳號或密碼錯誤，請重新輸入" | "登入失敗：請求參數錯誤" | `FE-002-QA-REPORT.md` Sec 4.2 |

**Root Cause:** `src/api/client.js` handleHttpError maps all 4xx to generic message, overriding backend's specific `INVALID_CREDENTIALS` message.

**Evidence:** Source review only — no live browser screenshot captured of actual error display.

**Trust Level:** MEDIUM — Source analysis correct, but no visual evidence captured.

---

### 2.4 Auth Unit Test Failures — STALE FIXTURES ⏳

**Finding:** 2 unit tests fail in `auth.repository.test.ts` due to stale test fixtures.

- `findUserByUsername > returns stub user for known username` — Asserts `stub_user` but now returns `admin`
- `findUserByEmail > returns stub user for known email` — Asserts `stub@example.com` but now returns `admin@pmis.local`

**Impact:** None on product — runtime behavior is correct.

**Trust Level:** HIGH — Test output documented, but fix not applied per constraint.

---

### 2.5 Backend Negative Test Coverage — INCOMPLETE ⏳

**Missing Coverage:**
- Malformed projectId validation (beyond `projectId=0`)
- Invalid inspectionDate validation
- Empty items array validation
- Rate limiting on login endpoint

**Trust Level:** N/A — Not claimed as verified.

---

## 3. High Risk ⚠️

*Issues that block release or represent significant product gaps requiring immediate attention.*

### 3.1 FE-003 Dashboard Completion — HIGH RISK ⚠️

**Risk:** Dashboard cannot be marked complete without backend contract fulfillment.

**Missing Endpoints:**
```
GET /api/v1/projects/:id/work-items
GET /api/v1/projects/:id/subcontractors
```

**Impact:** User sees "找不到請求的資料" error when accessing dashboard.

**Who Can Fix:**
- Requires **Backend team** to implement missing endpoints
- **Tiny involvement needed** to prioritize and assign backend work

**Verification Needed:**
- Backend contract specification for work-items response shape
- Backend contract specification for subcontractors response shape
- Integration test confirming Promise.all() behavior when 2/3 calls fail

**Recommended Action:**
```
@Tiny 需要 Backend 實作以下兩個 endpoint 以解除 FE-003 阻塞：
1. GET /api/v1/projects/:id/work-items
   - 預期回傳：{ items: WorkItem[], total: number }
   - WorkItem 需包含：id, title, status, assignee, dueDate

2. GET /api/v1/projects/:id/subcontractors  
   - 預期回傳：{ items: Subcontractor[], total: number }
   - Subcontractor 需包含：id, name, contact, specialty

請提供預計完成時間，或安排 Backend 資源優先處理。
```

---

### 3.2 Safety Inspections Persistence — MEDIUM-HIGH RISK ⚠️

**Risk:** Safety inspections are in-memory only; data lost on server restart.

**Evidence:**
- `QA-BE-API-GAP-RECONCILE-20260415.md` Sec 5.1: "POST /api/v1/safety-inspections is in-memory only"
- Response `inspectionId` advanced from `4`, indicating prior in-memory state

**Impact:** Production deployment would lose all safety inspection records on any deployment or restart.

**Who Can Fix:**
- **Backend team** to implement persistent storage
- Database schema for safety-inspections table
- Migration from stub to Prisma repository

**Verification Needed:**
- Database schema review
- Migration plan from in-memory to persistent
- Data retention policy

**Recommended Action:**
```
@PM @Backend 請安排 safety-inspections 持久化實作：
- 建立 safety_inspections 資料表
- 實作 PrismaSafetyInspectionRepository
- 提供 migration 計畫與時間表

目前雖然功能可用，但不適合 production 部署。
```

---

### 3.3 Static UI QA Gap — HIGH RISK ⚠️

**Risk:** Core static prototype has **never been systematically tested** despite multiple QA reports.

**Evidence:**
- `docs/tester-task-board.md` shows all P0 tasks as "Pending"
- No screenshots or recordings found for dashboard drilldowns
- No screenshots or recordings found for billing modal flows
- No screenshots or recordings found for safety wizard step transitions

**Impact:** Unknown UI/UX issues may exist in the primary user flows.

**Who Can Fix:**
- **QA/Tester team** can execute using existing task board
- Does **NOT** require Tiny — can be completed internally

**Verification Needed:**
- P0-01: Screenshot of app shell boot + console capture
- P0-02: Screen recording of dashboard KPI drilldowns and modals
- P0-03: Screen recording of billing detail modal and "新增估驗" flow
- P0-04: Screen recording of safety wizard steps 1-3 with send/reset

**Recommended Action:**
```
@QA Team 請執行 docs/tester-task-board.md 中的 P0 任務：
1. 使用 npm run dev 啟動 dev server
2. 執行 P0-01 ~ P0-04 的 smoke tests
3. 收集 SS + CON + REC 證據
4. 更新 task board 狀態為 Pass/Fail
```

---

## 4. Evidence Taxonomy Reference

| Code | Type | Description | Reliability |
|------|------|-------------|-------------|
| **CON** | Console/HTTP | Live curl/browser console output | HIGH |
| **SS** | Screenshot | Visual capture of UI state | HIGH |
| **REC** | Recording | Screen recording of interaction flow | HIGH |
| **SRC** | Source Review | Static code analysis | MEDIUM |
| **NET** | Network Capture | HAR/http traffic log | HIGH |
| **RPT** | Report Citation | Referenced from another QA report | MEDIUM |

---

## 5. Tiny Involvement Decision Matrix

| Issue | Needs Tiny? | Reason | Alternative Action |
|-------|-------------|--------|-------------------|
| FE-003 Backend endpoints | ✅ YES | Requires backend resource allocation and prioritization | PM to coordinate with Tiny for backend sprint planning |
| Safety persistence | ✅ YES | Requires database schema design and backend implementation | PM to schedule backend work post-auth stabilization |
| FE-002 Error UX | ❌ NO | Frontend client.js fix only | Frontend dev to update error handler (1-2 hours) |
| P0 Static UI QA | ❌ NO | Task board already defined, needs execution | QA team to execute existing test plan |
| Stale unit tests | ❌ NO | Test fixture updates only | Backend dev to align test data with stub mapping |
| FE-004/005 verification | ❌ NO | Already verified, no issues | Close tickets as PASS |

---

## 6. Source-Only Conclusions (Not Live Verified)

**⚠️ These items appear in reports but lack live verification evidence:**

1. **Dashboard error message "找不到請求的資料"**
   - Reported in `QA-LIVE-RERUN-FE-003-004-005-20260415.md`
   - Evidence type: RPT (report citation) — original source not verified
   - **Risk:** May be based on single observation without screenshot

2. **Frontend mapping correctness for FE-003**
   - Claims: `src/app/dashboard-init.js` calls correct endpoints
   - Evidence type: SRC only — no live browser network trace captured
   - **Risk:** Source is correct but runtime behavior not confirmed

3. **Safety wizard pass/fail state stability**
   - Not mentioned in any live verification report
   - Task board P1-03 pending
   - **Risk:** UI state issues may exist in multi-step interaction

**Recommendation:** Do not report these as "verified" to PM without additional evidence.

---

## 7. PM-Ready Summary

### What Works (Verified) ✅
1. **Auth system fully operational** — All 3 test accounts work, full flow verified
2. **FE-004 Valuations** — Status contract aligned, 5/5 scenarios pass
3. **FE-005 Safety POST** — Endpoint works (but in-memory only)
4. **Build & Lint** — No issues on main branch

### What's Blocked ⚠️
1. **FE-003 Dashboard** — Backend missing 2 endpoints (work-items, subcontractors)
2. **Safety data persistence** — In-memory only, not production-ready

### What Needs Rerun ⏳
1. **Static UI QA** — Task board P0 items never executed
2. **FE-003 browser verification** — Need screenshot of actual error state

### Tiny Requests 🎯
```
@Tiny 需要協助：

1. 【優先】安排 Backend 實作 FE-003 缺少的兩個 endpoint：
   - GET /api/v1/projects/:id/work-items
   - GET /api/v1/projects/:id/subcontractors
   目前 Dashboard 因這兩個 404 無法完成驗收。

2. 【規劃】Safety inspections 持久化時程：
   - 目前 POST 成功但 in-memory only
   - 需要資料表設計與 Prisma repository 實作
   - 建議在 production 部署前完成

其他項目（FE-002 error UX、P0 UI QA、unit test fixes）可由團隊內部處理，
不需要 Tiny 介入。
```

---

## 8. Verification Commands (Reproducible)

```bash
# ===== Setup =====
cd /home/beer8/team-workspace/UI-UX
export TOKEN=$(curl -sf -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))")

# ===== FE-002 Auth =====
curl -s -w "\nHTTP:%{http_code}\n" http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# ===== FE-004 Valuations =====
curl -s -w "\nHTTP:%{http_code}\n" "http://localhost:3000/api/v1/valuations?status=pending" \
  -H "Authorization: Bearer $TOKEN"

# ===== FE-005 Safety =====
curl -s -X POST http://localhost:3000/api/v1/safety-inspections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"projectId":"101","inspectionDate":"2026-04-15","inspectorName":"Test","items":[]}'

# ===== FE-003 Dashboard (Partial) =====
curl -s -w "\nHTTP:%{http_code}\n" http://localhost:3000/api/v1/projects/101/progress \
  -H "Authorization: Bearer $TOKEN"

# These return 404 (BLOCKED):
curl -s -w "\nHTTP:%{http_code}\n" http://localhost:3000/api/v1/projects/101/work-items \
  -H "Authorization: Bearer $TOKEN"
curl -s -w "\nHTTP:%{http_code}\n" http://localhost:3000/api/v1/projects/101/subcontractors \
  -H "Authorization: Bearer $TOKEN"
```

---

## 9. Artifact Inventory

### QA Reports Referenced
| File | Date | Scope | Trust Level |
|------|------|-------|-------------|
| `QA-LIVE-RERUN-AUTH-20260415.md` | 2026-04-15 | Full auth flow | HIGH |
| `QA-AUTH-HAPPY-PATH-RERUN-20260415-REPORT.md` | 2026-04-15 | Auth happy path | HIGH |
| `QA-FE004-VALUATIONS-STATUS-VERIFICATION-20260415.md` | 2026-04-15 | Valuations status | HIGH |
| `QA-LIVE-RERUN-FE-003-004-005-20260415.md` | 2026-04-15 | FE-003/004/005 | MEDIUM |
| `QA-BE-API-GAP-RECONCILE-20260415.md` | 2026-04-15 | Backend API gaps | HIGH |
| `FE-002-QA-REPORT.md` | 2026-04-15 | FE-002 browser | MEDIUM |

### Uncommitted Changes (New Reports)
- `docs/qa/QA-BE-API-GAP-RECONCILE-20260415.md`
- `docs/qa/QA-FE004-VALUATIONS-STATUS-VERIFICATION-20260415.md`
- `docs/qa/QA-LIVE-RERUN-FE-003-004-005-20260415.md`
- `FE-002-QA-REPORT.md`

---

## 10. Rollback / Cleanup

| Action | Status |
|--------|--------|
| No production code modified | ✅ Clean |
| New QA artifact created | `docs/qa/QA-MASTER-STATUS-RERUN-20260415.md` |
| No temporary test data | ✅ Clean |
| No database mutations | ✅ Clean |

---

**Report Generated:** 2026-04-15  
**Next Review:** After FE-003 backend endpoints implemented or P0 UI QA completed
