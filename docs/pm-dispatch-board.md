# PM Dispatch Board — UI/UX + Database Mainline

> Workspace: `/home/beer8/team-workspace/UI-UX`
> Git baseline: `main` @ `5532c68dcb0ab18a375f600cb7d68409d95354f6`
> PM report target: `discord:1491771769072255208:1493410206351102003`

## Mainline
- Primary track A: UI/UX execution
- Primary track B: Database foundation

## Immediate role routing

### 任務：UI/UX Wave 1 P0 首波落地
- **負責人**：@uiux
- **優先級**：P0
- **描述**：依 `docs/uiux-task-board.md` 先處理 W1-001 ~ W1-005：Dashboard Empty/Loading/Error，以及 Billing Empty/Loading。固定使用 OpenCode workdir `/home/beer8/team-workspace/UI-UX`。
- **驗收標準**：至少完成 1 個 P0 項目的實際落地或提供具體阻塞證據；回報修改檔案、Task ID、驗收結果。
- **狀態**：🟡 進行中

### 任務：Database 主線路由確認
- **負責人**：PM
- **優先級**：P0
- **描述**：資料庫主線需由 dedicated database 角色承接，但目前可見角色/頻道映射存在衝突：`1491771710322511892` 在主 directory 為「資料庫」，在 PM profile 為「測試」，且本機無 `database` profile。
- **驗收標準**：確認 dedicated database 角色與正確頻道後，再派發 DB-001 ~ DB-003。
- **狀態**：⚠️ 阻塞
