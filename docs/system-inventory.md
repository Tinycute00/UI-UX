# System Inventory — Ta Chen PMIS Frontend

## 1. Project Overview

**專案名稱**: 大成工程 PMIS — 工地管理資訊系統  
**類型**: Vite-based Static Frontend (ES Modules, Vanilla JS)  
**版本**: 1.0.0  
**狀態**: 靜態原型階段（尚未串接後端 API）

---

## 2. Frontend Framework & Architecture

### 2.1 核心技術棧

| 項目 | 技術 | 說明 |
|------|------|------|
| 建構工具 | Vite 5.2.0 | 開發伺服器、production build、plugin 系統 |
| 語言 | ES Modules (ES2022+) | 原生 ES module，無 transpiler |
| 樣式 | Vanilla CSS | 單一 main.css，CSS Variables 主題系統 |
| Lint/Format | Biome 1.9.4 | 替代 ESLint/Prettier，支援 JSON config |
| 字體 | Google Fonts | Noto Sans TC, IBM Plex Mono, Oswald, Source Sans 3 |

### 2.2 專案結構

```
/home/beer8/team-workspace/UI-UX/
├── index.html                 # 入口 HTML，使用 @include partials
├── vite.config.js            # Vite 設定 + 自訂 htmlPartialsPlugin
├── biome.json                # Lint/format 規則
├── package.json              # Scripts: dev, build, lint, format
├── scripts/
│   └── vite-plugin-html-partials.mjs   # HTML partial 編譯外掛
└── src/
    ├── main.js               # 入口：載入 CSS，啟動 bootstrap
    ├── styles/
    │   └── main.css          # 單一樣式表（~600+ lines）
    ├── app/
    │   ├── bootstrap.js      # App 初始化：modals, safety, navigation
    │   └── actions.js        # 中央 action dispatcher，所有 UI 交互
    ├── js/
    │   ├── navigation.js     # 視圖切換、側邊欄、底部導航
    │   ├── modals.js         # Modal 開關、toast、checklist toggle
    │   ├── safety.js         # 工安巡檢精靈邏輯
    │   └── data-setters.js   # DOM 資料注入 helpers
    ├── data/                 # ⚠️ 靜態 mock data（待改為 API）
    │   ├── dashboard.js      # 工程進度、分包商資料
    │   ├── quality.js        # IR 查驗、NCR 缺失
    │   ├── materials.js      # 材料進場、驗收
    │   ├── finance.js        # 請款記錄
    │   ├── meetings.js       # 晨會記錄
    │   └── documents.js      # 文件管理
    └── partials/             # HTML partials（Vite 編譯時組合）
        ├── icons/sprite.html
        ├── shell/
        │   ├── sidebar.html      # 左側導航
        │   └── topbar.html       # 頂部標題列
        ├── views/                # 10 個主要畫面
        │   ├── dashboard.html    # 總覽儀表板
        │   ├── morning.html      # 晨會記錄
        │   ├── daily.html        # 施工日報
        │   ├── ir.html           # 查驗資料
        │   ├── ncr.html          # 缺失追蹤
        │   ├── material.html     # 材料驗收
        │   ├── safety.html       # 工安巡檢
        │   ├── sub.html          # 分包商管理
        │   ├── billing.html      # 估驗請款
        │   └── docs.html         # 文件管理
        ├── mobile/
        │   ├── bottom-nav.html   # 手機底部導航
        │   └── drawer.html       # 手機側邊抽屜
        └── modals/               # 彈出視窗
            ├── actions.html
            ├── detail-panels.html
            ├── material-ncr.html
            ├── supporting.html
            └── work-contracts.html
```

### 2.3 架構模式

**單頁應用（SPA-like）但無路由函式庫**:
- 視圖切換：透過 CSS `.active` class 控制顯示（`display: block/none`）
- 導航狀態：中央管理於 `navigation.js`，支援桌面側邊欄 + 手機底部導航
- 資料流：靜態 JS objects → DOM injection via `data-setters.js`

