# PM Mainline Focus — Ta Chen PMIS

> **Version:** 2026-04-14  
> **Workspace:** `/home/beer8/team-workspace/UI-UX`  
> **Commit:** `5532c68dcb0ab18a375f600cb7d68409d95354f6`

---

## Project Mainline Declaration

**Current Focus:** UI/UX and Database first

The project mainline is now concentrated on two critical paths:
1. **UI/UX Execution** — Wave 1 dashboard, billing, and safety polish
2. **Database Foundation** — Schema validation and core table designs

---

## Top 5 UI/UX Execution Priorities

*Source: docs/uiux-task-board.md (Wave 1 P0 Tasks)*

| Rank | Task ID | Task Name | Priority |
|------|---------|-----------|----------|
| 1 | W1-001 | Dashboard Empty State 設計 | P0 |
| 2 | W1-002 | Dashboard Loading State | P0 |
| 3 | W1-003 | Dashboard Error State | P0 |
| 4 | W1-004 | Billing Empty State | P0 |
| 5 | W1-005 | Billing Loading State | P0 |

---

## Top 5 Database Priorities

*Source: docs/implementation-backlog.md (Database Workflow)*

| Rank | Task ID | Task Name | Priority |
|------|---------|-----------|----------|
| 1 | DB-001 | 確認現有 Schema 權限 | P0 |
| 2 | DB-002 | IR/NCR 資料表設計 | P0 |
| 3 | DB-003 | 材料管理資料表設計 | P0 |
| 4 | DB-004 | 晨會/日報資料表設計 | P1 |
| 5 | DB-005 | Audit Log 觸發器 | P1 |

---

## Blockers & Routing Risks

### Critical Risk: Database Role Availability

**Issue:** The Wave 1 execution summary assigns Database tasks (DB-001 ~ DB-003) to a "DBA" role, but no dedicated DBA channel or role is currently defined in the project structure.

**Impact:**
- P0 database tasks may stall without clear ownership
- Backend tasks (BE-001 ~ BE-005) depend on DB schema completion
- Frontend data layer refactoring (FE-003 ~ FE-005) blocked until backend APIs are ready

**Routing Options:**
1. Assign Database tasks to existing Backend developer capacity
2. Clarify if DBA is an external/shared resource with SLA
3. Re-scope Wave 1 to decouple frontend progress from database completion

**Recommendation:** Clarify database task ownership before Sprint 1 planning.

---

*End of document*
