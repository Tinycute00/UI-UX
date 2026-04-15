# Backend Task Board

## Overview

本文件定義工程營造系統後端 API 開發任務清單，基於已完成的 API 合約 (docs/api-contracts-v1.md) 和已驗證的資料庫結構設計。

---

## Database Domain 狀態

### 已驗證可用 Domains

| Domain | Tables |
|--------|--------|
| **project** | projects, progress_measurement_baselines |
| **contract** | contract_headers, contract_items, contract_item_measurement_rules |
| **vendor** | vendors |
| **valuation** | valuation_headers, valuation_details, valuation_period_rollups, valuation_reviews, valuation_summary_lines, valuation_financial_snapshots, daily_quantity_snapshots, quantity_calculation_headers, quantity_calculation_details, price_adjustment_*(8 tables) |
| **finance** | advance_payments, advance_payment_recoveries, advance_payment_status_snapshots, vw_advance_payment_balance |
| **safety** | safety_headers, safety_details, incident_reports, attachments, violation_records, vw_monthly_safety_summary |
| **document** | document_attachments |
| **audit** | audit_logs, import_batches, import_batch_rows |

### 待 Database Role 設計

| Table | 狀態 |
|-------|------|
| **users** | 待 DB role 設計 users/roles table（身份驗證用） |
| **quality.inspection_records** | 待 DB role 設計 |
| **quality.ncr_headers / ncr_details** | 待 DB role 設計 |
| **materials.*** | 待 DB role 設計 |
| **meetings.*** | 待 DB role 設計 |

---

## P0 任務（阻擋發布）

### BE-001: API 基礎架構

**Priority**: P0  
**預估工時**: 3 天（或 5 Story Points）

**說明**: 建立 Fastify/Express TypeScript 後端伺服器基礎架構，包含健康檢查端點、安全中介軟體、環境變數管理，為所有 API 端點提供穩定的基礎設施。

**Acceptance Criteria**:
- [ ] 使用 TypeScript + Fastify 或 Express 建立可運行的 HTTP 伺服器
- [ ] `GET /api/v1/health` 端點回傳 `{"status": "ok", "timestamp": "ISO8601", "version": "1.0.0"}`
- [ ] 整合 CORS 中介軟體，允許設定特定 origin 或 wildcard
- [ ] 整合 Helmet 中介軟體提供基本安全標頭（X-Frame-Options, CSP, HSTS 等）
- [ ] Request logging 記錄每個請求的 method, path, status_code, response_time, request_id
- [ ] 使用 Zod 驗證環境變數（PORT, NODE_ENV, DATABASE_URL, JWT_SECRET 等）
- [ ] 開發模式與正式模式的環境變數分離，.env.example 文件完整

**Dependencies**:
- 後端依賴：無
- DB 依賴：無

**Notes**:
- 優先選用 Fastify 以獲得更好的效能和內建 JSON Schema 驗證
- Request ID 建議使用 `uuid` 或 `nanoid`，並透過 async hooks 在整個請求鏈傳遞
- Logging 建議使用 `pino` 以獲得結構化日誌和更好的效能

---

### BE-002: 身份驗證 API

**Priority**: P0  
**預估工時**: 5 天（或 8 Story Points）

**說明**: 實作完整的 JWT 身份驗證系統，包含登入、登出、Token 輪換和當前使用者資訊查詢，使用 bcrypt 進行密碼雜湊保護使用者憑證。

**Acceptance Criteria**:
- [ ] `POST /api/v1/auth/login`：驗證 username/password，成功時回傳 access_token 並設定 httpOnly refresh_token cookie
- [ ] `POST /api/v1/auth/logout`：清除 httpOnly refresh_token cookie，將該 refresh token 加入黑名單（或標記為已撤銷）
- [ ] `POST /api/v1/auth/refresh`：使用有效的 refresh token 產生新的 access_token 和 refresh_token（Token 輪換機制）
- [ ] `GET /api/v1/auth/me`：回傳當前已驗證使用者的基本資訊（id, username, role, permissions）
- [ ] JWT middleware 保護受權路由，未提供有效 token 時回傳 401 Unauthorized
- [ ] 使用 bcrypt (cost factor ≥ 10) 進行密碼雜湊，絕不儲存明文密碼
- [ ] Token 過期時間：access_token 15-30 分鐘，refresh_token 7-30 天（可設定）
- [ ] Login 失敗 5 次後暫時鎖定帳號 15 分鐘（防暴力破解）

