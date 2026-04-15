# QA-201 Docs/Morning Verification

- Baseline requested by Frontend: `621bb63`
- Baseline check: **not found in current git history** (`git log --all --oneline | grep 621bb63` returned no match)
- Verification basis used: current repo HEAD/source + local preview at `http://localhost:4173`
- Working directory: `/home/beer8/team-workspace/UI-UX`

## Scope checked
1. `docs.html` six filter buttons with `data-action="filter-docs"` and expected `data-filter` values
2. Docs filter active state and row filtering scoped to `#v-docs` / `#docs-tbl`
3. IR filter remains isolated to `#ir-tbl`
4. Main project contract `申請調閱` toast exact copy
5. `v-morning` `預覽 PDF` interaction

## Source review findings
- `src/partials/views/docs.html`
  - Six filter buttons present with `data-action="filter-docs"`
  - Filters: `all / plan / design / quality / safety / contract`
  - Contract row button uses `data-action="toast-msg"` and `data-msg="申請調閱申請已送出，請等待管理員審核"`
- `src/partials/views/ir.html`
  - IR filters present with `data-action="filter-ir"`
- `src/partials/views/morning.html`
  - `預覽 PDF` button exists but has no `data-action` binding
- `src/js/data-setters.js`
  - `filterDocs()` targets `#docs-tbl tbody tr`
  - `filterIR()` targets `#ir-tbl tbody tr`
- `src/app/actions.js`
  - `filter-docs` handler imports/dispatch is present
  - `toast-msg` handler is present

## Browser verification results
Preview server: `npm run preview -- --port 4173`

### 1) docs.html filter buttons
PASS
- 6 buttons present
- Active values observed: `all, plan, design, quality, safety, contract`

### 2) docs filter active state / docs-only scope
PASS
- Clicking `#v-docs [data-action="filter-docs"][data-filter="plan"]` set only that button active
- `#docs-tbl` rows changed to `none` / `table-row` as expected
- IR filter buttons remained unchanged when docs filter was used

### 3) IR filter isolation
PASS
- `#v-ir [data-action="filter-ir"]` buttons present
- `#ir-tbl` row visibility changed as expected
- Docs filter state remained unchanged after interacting with IR

### 4) `申請調閱` toast
PASS
- Clicking the contract-row `申請調閱` button produced toast text exactly:
  - `申請調閱申請已送出，請等待管理員審核`

### 5) `v-morning` `預覽 PDF`
BLOCKED / NOT IMPLEMENTED
- Button exists and is clickable
- No toast was produced after clicking
- The button currently has no `data-action` binding, so this is a non-executable placeholder in the current build

## Gate summary
- Verified pass: 4/5
- Blocked/pending: 1/5 (`v-morning` `預覽 PDF` toast)
- Release posture: **partial**

## Unblock condition
- Bind `v-morning` `預覽 PDF` to a real action handler and define the exact toast copy or preview behavior, then rerun the same browser check.

## Evidence notes
- Local preview HTML served successfully from `http://localhost:4173`
- Browser checks were executed against the live preview DOM, not `file://`
