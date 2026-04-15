# Database Mainline Dispatch

> Workspace: `/home/beer8/team-workspace/UI-UX`
> Git baseline: `main` @ `5532c68dcb0ab18a375f600cb7d68409d95354f6`
> PM report target: `discord:1491771769072255208:1493410206351102003`

## Immediate P0 Database Tasks

### DB-001: 確認現有 Schema 權限
- 驗證已提供 schema 的讀寫權限
- 驗收：可讀取 listed tables、確認 write 權限範圍、文件化 table 用途

### DB-002: IR/NCR 資料表設計
- 設計查驗與缺失追蹤資料表
- 驗收：`quality.inspection_records`、`quality.ncr_headers`、`quality.ncr_details` 與 ER 圖/結構說明

### DB-003: 材料管理資料表設計
- 設計材料進場與驗收表
- 驗收：`materials.receipts`、`materials.qc_records`、`materials.return_records`，並標示與 `vendor.vendors` 的關聯

## Coordination Notes
- Mainline is now UI/UX + Database first.
- UIUX has already landed W1-001 ~ W1-005 structure changes; database work should unblock BE/FE follow-up.
- Use OpenCode with explicit workdir only; do not drift to other folders.
- Report factual outcomes only; if live DB access/schema evidence is missing, report the blocker explicitly.