**Dependencies**:
- 後端依賴：BE-001（API 基礎架構）
- DB 依賴：待 DB role 設計：users table、roles table、refresh_tokens table（或等價設計）

**Notes**:
- Refresh Token 輪換是安全性最佳實踐，每次使用 refresh token 時應產生新的 token pair
- httpOnly cookie 可防止 XSS 攻擊竊取 refresh token
- 建議在 database 層面儲存 token 發行時間和撤銷狀態

---

### BE-003: Dashboard API

**Priority**: P0  
**預估工時**: 4 天（或 6 Story Points）

**說明**: 提供 Dashboard 頁面所需的關鍵資料 API，包含專案進度、工作項目清單和協力廠商資訊，整合 project、contract、vendor 等核心業務資料表。

**Acceptance Criteria**:
- [ ] `GET /api/v1/projects/:id/progress`：回傳專案基本資訊 + 進度測量基準（project.projects + progress_measurement_baselines）
- [ ] `GET /api/v1/projects/:id/work-items`：回傳合約工作項目清單（contract.contract_headers + contract_items），支援分頁
- [ ] `GET /api/v1/projects/:id/subcontractors`：回傳該專案的協力廠商清單（vendor.vendors + contract.contract_headers），含廠商基本資料和合約金額
- [ ] 所有端點驗證 project_id 存在，不存在時回傳 404 Not Found
- [ ] 回傳資料包含適當的關聯資料（如 work-items 包含所屬合約資訊）
- [ ] 實作適當的資料庫查詢最佳化（使用 JOIN 減少 N+1 查詢）

**Dependencies**:
- 後端依賴：BE-001（API 基礎架構）、BE-002（身份驗證 API）
- DB 依賴：project.projects、project.progress_measurement_baselines、contract.contract_headers、contract.contract_items、vendor.vendors

**Notes**:
- Dashboard API 通常會被頻繁呼叫，建議實作 Redis 快取（TTL 5-10 分鐘）
- 注意權限控制：使用者只能看到其有權限的專案資料
- work-items 可能需要支援篩選（依合約、依項目類型等）

---

### BE-004: Valuation/Billing API

**Priority**: P0  
**預估工時**: 6 天（或 10 Story Points）

**說明**: 實作估驗計價相關 API，包含估驗單列表與明細、預付款查詢、物價調整查詢，是財務結算的核心功能。

**Acceptance Criteria**:
- [ ] `GET /api/v1/projects/:id/valuations`：回傳估驗單列表（valuation.valuation_headers），支援分頁（page, limit）、排序（created_at, period_start）、篩選（status, period）
- [ ] `GET /api/v1/valuations/:id`：回傳單一估驗單完整明細（valuation.valuation_details + 相關關聯資料）
- [ ] `GET /api/v1/projects/:id/advance-payments`：回傳專案預付款資訊（finance.advance_payments + vw_advance_payment_balance）
- [ ] `GET /api/v1/projects/:id/price-adjustments`：回傳物價調整相關資料（valuation.price_adjustment_* 8 tables）
- [ ] 估驗單列表回傳包含彙總資訊：總金額、狀態、期間、建立日期
- [ ] 實作複雜查詢的最佳化（估驗單明細通常涉及多表 JOIN）
- [ ] 支援權限檢查：只有專案相關人員可查詢該專案估驗資料

**Dependencies**:
- 後端依賴：BE-001（API 基礎架構）、BE-002（身份驗證 API）
- DB 依賴：valuation.valuation_headers、valuation.valuation_details、valuation.valuation_period_rollups、valuation.valuation_reviews、valuation.valuation_summary_lines、valuation.valuation_financial_snapshots、valuation.daily_quantity_snapshots、valuation.quantity_calculation_headers、valuation.quantity_calculation_details、valuation.price_adjustment_*、finance.advance_payments、finance.vw_advance_payment_balance

