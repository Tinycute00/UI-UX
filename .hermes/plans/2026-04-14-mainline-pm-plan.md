# 2026-04-14 Mainline PM Plan — Ta Chen PMIS Frontend

## 1. Executive Summary

本文件為 Ta Chen PMIS 專案的主線計畫，基於實際程式碼庫與已驗證的 PostgreSQL Schema，規劃從「靜態原型」過渡至「可上線的動態應用」的執行路徑。

### 1.1 專案現況快照

| 面向 | 狀態 | 風險等級 |
|------|------|----------|
| 前端框架 | Vite + Vanilla JS，模組化結構完整 | 🟢 低 |
| 資料層 | Hardcoded mock data，無後端串接 | 🔴 高 |
| 身份驗證 | 無 | 🔴 高 |
| 部署流程 | GitHub Actions + GitHub Pages 已就緒 | 🟢 低 |
| 程式品質 | Biome lint/format 已導入 | 🟢 低 |
| DB Schema | 已驗證 8 schema，60+ tables | 🟡 中 |

### 1.2 主線目標（OKR）

**Objective**: 於 Q2 2026 完成 PMIS 核心功能上線，支援單一專案的全生命週期管理。

**Key Results**:
1. KR1: 10 個主要畫面全部串接後端 API，資料即時同步（目前 0/10）
2. KR2: 身份驗證與權限控管上線，支援 3 種角色（管理員/監造/廠商）
3. KR3: 系統穩定性達 99.5% uptime，API response time < 500ms (p95)
4. KR4: 通過 UAT，使用者滿意度 > 4.0/5.0

---

## 2. 已驗證現況（As-Is）

### 2.1 程式碼庫結構

```
✅ 已驗證存在：
├── index.html（含 @include partials 機制）
├── vite.config.js（自訂 htmlPartialsPlugin）
├── biome.json（lint/format 規則）
├── package.json（Vite 5.2.0, Biome 1.9.4）
└── src/
    ├── main.js（入口）
    ├── styles/main.css（單一樣式表）
    ├── app/
    │   ├── bootstrap.js（初始化）
    │   └── actions.js（中央事件分派）
    ├── js/
    │   ├── navigation.js（視圖切換）
    │   ├── modals.js（彈窗/Toast）
    │   ├── safety.js（工安巡檢邏輯）
    │   └── data-setters.js（DOM 資料注入）
    ├── data/（⚠️ 全部為 hardcoded mock）
    │   ├── dashboard.js
    │   ├── quality.js
    │   ├── materials.js
    │   ├── finance.js
    │   ├── meetings.js
    │   └── documents.js
    └── partials/
        ├── views/（10 個畫面，全部靜態）
        ├── shell/（導航殼層）
        ├── mobile/（手機適配）
        └── modals/（彈窗）
```

### 2.2 已驗證資料庫 Schema

| Schema | Tables/Objects | 用途 | 前端對應 |
|--------|----------------|------|----------|
| **project** | projects, progress_measurement_baselines | 專案主檔、進度基線 | dashboard 總體進度 |
| **contract** | contract_headers, contract_items, contract_item_measurement_rules | 合約主檔、項目、計價規則 | dashboard 分項、sub 分包商 |
| **vendor** | vendors | 協力廠商主檔 | sub 分包商管理 |
| **valuation** | valuation_headers, valuation_details, valuation_period_rollups, valuation_reviews, valuation_summary_lines, valuation_financial_snapshots, daily_quantity_snapshots, quantity_calculation_headers/details, price_adjustment_* (8 tables) | 估驗計價、物價調整 | billing 估驗請款 |
| **finance** | advance_payments, advance_payment_recoveries, advance_payment_status_snapshots, vw_advance_payment_balance | 預付款管理 | billing 預付款 |
| **safety** | safety_headers, safety_details, incident_reports, attachments, violation_records, vw_monthly_safety_summary | 工安巡檢、事故通報 | safety 工安巡檢 |
| **document** | document_attachments | 文件附件 | docs 文件管理 |
| **audit** | audit_logs, import_batches, import_batch_rows | 操作記錄、批次匯入 | 全站操作追蹤 |

### 2.3 已實作功能（靜態）

| 畫面 | 功能 | 資料來源 | 狀態 |
|------|------|----------|------|
| Dashboard | 總體進度、S-curve、分項進度、分包商列表 | dashboard.js (mock) | ✅ 靜態完成 |
| Morning | 晨會記錄檢視 | meetings.js (mock) | ✅ 靜態完成 |
| Daily | 施工日報 | （無獨立 data 檔）| ⚠️ 簡易 |
| IR | 三級查驗記錄、篩選、詳情 | quality.js (mock) | ✅ 靜態完成 |
| NCR | 缺失列表、狀態追蹤、詳情 | quality.js (mock) | ✅ 靜態完成 |
| Material | 進場記錄、驗收、退料 | materials.js (mock) | ✅ 靜態完成 |
| Safety | 工安巡檢精靈（步驟 1-3）| safety.js（動態 DOM）| ✅ 靜態完成 |
| Sub | 分包商資訊、出工記錄 | dashboard.js (mock) | ✅ 靜態完成 |
| Billing | 請款記錄、預付款 | finance.js (mock) | ✅ 靜態完成 |
| Docs | 文件列表、審查 | documents.js (mock) | ✅ 靜態完成 |

