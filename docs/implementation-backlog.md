# Implementation Backlog — Ta Chen PMIS

> 依 workflow 分類的任務清單，每項包含 Task Name、Priority (P0/P1/P2)、Description、Acceptance Criteria、Dependencies

---

## 1. UI/UX Workflow

| Task | Priority | Description | Acceptance Criteria | Dependencies |
|------|----------|-------------|---------------------|--------------|
| UI-001: 設計系統文件化 | P1 | 建立 Design Token 文件（colors, typography, spacing, shadows） | 1. 建立 docs/design-system.md<br>2. 列出所有 CSS variables<br>3. 標註使用場景與範例 | None |
| UI-002: 響應式斷點檢視 | P1 | 檢視並文件化現有 RWD 斷點（mobile <768px, tablet, desktop） | 1. 測試 10 個 view 在 320px/768px/1024px/1440px<br>2. 列出破版問題清單<br>3. 提出修正建議 | None |
| UI-003: 無資料狀態設計 | P1 | 設計並實作 empty state / loading state / error state | 1. 每個 list view 需有「無資料」插圖<br>2. 載入中 skeleton 或 spinner<br>3. API error 時的錯誤提示畫面 | backend-001 |
| UI-004: 無障礙基礎檢視 | P2 | WCAG 2.1 AA 基礎檢視（color contrast, keyboard nav） | 1. 色彩對比度 4.5:1 以上<br>2. 所有互動元件可鍵盤操作<br>3. 表單有正確 label | None |
| UI-005: 列印樣式支援 | P2 | 新增 print media query 供報表列印 | 1. 晨會記錄可列印 A4<br>2. 查驗表可列印<br>3. 隱藏導航與按鈕 | None |
| UI-006: 深色模式支援 | P2 | 設計並實作 dark mode toggle | 1. CSS variables 支援 dark theme<br>2. 切換按鈕在 topbar<br>3. 偏好設定儲存於 localStorage | UI-001 |

---

## 2. Frontend Workflow

| Task | Priority | Description | Acceptance Criteria | Dependencies |
|------|----------|-------------|---------------------|--------------|
| FE-001: API Client 基礎建設 | P0 | 建立 Axios/fetch 封裝，含 error handling、retry、auth header | 1. 建立 src/api/client.js<br>2. 統一錯誤處理（toast 顯示）<br>3. 401 自動 redirect login<br>4. Request/Response interceptor | backend-001 |
| FE-002: 身份驗證整合 | P0 | 整合 JWT login/logout，保護受權頁面 | 1. Login form 呼叫 POST /api/auth/login<br>2. Token 儲存於 httpOnly cookie 或 secure storage<br>3. 未登入自動導向 login page<br>4. 登出清除 token | BE-001, FE-001 |
| FE-003: 資料層重構 - Dashboard | P0 | 將 dashboard mock data 改為 API 呼叫 | 1. 建立 src/api/dashboard.js<br>2. 呼叫 GET /api/projects/:id/progress<br>3. 移除 WORK_DETAILS/SUBCONTRACTOR_DETAILS hardcode<br>4. 載入時顯示 loading | BE-002, FE-001 |
| FE-004: 資料層重構 - Billing | P0 | 將 billing mock data 改為 API 呼叫 | 1. 建立 src/api/billing.js<br>2. 呼叫 GET /api/valuations<br>3. 支援分頁與篩選<br>4. 移除 BILLING_DETAILS hardcode | BE-003, FE-001 |
| FE-005: 資料層重構 - Safety | P0 | 將 safety 表單改為可儲存至後端 | 1. POST /api/safety-inspections<br>2. 儲存步驟 1-3 的填寫內容<br>3. 支援 draft / submit 兩種狀態 | BE-004, FE-001 |
| FE-006: 狀態管理導入 | P1 | 評估並導入輕量狀態管理（Zustand/Vuex/Pinia） | 1. 使用者資訊全局儲存<br>2. 當前專案資訊全局儲存<br>3. Notification 狀態全局儲存<br>4. 移除 prop drilling | FE-002 |
| FE-007: Routing 實作 | P1 | 導入 client-side routing（hash router） | 1. URL hash 對應 view（/#/dashboard）<br>2. Browser back/forward 正常運作<br>3. 可直接 access bookmark URL<br>4. 登入後 redirect 回原頁 | FE-002 |
| FE-008: 表單驗證函式庫 | P1 | 導入表單驗證（Zod + 自定義） | 1. IR/NCR 表單有 validation<br>2. 錯誤訊息中文顯示<br>3. Real-time validation feedback | None |
| FE-009: 檔案上傳元件 | P1 | 建立可複用的 file upload component | 1. 支援 drag & drop<br>2. 顯示上傳進度<br>3. 支援圖片預覽<br>4. 整合至 docs/material 模組 | BE-005 |
| FE-010: 即時通知（WebSocket） | P2 | 建立 WebSocket client 接收即時通知 | 1. 連線 ws://server/notifications<br>2. 新 NCR/通知時 toast 提示<br>3. 斷線自動重連<br>4. 通知中心累積未讀 | BE-006 |
| FE-011: PWA 基礎支援 | P2 | 新增 manifest.json 與 service worker | 1. 可安裝至手機桌面<br>2. 離線時顯示「離線模式」提示<br>3. Cache static assets | None |
| FE-012: 錯誤邊界（Error Boundary） | P2 | 實作全局錯誤捕捉 | 1. Runtime error 不白屏<br>2. 顯示友善錯誤頁面<br>3. 可回報錯誤至後端 | None |
| FE-013: 效能優化 - Lazy Load | P2 | 視圖與元件懶加載 | 1. 非當前 view 的 JS/CSS 延遲載入<br>2. Lighthouse performance > 80 | FE-007 |
| FE-014: TypeScript 導入評估 | P2 | 評估 TS 導入成本與效益 | 1. 產出評估報告<br>2. POC 一個 module<br>3. Migration plan | None |

