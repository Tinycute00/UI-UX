# QA Verification Report — FE-004 Valuations Status Contract Alignment

| Field | Value |
|---|---|
| **Verification ID** | QA-FE004-VALUATIONS-STATUS-RERUN-20260415 |
| **Date** | 2026-04-15 |
| **Scope** | Re-verify valuations API `status` parameter behavior after commit `916c0b1` |
| **Related Commit** | `916c0b1` — fix(valuations): align status enum to contract; add pending/submitted aliases |
| **Backend Claim** | GET /valuations with `status=pending`, `submitted`, `pending_review` → 200; `status=garbage` → 400; no status → 200 |
| **Previous Blocker** | QA-LIVE-RERUN-FE-003-004-005-20260415 reported FE-004 BLOCKED: `status=pending` returned 400 |

---

## 1. Five-Scenario Live Verification

All tests executed against `http://localhost:3000/api/v1/valuations` with Bearer authentication.

| # | Scenario | Expected | Actual HTTP | Actual Body | Result |
|---|---|---|---|---|---|
| 1 | `?status=pending` | 200 (alias → pending_review) | **200** | 1 item: valuationId=2, `status:"pending_review"` | ✅ PASS |
| 2 | `?status=submitted` | 200 (alias → pending_review) | **200** | 1 item: valuationId=2, `status:"pending_review"` | ✅ PASS |
| 3 | `?status=pending_review` | 200 (canonical) | **200** | 1 item: valuationId=2, `status:"pending_review"` | ✅ PASS |
| 4 | `?status=garbage` | 400 (invalid) | **400** | `{"error":{"code":"BAD_REQUEST","message":"查詢參數格式錯誤","details":{"status":["Invalid status \"garbage\". Accepted: draft, pending_review, approved, rejected, paid (aliases: pending, submitted)"]}}}` | ✅ PASS |
| 5 | No status param | 200 (all items) | **200** | 3 items: approved, pending_review, draft | ✅ PASS |

**Verdict: All 5 scenarios match Backend's claim. FE-004 status contract is now aligned.**

---

## 2. Canonical Status Enum — Full Verification

| Status Value | Expected | Actual HTTP | Items Returned | Result |
|---|---|---|---|---|
| `draft` | 200 | **200** | 1 (valuationId=3) | ✅ |
| `approved` | 200 | **200** | 1 (valuationId=1) | ✅ |
| `rejected` | 200 | **200** | 0 (empty list, no stub data) | ✅ |
| `paid` | 200 | **200** | 0 (empty list, no stub data) | ✅ |

---

## 3. Edge Cases Observed (Not in Original 5 Scenarios)

| Edge Case | Result | Notes |
|---|---|---|
| `status=PENDING` (uppercase) | **400** | Case-sensitive validation. `STATUS_ALIAS` only maps lowercase `pending`. **Low risk** — FE uses lowercase. |
| `status=pending ` (trailing space) | **400** | Strict string comparison, no trimming. **Low risk** — browser query strings don't add spaces. |

---

## 4. Code-Level Contract Alignment

### 4.1 Backend: `valuations.ts`

| Artifact | Code | Contract Match |
|---|---|---|
| Canonical enum | `CANONICAL_STATUSES = ['draft', 'pending_review', 'approved', 'rejected', 'paid']` | ✅ Matches `api-contracts-v1.md` line 500/530 |
| Alias: pending | `pending → 'pending_review'` | ✅ Documented alias, resolves correctly |
| Alias: submitted | `submitted → 'pending_review'` | ✅ Documented alias, resolves correctly |
| Stub data id=2 | `status: 'pending_review'` (was `'submitted'`) | ✅ Aligned to canonical |
| Zod validation | `.refine(v => v === undefined \|\| resolveStatus(v) !== null)` | ✅ Accepts alias + canonical, rejects garbage |
| resolveStatus() | Maps alias → canonical, returns null for invalid | ✅ Correct logic |

### 4.2 Frontend: `valuation-adapter.js`

| Artifact | Code | Risk |
|---|---|---|
| Status param | Pass-through — `if (status) { params.status = status; }` | ✅ No hardcoded status values |
| Current callers | No UI view currently invokes `getValuations` with live API calls | ✅ No FE regression risk |

### 4.3 Other Frontend Status References