---

## 3. 風險評估與對策

### 3.1 技術風險

| 風險 | 可能性 | 影響 | 對策 | 負責人 |
|------|--------|------|------|--------|
| **無後端 API 可用** | 高 | 🔴 專案延遲 | 優先啟動 BE-001~BE-005，評估外包 | PM |
| **DB Schema 理解落差** | 中 | 🟡 資料對應錯誤 | 建立 Schema 文件，DBA 審查 mapping | DBA |
| **Frontend 重構範圍過大** | 中 | 🟡 交付延遲 | 採漸進式重構，優先 P0 API | Tech Lead |
| **無身份驗證經驗** | 中 | 🟡 安全漏洞 | 採成熟函式庫（Passport/JWT），資安顧問 review | Backend |
| **行動裝置相容性** | 低 | 🟢 體驗不佳 | 早期即使用 BrowserStack 測試 | QA |

### 3.2 業務風險

| 風險 | 可能性 | 影響 | 對策 | 負責人 |
|------|--------|------|------|--------|
| **使用者採用率低** | 中 | 🟡 投資浪費 | 早期使用者參與設計，MVP 後即 UAT | PM |
| **與既有系統整合困難** | 高 | 🔴 資料孤島 | 評估現有 ERP/財務系統 API | SA |
| **法規遵循（營造業）** | 中 | 🟡 合規問題 | 確認電子簽章法、營造業法規要求 | Legal |

### 3.3 資源風險

| 風險 | 可能性 | 影響 | 對策 | 負責人 |
|------|--------|------|------|--------|
| **Backend 人力不足** | 高 | 🔴 API 延期 | 優先核心 API，非核心延至 Phase 2 | PM |
| **DBA 支援有限** | 中 | 🟡 效能問題 | 早期 index 設計，監控自動化 | DBA |
| **測試環境不足** | 中 | 🟡 品質問題 | Cloud staging 環境，自動化部署 | DevOps |

---

## 4. 外部依賴

| 依賴項目 | 提供者 | 預期交付 | 狀態 | 備註 |
|----------|--------|----------|------|------|
| Backend API 規格 | Backend Team | 2026-04-28 | 🟡 等待中 | 需含 auth, dashboard, billing, safety |
| DB 存取權限開通 | DBA / IT | 2026-04-21 | 🟡 等待中 | Staging/Prod 環境 |
| SSL 憑證 | DevOps | 2026-04-21 | 🟢 已就緒 | Let's Encrypt 自動化 |
| 第三方登入（可選）| Backend | 2026-05-15 | ⚪ 未開始 | Google/Microsoft OAuth |
| UAT 測試帳號 | 業務單位 | 2026-05-01 | ⚪ 未開始 | 3 種角色各 2 組 |
| 文件上傳儲存空間 | DevOps | 2026-04-28 | ⚪ 未開始 | S3 或類似服務 |

---

## 5. 第一波執行順序（Wave 1: 0-6 Weeks）

### Sprint 1（Week 1-2）: Foundation

**目標**: 建立基礎建設，驗證技術可行性

| 任務 | Workflow | 負責人 | 交付物 |
|------|----------|--------|--------|
| DB-001: Schema 權限驗證 | Database | DBA | 權限確認文件 |
| BE-001: API 基礎架構 | Backend | Backend | Running server, /health endpoint |
| FE-001: API Client 建設 | Frontend | Frontend | src/api/client.js |
| OPS-001: 多環境部署 | DevOps | DevOps | Staging/Prod URLs |
| QA-001: 測試策略文件 | Tester | QA | docs/testing-strategy.md |

**驗收標準**:
- [ ] Staging 環境可訪問
- [ ] API health check 回傳 200
- [ ] Frontend 可呼叫 staging API（CORS 設定完成）

### Sprint 2（Week 3-4）: Auth & Data

**目標**: 身份驗證上線，Dashboard 資料動態化

| 任務 | Workflow | 負責人 | 依賴 |
|------|----------|--------|------|
| BE-002: 身份驗證 API | Backend | Backend | BE-001 |
| DB-002: IR/NCR 資料表設計 | Database | DBA | DB-001 |
| FE-002: 身份驗證整合 | Frontend | Frontend | BE-002, FE-001 |
| BE-003: Dashboard API | Backend | Backend | DB-001 |
| FE-003: Dashboard 資料重構 | Frontend | Frontend | BE-003, FE-002 |

**驗收標準**:
- [ ] Login/logout 功能正常
- [ ] Dashboard 顯示真實 DB 資料
- [ ] 未登入無法進入受保護頁面

### Sprint 3（Week 5-6）: Core Features

**目標**: Billing 與 Safety 動態化，基礎測試上線