---

## 3. Database Workflow

| Task | Priority | Description | Acceptance Criteria | Dependencies |
|------|----------|-------------|---------------------|--------------|
| DB-001: 確認現有 Schema 權限 | P0 | 驗證已提供 schema 的讀寫權限 | 1. 可讀取所有 listed tables<br>2. 確認哪些有 write 權限<br>3. 文件化 table 用途 | None |
| DB-002: IR/NCR 資料表設計 | P0 | 設計查驗與缺失追蹤的資料表 | 1. quality.inspection_records（三級查驗）<br>2. quality.ncr_headers（缺失主檔）<br>3. quality.ncr_details（缺失明細）<br>4. ER diagram | None |
| DB-003: 材料管理資料表設計 | P0 | 設計材料進場與驗收表 | 1. materials.receipts（進場單）<br>2. materials.qc_records（驗收記錄）<br>3. materials.return_records（退料）<br>4. FK 至 vendor.vendors | vendor.vendors |
| DB-004: 晨會/日報資料表設計 | P1 | 設計晨會與日報資料表 | 1. meetings.daily_meetings（晨會記錄）<br>2. meetings.daily_reports（施工日報）<br>3. 支援人數統計、天氣記錄 | None |
| DB-005: Audit Log 觸發器 | P1 | 建立自動 audit log 機制 | 1. 關鍵 table 異動自動寫入 audit.audit_logs<br>2. 記錄 who/when/what/old/new value<br>3. Trigger 或 application layer 實作 | audit.* |
| DB-006: Index 優化 | P1 | 分析常用查詢並建立 index | 1. valuation_headers.project_id + period<br>2. safety_headers.inspection_date<br>3. vendors.vendor_code<br>4. 文件化 query plan | None |
| DB-007: 資料歸檔策略 | P2 | 設計歷史資料歸檔機制 | 1. 2 年以上資料自動歸檔<br>2. 歸檔後仍可查詢（readonly）<br>3. 不影響日常查詢效能 | None |
| DB-008: 備份策略文件 | P2 | 制定 DB backup/restore SOP | 1. 每日自動備份<br>2. 保留 30 天版本<br>3. 災難復原測試計畫 | None |

---

## 4. Backend Workflow