**Action-Driven Architecture**:
- 所有 UI 交互統一由 `actions.js` 分派
- HTML 元素使用 `data-action="..."` 屬性標記
- Event delegation 在 document level，避免 per-element listeners

---

## 3. 主要畫面/模組對應表

| 畫面 ID | 畫面名稱 | 對應檔案 | 主要功能 | 對應 DB Domain |
|---------|----------|----------|----------|----------------|
| dashboard | 工地總覽儀表板 | views/dashboard.html | 工程進度 S-curve、分項進度、分包商列表 | project.projects, contract.contract_headers |
| morning | 工地晨會記錄 | views/morning.html | 每日晨會記錄檢視 | （待設計，可能為會議記錄表） |
| daily | 施工日報 | views/daily.html | 每日施工狀況 | project.progress_measurement_baselines |
| ir | 查驗資料 (IR) | views/ir.html | 三級品管查驗記錄、審查簽名 | quality.IR 相關（尚未對應 DB） |
| ncr | 缺失追蹤 (NCR) | views/ncr.html | 品質/工安缺失開立與追蹤 | quality.NCR 相關（尚未對應 DB） |
| material | 材料進場驗收 | views/material.html | 材料進場、送驗、退料 | valuation.daily_quantity_snapshots（間接） |
| safety | 工安巡檢 | views/safety.html | 安全檢查精靈、巡查項目 | safety.safety_headers, safety.safety_details |
| sub | 分包商管理 | views/sub.html | 協力廠商資訊、出工記錄 | vendor.vendors, contract.contract_headers |
| billing | 估驗請款 | views/billing.html | 工程估驗、請款記錄 | valuation.valuation_headers, finance.advance_payments |
| docs | 文件管理 | views/docs.html | 圖說、計畫書、審查 | document.document_attachments |

---

## 4. 現況限制與待補強項目

### 4.1 資料層限制（重大）

| 限制項目 | 現況 | 影響 | 優先級 |
|----------|------|------|--------|
| 無後端 API 串接 | 所有資料為 hardcoded JS objects | 無法即時更新、無多用戶支援 | P0 |
| 無身份驗證 | 無 login/logout 機制 | 無權限控管、無操作者追蹤 | P0 |
| 無資料持久化 | 資料僅存在 memory | 重新整理即遺失變更 | P0 |
| 無檔案上傳 | 文件管理僅為靜態列表 | 無法上傳圖說、照片 | P1 |

### 4.2 前端技術限制