**Notes**:
- Valuation 資料涉及財務敏感性，必須實作完整的稽核記錄
- 複雜的數據計算（如物價調整係數）建議在資料庫層面使用 view 或 stored procedure
- 大量資料分頁時注意效能，考慮使用 cursor-based pagination 對於超大量資料

---

### BE-005: Safety Inspection API

**Priority**: P0  
**預估工時**: 7 天（或 12 Story Points）

**說明**: 實作完整的安全巡檢系統 API，包含巡檢單 CRUD、附件上傳、月報彙總，涵蓋工地安全管理的核心流程。

**Acceptance Criteria**:
- [ ] `POST /api/v1/safety-inspections`：建立新巡檢記錄（寫入 safety.safety_headers + safety_details），包含檢查項目、檢查結果、備註
- [ ] `GET /api/v1/safety-inspections`：巡檢列表，支援篩選（date_range, project_id, inspector_id, status）、分頁、排序
- [ ] `GET /api/v1/safety-inspections/:id`：單一巡檢記錄詳情，包含所有明細項目和附件
- [ ] `PATCH /api/v1/safety-inspections/:id`：更新巡檢記錄（可更新檢查結果、狀態），支援部分更新
- [ ] `POST /api/v1/safety-inspections/:id/submit`：提交巡檢記錄（狀態變更為 submitted，觸發通知）
- [ ] `POST /api/v1/safety-inspections/:id/attachments`：上傳附件（寫入 safety.attachments），支援多檔案、檔案類型驗證
- [ ] `GET /api/v1/safety-inspections/summary`：月報彙總（查詢 safety.vw_monthly_safety_summary），支援月份篩選
- [ ] 附件上傳限制：單檔最大 10MB，支援圖片（JPG/PNG）、PDF、Office 文件
- [ ] 實作檔案儲存抽象層（本地或 S3 可設定）

**Dependencies**:
- 後端依賴：BE-001（API 基礎架構）、BE-002（身份驗證 API）、BE-007（建議：文件上傳功能優先完成）
- DB 依賴：safety.safety_headers、safety.safety_details、safety.attachments、safety.incident_reports、safety.vw_monthly_safety_summary

**Notes**:
- 安全巡檢記錄具有法律效力，必須確保資料完整性（使用稽核記錄追蹤所有變更）
- 圖片附件建議自動產生縮圖以加速列表載入
- 月報彙總查詢可能涉及大量資料，建議使用 materialized view 或快取
- 考慮實作離線支援：允許先儲存草稿，網路恢復後同步

---

## P1 任務（必要功能）

### BE-006: Audit Log Middleware

**Priority**: P1  
**預估工時**: 4 天（或 6 Story Points）

**說明**: 實作應用層級的稽核記錄中介軟體，自動記錄所有資料變更操作，提供完整的操作追蹤和資料變更歷史，滿足合規和除錯需求。

**Acceptance Criteria**:
- [ ] Application-level audit middleware 攔截所有 POST/PATCH/DELETE 請求
- [ ] 自動寫入 audit.audit_logs 資料表，記錄欄位：actor_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent, request_id, created_at
- [ ] old_value 和 new_value 以 JSON 格式儲存資料變更前後的完整狀態
- [ ] 批次匯入操作（import_batches）支援追蹤：記錄批次 ID、匯入檔案名稱、成功/失敗筆數
- [ ] 提供 `GET /api/v1/audit-logs` API 查詢稽核記錄（限管理員），支援 resource_type、resource_id、date_range、actor_id 篩選
- [ ] 稽核記錄不可被修改或刪除（資料庫層級限制或軟刪除標記）
- [ ] 稽核記錄保留政策：自動封存超過 1 年的記錄（可設定）
- [ ] 中介軟體效能影響最小化（使用異步寫入、批次寫入）

**Dependencies**:
- 後端依賴：BE-001（API 基礎架構）、BE-002（身份驗證 API）
- DB 依賴：audit.audit_logs、audit.import_batches、audit.import_batch_rows

