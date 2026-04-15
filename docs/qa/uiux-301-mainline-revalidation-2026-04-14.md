# QA Revalidation Report: UIUX-301 Mainline Recheck

- **Baseline / branch**: `main` at commit `c3a935e`
- **Verification basis**: local preview build served at `http://localhost:4173/`
- **Preview command**: `npm run preview -- --port 4173`
- **Runtime check method**: Browser console + DOM inspection against the live preview
- **Git comparison**: `HEAD == c3a935e` (no diff between requested baseline and current HEAD)

## Scope verified

### W1-001 Dashboard Empty State — PASS
**Action performed**: `window.showDashState('empty')`

**Observed**
- `#dash-empty` is visible (`display: flex`, `aria-hidden="false"`)
- Title text: `尚無工程資料`
- Description text: `目前沒有可顯示的工程進度資料`
- Button text: `重新載入`

**Notes**
- The icon is rendered as the state icon in the empty block.
- This is a pass for the requested empty-state presentation.

### W1-002 Dashboard Loading State — PASS
**Action performed**: `window.showDashState('loading')`

**Observed**
- `#dash-loading` is visible (`display: block`, `aria-hidden="false"`, `aria-busy="true"`)
- KPI shimmer skeleton count: `5`
- Card skeleton count: `2`
- `#dash-empty` and `#dash-error` are hidden

### W1-003 Dashboard Error State — PASS
**Action performed**: `window.showDashState('error')`

**Observed**
- `#dash-error` is visible (`display: flex`, `aria-hidden="false"`)
- Title text: `資料載入失敗`
- Error message text: `無法連線至伺服器，請稍後再試`
- Retry button text: `重試`

### UIUX-201 v-morning PDF Preview Toast — PASS
**Navigation**: switched to `#v-morning`

**Observed**
- PDF preview button exists with `data-action="toast-msg"`
- Button label: `預覽 PDF`
- `data-msg` value: `PDF 預覽功能尚在建置中，請稍後再試`
- Clicking the button renders a toast with the exact message:
  `PDF 預覽功能尚在建置中，請稍後再試`

## Runtime evidence

- `window.showDashState` exists and is a function
- `window.showBillingState` exists and is a function
- The morning preview button is wired through the current `data-action` path

## File / source verification

Scanned source files directly before runtime checks:
- `src/partials/views/dashboard.html`
- `src/partials/views/morning.html`
- `src/js/state-controller.js`
- `src/app/dashboard-init.js`

Observed source-level facts relevant to this recheck:
- Dashboard empty/loading/error blocks are present in `dashboard.html`
- Morning view contains the `data-action="toast-msg"` preview button with the expected message string
- `showDashState` is exported and attached to `window`

## Result summary

- **Verified items**: 4 / 4
- **Failures**: 0
- **Blockers**: none
- **Regression risk**: low for the scoped states/preview button, since the live runtime and source both match the requested behavior

## Next-step gating conditions

- No gating issue remains for the four scoped UIUX rechecks.
- If this is being used as a release gate, proceed with normal release flow.

## Cleanup note

- Preview server was started locally for validation only.
- No production source files were modified during verification.