| 限制項目 | 現況 | 風險 |
|----------|------|------|
| 無 TypeScript | 純 JS，無型別檢查 | 重構困難、runtime error 風險 |
| 無測試框架 | 無 unit/integration tests | 回歸測試成本高昂 |
| 無狀態管理 | 資料散佈於各 data/*.js | 資料同步困難 |
| 無 routing | hash/URL 不變 | 無法 bookmark、browser back 異常 |
| CSS 單一大檔 | main.css 包含全部樣式 | 維護困難、命名衝突風險 |

### 4.3 業務功能缺口

| 功能 | 現況 | 需求來源 |
|------|------|----------|
| 即時推播通知 | 僅靜態 toast | 系統連線成功通知 |
| 離線支援 | 無 service worker | 工地網路不穩 |
| 多語系 | 僅繁體中文 | 未來擴充 |
| 報表匯出 | 無 | 管理階層需求 |
| 行事曆整合 | 無 | 進度管理 |

---

## 5. Frontend ↔ Database Domain 映射

### 5.1 已驗證 DB Schema 對應

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND VIEW LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  dashboard                                                      │
│  ├── 工程總體進度 S-curve    ←──→  project.projects             │
│  ├── 工程分項進度            ←──→  contract.contract_headers    │
│  │                                contract.contract_items       │
│  └── 分包商列表              ←──→  vendor.vendors               │
│                                                                 │
│  billing                                                        │
│  ├── 請款記錄                ←──→  valuation.valuation_headers  │
│  ├── 估驗明細                ←──→  valuation.valuation_details  │
│  ├── 預付款管理              ←──→  finance.advance_payments     │
│  │                                finance.advance_payment_*     │
│  └── 價格調整                ←──→  valuation.price_adjustment_* │
│                                                                 │
│  ir (查驗)                                                      │
│  ├── 三級品管查驗            ←──→  （需對應 DB 設計）           │
│  └── 電子簽名                ←──→  audit.audit_logs             │
│                                                                 │
│  ncr (缺失)                                                     │
│  ├── 缺失開立                ←──→  （需對應 DB 設計）           │
│  └── 改善追蹤                ←──→  （需對應 DB 設計）           │
│                                                                 │
│  safety                                                         │
│  ├── 巡檢表單                ←──→  safety.safety_headers        │
│  ├── 巡檢項目                ←──→  safety.safety_details        │
│  ├── 附件上傳                ←──→  safety.attachments           │
│  └── 事故通報                ←──→  safety.incident_reports      │
│                                                                 │
│  material                                                       │
│  ├── 進場記錄                ←──→  valuation.daily_quantity_*   │
│  └── 驗收狀態                ←──→  （需對應 DB 設計）           │
│                                                                 │
│  docs                                                           │
│  ├── 文件列表                ←──→  document.document_attachments│
│  └── 版本管理                ←──→  （需對應 DB 設計）           │
│                                                                 │
│  sub (分包商)                                                   │
│  ├── 廠商資料                ←──→  vendor.vendors               │
│  └── 合約資訊                ←──→  contract.contract_headers    │
│                                                                 │
│  morning/daily                                                  │
│  ├── 晨會/日報記錄           ←──→  （需對應 DB 設計）           │
│  └── 出工人數                ←──→  （需對應 DB 設計）           │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 待確認/待設計 DB 對應

| Frontend Module | 現況 Mock Data | 建議對應 DB Table | 狀態 |
|-----------------|----------------|-------------------|------|
| IR 查驗記錄 | IR_DETAILS, IR_NOTES | 需新建 quality.inspection_records | ⚠️ 待設計 |
| NCR 缺失追蹤 | NCR_DETAILS | 需新建 quality.ncr_records | ⚠️ 待設計 |
| 材料驗收 | MATERIAL_DETAILS | 需新建 materials 相關 tables | ⚠️ 待設計 |
| 晨會記錄 | MORNING_VIEW_DETAILS | 需新建 meetings.daily_meetings | ⚠️ 待設計 |
| 工安巡檢精靈 | 步驟 1-3 動態表單 | safety.safety_headers/details 需擴充 | ⚠️ 需評估 |

### 5.3 Audit Trail 需求

所有業務操作應寫入：
- `audit.audit_logs` — 操作記錄
- `audit.import_batches` / `audit.import_batch_rows` — 批次匯入追蹤

---

## 6. 技術債摘要

| 類別 | 項目 | 嚴重度 | 建議處理時機 |
|------|------|--------|--------------|
| 架構 | 無 routing | 中 | Phase 2（加入後端後） |
| 架構 | 無狀態管理 | 中 | Phase 2 |
| 資料 | Hardcoded mock data | 高 | P0 - Phase 1 |
| 安全 | 無身份驗證 | 高 | P0 - Phase 1 |
| 品質 | 無測試 | 中 | Phase 2 |
| 品質 | 無 TypeScript | 低 | Phase 3 |
| 效能 | 無 code splitting | 低 | Phase 3 |

---

## 7. CI/CD 現況

- **GitHub Actions**: `.github/workflows/deploy.yml`
- **觸發條件**: push to `main`, pull requests
- **執行項目**:
  - `npm run lint` - Biome lint check
  - `npm run format:check` - Biome format check
  - `npm run build` - Vite production build
- **部署**: GitHub Pages（dist/ 目錄）

---

*文件版本: 2026-04-14*  
*對應程式版本: 1.0.0*  
*建立者: PM 專職執行代理*