| File | Status Values | Domain | Conflict with Canonical? |
|---|---|---|---|
| `src/data/quality.js` (IR data) | `pending`, `pending_re` | IR inspection levels | ❌ No conflict — different domain (quality, not valuations) |
| `src/js/data-setters.js` (IR display) | `pending → "待審"`, `pending_re → "待複驗"` | IR/NCR display labels | ❌ No conflict |

---

## 5. Previously Reported Blocker Resolution

| Item | Previous State | Current State |
|---|---|---|
| `GET /valuations?status=pending` | **400 BAD_REQUEST** (QA-LIVE-RERUN-FE-003-004-005) | **200 OK** — alias resolves correctly |
| FE-004 status | **BLOCKED** | **UNBLOCKED** |

---

## 6. Pre-existing Issues (NOT Part of This Fix)

| Issue | Details | Severity |
|---|---|---|
| **Param name mismatch: `pageSize` vs `limit`** | Frontend `valuation-adapter.js` sends `pageSize` but backend Zod schema expects `limit`. Backend silently ignores unknown `pageSize` and defaults to `limit=20`. | Low (functional but paginated queries won't work as FE intends) |
| **No `projectId` filter in FE** | Backend supports `projectId` filter; FE adapter doesn't pass it | Low (not yet needed by FE views) |

---

## 7. Final QA Conclusion

### Overall Verdict: **✅ PASS — Unblocked**

The commitment `916c0b1` correctly resolves the FE-004 contract mismatch. All five required scenarios now produce the expected results, matching Backend's claim exactly.

### Verification Summary

| Dimension | Status |
|---|---|
| 5 required scenarios | ✅ All PASS |
| Canonical enum vs contract | ✅ Aligned |
| Alias mechanism | ✅ Working (pending, submitted → pending_review) |
| Invalid input rejection | ✅ Working (garbage → 400 with clear message) |
| Stub data alignment | ✅ valuationId=2 uses `pending_review` |
| Frontend regression risk | ✅ None — no hardcoded status in FE valuations code |
| Previous blocker resolved | ✅ `status=pending` no longer returns 400 |

### Risk Summary

| Risk | Level | Description |
|---|---|---|
| Case sensitivity | Low | Uppercase aliases (`PENDING`) not supported; FE uses lowercase so no impact |
| `pageSize` vs `limit` | Low | Pre-existing param name mismatch; pagination defaults to 20, no data loss |
| Future FE integration | Note | When FE-004 builds valuation list views, should use canonical `pending_review` in UI, not alias strings |

### Recommendation to Backend

**可以關閉** — FE-004 valuations status contract mismatch 已確認修復，所有五項情境驗證通過，前端無回歸風險。

### Suggested Follow-up (Not Blocking)

1. **FE adapter param fix**: Change `valuation-adapter.js` `pageSize` → `limit` to match backend schema (pre-existing, not urgent)
2. **Case-insensitive alias** (optional): Consider normalizing `status` to lowercase in `resolveStatus()` to handle edge cases
3. **Integration test**: Add automated test for `GET /valuations?status=pending` to prevent regression

---

## 8. Verification Commands (Reproducible)

```bash
# Acquire token
TOKEN=$(curl -sf -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))")

# Scenario 1: status=pending (alias)
curl -s -w "\nHTTP:%{http_code}" "http://localhost:3000/api/v1/valuations?status=pending" \
  -H "Authorization: Bearer $TOKEN"

# Scenario 2: status=submitted (alias)
curl -s -w "\nHTTP:%{http_code}" "http://localhost:3000/api/v1/valuations?status=submitted" \
  -H "Authorization: Bearer $TOKEN"

# Scenario 3: status=pending_review (canonical)
curl -s -w "\nHTTP:%{http_code}" "http://localhost:3000/api/v1/valuations?status=pending_review" \
  -H "Authorization: Bearer $TOKEN"

# Scenario 4: status=garbage (invalid)
curl -s -w "\nHTTP:%{http_code}" "http://localhost:3000/api/v1/valuations?status=garbage" \
  -H "Authorization: Bearer $TOKEN"

# Scenario 5: no status
curl -s -w "\nHTTP:%{http_code}" "http://localhost:3000/api/v1/valuations" \
  -H "Authorization: Bearer $TOKEN"
```

## 9. Rollback / Cleanup

- No production code modified during this verification.
- One QA artifact added: `docs/qa/QA-FE004-VALUATIONS-STATUS-VERIFICATION-20260415.md`
- No state changes, no temporary files, no test data injected.