**Notes**:
- 稽核記錄必須防篡改，建議使用 append-only 資料表或只讀 replica
- 考慮使用 message queue（如 Redis/RabbitMQ）異步處理稽核記錄寫入，避免影響 API 回應時間
- 敏感欄位（如密碼、個資）應在記錄前遮罩或排除
- 批次匯入的稽核記錄應包含每一筆資料的處理結果（寫入 import_batch_rows）

---

### BE-007: Document Upload API

**Priority**: P1  
**預估工時**: 5 天（或 8 Story Points）

**說明**: 實作通用文件管理 API，支援文件記錄建立、檔案上傳（multipart）、檔案下載，整合多種儲存後端（本地檔案系統或 S3），為系統各模組提供統一的文件管理功能。

**Acceptance Criteria**:
- [ ] `POST /api/v1/documents`：建立文件記錄（寫入 document.document_attachments），包含 metadata：filename, original_name, mime_type, size, storage_type, storage_path, uploaded_by, related_entity_type, related_entity_id
- [ ] `POST /api/v1/documents/:id/upload`：上傳檔案（multipart/form-data），支援單檔最大 50MB
- [ ] `GET /api/v1/documents/:id`：取得文件 metadata
- [ ] `GET /api/v1/documents/:id/download`：下載檔案，回傳正確的 Content-Type 和 Content-Disposition 標頭
- [ ] `DELETE /api/v1/documents/:id`：刪除文件記錄和實際檔案（軟刪除或標記刪除）
- [ ] 支援檔案類型驗證：PDF、Word/Excel/PowerPoint、JPG/PNG/GIF、AutoCAD（.dwg, .dxf）
- [ ] 支援多種儲存後端：本地檔案系統（開發環境）、AWS S3 / MinIO（正式環境），透過環境變數設定
- [ ] 檔案上傳時計算並儲存 SHA-256 checksum，確保檔案完整性
- [ ] 提供檔案預覽 URL 產生（限時簽名 URL for S3）
- [ ] 實作檔案掃毒整合點（預留介面，可整合 ClamAV 等）

**Dependencies**:
- 後端依賴：BE-001（API 基礎架構）、BE-002（身份驗證 API）
- DB 依賴：document.document_attachments

**Notes**:
- 檔案儲存建議使用 UUID 作為檔案名稱，避免檔名衝突和資安問題
- 大檔案上傳考慮支援 resumable upload（分片上傳）以提升使用者體驗
- S3 整合時注意 IAM 權限設定，使用預簽名 URL 而非直接暴露 bucket
- 定期清理孤兒檔案（資料庫記錄已刪除但儲存空間仍存在）

---

## 任務依賴關係圖

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BE-001: API 基礎架構                        │
│                            (Foundation Layer)                        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  BE-002:      │       │  BE-006:      │       │  BE-007:      │
│  身份驗證 API  │◄─────►│  Audit Log    │       │  Document     │
│               │       │  Middleware   │       │  Upload API   │
└───────┬───────┘       └───────────────┘       └───────┬───────┘
        │                                               │
        │         ┌─────────────────────────────────────┘
        │         │
        ▼         ▼
┌─────────────────────────────────┐
│        BE-003: Dashboard API     │
│     (依賴 BE-002, BE-001)        │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│     BE-004: Valuation/Billing   │
│            API                   │
│     (依賴 BE-002, BE-001)        │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│   BE-005: Safety Inspection API  │
│   (依賴 BE-002, BE-001, BE-007)  │
└─────────────────────────────────┘
```

### 依賴關係說明

**層級結構：**

1. **Foundation Layer**（基礎層）
   - BE-001：所有任務的基礎依賴

2. **Core Services Layer**（核心服務層）
   - BE-002：身份驗證，被 Dashboard、Valuation、Safety 依賴
   - BE-006：Audit Log，可被所有修改操作依賴（建議在 BE-001 完成後平行開發）
   - BE-007：文件上傳，被 Safety Inspection 依賴

3. **Business Logic Layer**（業務邏輯層）
   - BE-003：Dashboard API（專案進度、工作項目、協力廠商）
   - BE-004：Valuation/Billing API（估驗計價、預付款、物價調整）
   - BE-005：Safety Inspection API（安全巡檢，最重依賴）

### 建議開發順序

```
Phase 1（基礎建設）:
  BE-001 → BE-002（平行開發 BE-006, BE-007）