| 任務 | Workflow | 負責人 | 依賴 |
|------|----------|--------|------|
| BE-004: Valuation/Billing API | Backend | Backend | DB-001 |
| BE-005: Safety Inspection API | Backend | Backend | DB-001 |
| FE-004: Billing 資料重構 | Frontend | Frontend | BE-004 |
| FE-005: Safety 資料重構 | Frontend | Frontend | BE-005 |
| QA-002: Unit Test 基礎 | Tester | QA | - |

**驗收標準**:
- [ ] Billing 顯示真實請款記錄
- [ ] Safety 巡檢可儲存至 DB
- [ ] Unit test coverage > 30%

### Wave 1 完成定義（Definition of Done）

- ✅ Dashboard, Billing, Safety 三個畫面 100% 動態化
- ✅ 身份驗證機制上線
- ✅ Staging 環境穩定運作
- ✅ 基礎自動化測試運行
- ⚠️ IR/NCR API 可能延期至 Wave 2（依 Backend 人力）

---

## 6. 里程碑時程

```
2026-04-14  [NOW]  主線計畫發布
    │
    ▼
2026-04-21  [M1]   DB 權限開通、基礎建設就緒
    │
    ▼
2026-04-28  [M2]   API 規格確定、Auth 上線
    │
    ▼
2026-05-12  [M3]   Wave 1 完成（Dashboard/Billing/Safety 動態化）
    │
    ▼
2026-05-26  [M4]   Wave 2 完成（IR/NCR/Material/Docs 動態化）
    │
    ▼
2026-06-09  [M5]   UAT 開始
    │
    ▼
2026-06-23  [M6]   正式上線（Production Release v1.0）
```

---

## 7. 資源配置建議

### 7.1 人力配置

| 角色 | 人數 | Wave 1 投入 | Wave 2 投入 |
|------|------|-------------|-------------|
| PM | 1 | 50% | 50% |
| Tech Lead | 1 | 80% | 60% |
| Frontend Dev | 1-2 | 100% | 100% |
| Backend Dev | 1-2 | 100% | 100% |
| DBA | 0.5 | 50% | 30% |
| DevOps | 0.5 | 50% | 30% |
| QA | 1 | 50% | 100% |
| UI/UX | 0.5 | 30% | 50% |

### 7.2 關鍵決策點

| 時間點 | 決策項目 | 選項 | 建議 |
|--------|----------|------|------|
| Week 2 | 是否導入 TypeScript | A: 維持 JS<br>B: 新 code 用 TS<br>C: 全面重構 | **B** - 漸進導入 |
| Week 3 | 是否使用現有 backend 或新建 | A: 擴充現有<br>B: 新建微服務 | 依現有 backend 狀況決定 |
| Week 4 | 是否支援離線模式 | A: Wave 1 支援<br>B: Phase 2 支援<br>C: 不支援 | **B** - PWA 在 Phase 2 |
| Week 6 | 是否開放 UAT | A: Wave 1 後<br>B: Wave 2 後 | **B** - 功能完整後 UAT |

---

## 8. 溝通計畫

| 會議 | 頻率 | 參與者 | 目的 |
|------|------|--------|------|
| Daily Standup | 每日 | Frontend, Backend, PM | 進度同步、阻塞排除 |
| Sprint Planning | 每兩週 | 全體 | 任務分配、估點 |
| Sprint Review | 每兩週 | 全體 + 業務代表 | 展示成果、收集回饋 |
| Retro | 每兩週 | 開發團隊 | 流程改善 |
| PM Sync | 每週 | PM, Tech Lead, 主管 | 風險上報、資源協調 |
| DBA Review | 每週 | DBA, Backend | Schema 設計審查 |

---

## 9. 文件連結

| 文件 | 路徑 | 說明 |
|------|------|------|
| System Inventory | `docs/system-inventory.md` | 技術架構詳細說明 |
| Implementation Backlog | `docs/implementation-backlog.md` | 完整任務清單（6 workflows） |
| 本文件 | `.hermes/plans/2026-04-14-mainline-pm-plan.md` | PM 主線計畫 |

---

## 10. 附錄：決策記錄

### ADR-001: 維持 Vanilla JS，不導入 React/Vue

- **狀態**: Accepted
- **背景**: 現有 code base 為 Vanilla JS，導入框架需大量重寫
- **決策**: Phase 1 維持 Vanilla JS，Phase 2 評估漸進導入框架或 TypeScript
- **理由**: 降低 Wave 1 風險，專注於 API 串接

### ADR-002: API 版本控制採 URL versioning (/api/v1/...)

- **狀態**: Proposed
- **背景**: 需要向後相容策略
- **決策**: URL path versioning
- **理由**: 簡單明確，與現有 REST 慣例一致

### ADR-003: 身份驗證採 JWT + httpOnly Cookie

- **狀態**: Proposed
- **背景**: 需支援行動裝置與桌面
- **決策**: JWT stored in httpOnly cookie，refresh token 機制
- **理由**: 比 localStorage 安全，比 session 適合 SPA

---

*文件版本: 2026-04-14*  
*作者: PM 專職執行代理*  
*下次更新: 2026-04-21（M1 後檢視）*