| Task | Priority | Description | Acceptance Criteria | Dependencies |
|------|----------|-------------|---------------------|--------------|
| BE-001: API 基礎架構 | P0 | 建立 API server（Node.js/Express 或現有 backend） | 1. Server 可啟動並監聽 port<br>2. Health check endpoint (/health)<br>3. CORS 設定允許 frontend domain<br>4. Request logging (morgan/winston) | None |
| BE-002: 身份驗證 API | P0 | 實作 JWT-based auth endpoints | 1. POST /api/auth/login（回傳 JWT）<br>2. POST /api/auth/logout<br>3. POST /api/auth/refresh<br>4. Middleware 驗證 JWT<br>5. Password hash (bcrypt) | DB-001 |
| BE-003: Dashboard API | P0 | 提供 Dashboard 所需資料 | 1. GET /api/projects/:id/progress（S-curve 資料）<br>2. GET /api/projects/:id/work-items（分項進度）<br>3. GET /api/projects/:id/subcontractors（分包商列表）<br>4. Response 含 metadata（cache 控制） | project.*, contract.*, vendor.* |
| BE-004: Valuation/Billing API | P0 | 提供估驗請款相關 API | 1. GET /api/valuations（列表，支援分頁/篩選）<br>2. GET /api/valuations/:id（明細）<br>3. GET /api/advance-payments（預付款）<br>4. GET /api/price-adjustments（物價調整） | valuation.*, finance.* |
| BE-005: Safety Inspection API | P0 | 提供工安巡檢相關 API | 1. POST /api/safety-inspections（建立巡檢）<br>2. GET /api/safety-inspections/:id（查詢）<br>3. PATCH /api/safety-inspections/:id（更新）<br>4. POST /api/safety-inspections/:id/attachments（上傳附件） | safety.* |
| BE-006: 即時通知服務 | P1 | WebSocket server for push notifications | 1. ws://server/notifications<br>2. 認證連線（JWT in query string）<br>3. 新 NCR 時 broadcast 給相關使用者<br>4. 離線訊息 queue | BE-002 |
| BE-007: IR/NCR API | P1 | 提供查驗與缺失追蹤 API | 1. GET/POST /api/inspections<br>2. GET/POST /api/ncrs<br>3. PATCH /api/ncrs/:id/status（狀態更新）<br>4. POST /api/inspections/:id/sign（電子簽名） | DB-002 |
| BE-008: Material API | P1 | 提供材料管理 API | 1. GET/POST /api/material-receipts<br>2. GET/POST /api/material-qc<br>3. POST /api/material-returns<br>4. 整合 barcode/QR code 查詢 | DB-003 |
| BE-009: Document API | P1 | 提供文件管理 API | 1. GET/POST /api/documents<br>2. POST /api/documents/:id/upload（檔案上傳）<br>3. GET /api/documents/:id/download<br>4. 版本控制（revision history） | document.* |
| BE-010: Meeting/Report API | P1 | 提供晨會與日報 API | 1. GET/POST /api/daily-meetings<br>2. GET/POST /api/daily-reports<br>3. 支援日期區間查詢<br>4. 匯出 PDF/Excel | DB-004 |
| BE-011: Import API | P2 | 提供批次匯入功能 | 1. POST /api/import（CSV/Excel 上傳）<br>2. 驗證資料格式<br>3. 寫入 audit.import_batches<br>4. 錯誤回報機制 | audit.import_batches |
| BE-012: API 文件（OpenAPI） | P2 | 產生 API 規格文件 | 1. Swagger/OpenAPI 3.0 spec<br>2. 每個 endpoint 含 example<br>3. 發布至 docs/api.html | BE-001~BE-011 |
| BE-013: Rate Limiting | P2 | API 速率限制 | 1. 每 IP 100 requests/minute<br>2. 超過回傳 429<br>3. 登入 API 額外限制（10 tries/5min） | BE-001 |
| BE-014: API 版本控制 | P2 | URL versioning strategy | 1. /api/v1/... 結構<br>2. 版本 deprecation policy<br>3. 向後相容性文件 | BE-001 |

---

## 5. Tester Workflow