Phase 2（核心功能）:
  BE-003 → BE-004 → BE-005
```

### 關鍵路徑（Critical Path）

```
BE-001 → BE-002 → BE-003 → BE-004 → BE-005
```

總預估工時（P0）：**25 天**  
總預估工時（P0 + P1）：**34 天**

---

## 資料庫依賴摘要

### 已確認可用 Tables

| 任務 | 使用的 Tables |
|------|--------------|
| BE-002 | 待 DB role 設計：users, roles, refresh_tokens |
| BE-003 | project.projects, project.progress_measurement_baselines, contract.contract_headers, contract.contract_items, vendor.vendors |
| BE-004 | valuation.valuation_headers, valuation.valuation_details, valuation.valuation_period_rollups, valuation.valuation_reviews, valuation.valuation_summary_lines, valuation.valuation_financial_snapshots, valuation.daily_quantity_snapshots, valuation.quantity_calculation_headers, valuation.quantity_calculation_details, valuation.price_adjustment_*, finance.advance_payments, finance.vw_advance_payment_balance |
| BE-005 | safety.safety_headers, safety.safety_details, safety.attachments, safety.incident_reports, safety.vw_monthly_safety_summary |
| BE-006 | audit.audit_logs, audit.import_batches, audit.import_batch_rows |
| BE-007 | document.document_attachments |

### 待設計 Tables

- `users` / `roles`：身份驗證系統核心
- `quality.inspection_records`：品質管理模組
- `quality.ncr_headers / ncr_details`：不合格報告
- `materials.*`：材料管理模組
- `meetings.*`：會議管理模組

---

## 附錄

### API 端點總覽

| Method | Endpoint | 任務 | 說明 |
|--------|----------|------|------|
| GET | /api/v1/health | BE-001 | 健康檢查 |
| POST | /api/v1/auth/login | BE-002 | 使用者登入 |
| POST | /api/v1/auth/logout | BE-002 | 使用者登出 |
| POST | /api/v1/auth/refresh | BE-002 | Token 輪換 |
| GET | /api/v1/auth/me | BE-002 | 取得當前使用者 |
| GET | /api/v1/projects/:id/progress | BE-003 | 專案進度 |
| GET | /api/v1/projects/:id/work-items | BE-003 | 工作項目清單 |
| GET | /api/v1/projects/:id/subcontractors | BE-003 | 協力廠商清單 |
| GET | /api/v1/projects/:id/valuations | BE-004 | 估驗單列表 |
| GET | /api/v1/valuations/:id | BE-004 | 估驗單明細 |
| GET | /api/v1/projects/:id/advance-payments | BE-004 | 預付款查詢 |
| GET | /api/v1/projects/:id/price-adjustments | BE-004 | 物價調整查詢 |
| POST | /api/v1/safety-inspections | BE-005 | 建立巡檢 |
| GET | /api/v1/safety-inspections | BE-005 | 巡檢列表 |
| GET | /api/v1/safety-inspections/:id | BE-005 | 巡檢明細 |
| PATCH | /api/v1/safety-inspections/:id | BE-005 | 更新巡檢 |
| POST | /api/v1/safety-inspections/:id/attachments | BE-005 | 上傳巡檢附件 |
| GET | /api/v1/safety-inspections/summary | BE-005 | 安全月報 |
| GET | /api/v1/audit-logs | BE-006 | 稽核記錄查詢 |
| POST | /api/v1/documents | BE-007 | 建立文件記錄 |
| POST | /api/v1/documents/:id/upload | BE-007 | 上傳檔案 |
| GET | /api/v1/documents/:id | BE-007 | 取得文件 metadata |
| GET | /api/v1/documents/:id/download | BE-007 | 下載檔案 |
| DELETE | /api/v1/documents/:id | BE-007 | 刪除文件 |

### Story Points 統計

| 優先級 | 任務數 | 總 Story Points |
|--------|--------|----------------|
| P0 | 5 | 41 |
| P1 | 2 | 14 |
| **總計** | **7** | **55** |

---

*文件版本：v1.0*  
*最後更新：2025-04-14*  
*對應 API 合約：docs/api-contracts-v1.md*