| Task | Priority | Description | Acceptance Criteria | Dependencies |
|------|----------|-------------|---------------------|--------------|
| QA-001: 測試策略文件 | P1 | 制定測試策略與計畫 | 1. 文件化測試層級（unit/integration/e2e）<br>2. 測試環境規格<br>3. 自動化測試比例目標 | None |
| QA-002: Unit Test 基礎建設 | P1 | 建立 Jest/Vitest 測試環境 | 1. npm test 可執行<br>2. 涵蓋 src/utils/*.js<br>3. CI 自動執行<br>4. Coverage report | None |
| QA-003: API Integration Test | P1 | API 整合測試 | 1. 使用 supertest 或類似工具<br>2. 測試所有 backend endpoints<br>3. Test DB 隔離<br>4. 涵蓋 auth flow | BE-001 |
| QA-004: E2E Test（Critical Path） | P1 | 關鍵路徑 E2E 測試 | 1. 使用 Playwright/Cypress<br>2. Login → Dashboard → Billing 流程<br>3. 建立 NCR 流程<br>4. 每日自動執行 | FE-002, BE-003 |
| QA-005: Visual Regression Test | P2 | 視覺回歸測試 | 1. 使用 Chromatic/Storybook<br>2. 主要畫面截圖比對<br>3. PR 時自動檢查 | None |
| QA-006: 效能測試 | P2 | API 與頁面載入效能測試 | 1. API response time < 500ms (p95)<br>2. First Contentful Paint < 1.5s<br>3. Lighthouse score > 80 | FE-013 |
| QA-007: 安全測試 | P2 | 基礎安全掃描 | 1. npm audit 無 high/critical<br>2. OWASP ZAP 基礎掃描<br>3. SQL injection 測試 | BE-001 |
| QA-008: 行動裝置測試 | P2 | 實機測試計畫 | 1. iOS Safari 測試<br>2. Android Chrome 測試<br>3. 離線模式測試 | FE-011 |
| QA-009: UAT 測試案例 | P1 | 使用者驗收測試案例 | 1. 每個 view 10+ 測試案例<br>2. 測試資料準備<br>3. 驗收簽核流程 | All FE/BE P0/P1 |
| QA-010: 測試資料管理 | P1 | Seed data 與 fixtures | 1. test/fixtures/ 含 mock data<br>2. 可重設測試資料<br>3. 生產資料脫敏規則 | DB-001 |

---

## 6. DevOps Workflow

| Task | Priority | Description | Acceptance Criteria | Dependencies |
|------|----------|-------------|---------------------|--------------|
| OPS-001: 多環境部署 | P0 | 建立 staging/production 環境 | 1. Staging: staging.pmis.tachen.com<br>2. Production: pmis.tachen.com<br>3. 環境變數管理（非 hardcode）<br>4. Feature flag 機制 | None |
| OPS-002: 容器化（Docker） | P1 | Frontend/Backend Docker image | 1. Dockerfile 多 stage build<br>2. nginx.conf 設定<br>3. Image size < 100MB<br>4. 本地 docker-compose 可執行 | None |
| OPS-003: CI/CD Pipeline 強化 | P1 | GitHub Actions workflow 擴充 | 1. PR 自動部署至 preview URL<br>2. Staging 自動部署（main branch）<br>3. Production 手動觸發部署<br>4. Deploy notification（Slack） | OPS-001 |
| OPS-004: 監控與告警 | P1 | Application monitoring | 1. Error tracking（Sentry）<br>2. API 效能監控<br>3. 前端錯誤追蹤<br>4. 告警閾值設定 | BE-001 |
| OPS-005: Log 集中管理 | P1 | 日誌收集與查詢 | 1. Structured logging（JSON）<br>2. 集中收集（ELK/Loki）<br>3. 可查詢 by user/request_id<br>4. 保留 30 天 | BE-001 |
| OPS-006: SSL/TLS 管理 | P1 | HTTPS 憑證自動續期 | 1. Let's Encrypt 自動續期<br>2. HTTP/2 支援<br>3. Security headers（HSTS, CSP） | OPS-001 |
| OPS-007: CDN 配置 | P2 | 靜態資源 CDN | 1. CloudFlare/AWS CloudFront<br>2. Cache 策略（CSS/JS 1 year）<br>3. DDoS 防護 | OPS-001 |
| OPS-008: 備份自動化 | P2 | 資料庫與檔案備份 | 1. 每日 DB 自動備份<br>2. 檔案上傳自動異地備份<br>3. 每月還原測試<br>4. 備份監控與告警 | DB-008 |
| OPS-009: Secrets 管理 | P2 | 敏感資訊管理 | 1. 無 secrets 在 git<br>2. GitHub Secrets 或 HashiCorp Vault<br>3. 定期輪替密鑰<br>4. 存取權限控管 | None |
| OPS-010: 災難復原演練 | P2 | DRP 演練計畫 | 1. 半年一次災難復原演練<br>2. RTO < 4 小時<br>3. RPO < 1 小時<br>4. 演練報告 | OPS-008 |

---

## 優先級說明

| 優先級 | 定義 | 目標完成時間 |
|--------|------|--------------|
| **P0** | 阻擋發布（Blocker）| Sprint 1-2 |
| **P1** | 必要功能（Required）| Sprint 3-6 |
| **P2** | 增強功能（Enhancement）| Sprint 7+ |

---

## Wave 1 執行摘要（P0 項目）

| Workflow | 任務 | 負責角色 |
|----------|------|----------|
| Database | DB-001, DB-002, DB-003 | DBA |
| Backend | BE-001, BE-002, BE-003, BE-004, BE-005 | Backend Dev |
| Frontend | FE-001, FE-002, FE-003, FE-004, FE-005 | Frontend Dev |
| DevOps | OPS-001 | DevOps |
| Tester | QA-001, QA-002 | QA |
| UI/UX | （本期無 P0）| UI/UX |

---

*文件版本: 2026-04-14*  
*下次檢視: Sprint Planning 每兩週*
