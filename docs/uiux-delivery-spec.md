# UI/UX 交付規格文件 — Ta Chen PMIS

> 文件版本：2026-04-14  
> 適用範圍：大成工程 PMIS 前端（Vite 靜態框架）

---

## 1. 設計系統總覽

### 1.1 色彩系統（CSS Variables）

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg` | `#17140e` | 主背景（深色工地風） |
| `--s1` | `#1f1b13` | Sidebar 背景 |
| `--s2` | `#272318` | Card 表面 |
| `--s3` | `#302c1f` | Hover / Elevated |
| `--s4` | `#3a3526` | Pressed |
| `--gold` | `#c8911a` | 主色（工程金） |
| `--gold-txt` | `#f0c050` | 金色文字 |
| `--green` | `#4e9c6a` | 成功/通過 |
| `--red` | `#b84444` | 錯誤/逾期 |
| `--amber` | `#c87828` | 警告/待辦 |
| `--blue` | `#4a7baa` | 資訊/待複驗 |
| `--tx1` | `#ede5d5` | 主要文字 |
| `--tx2` | `#9a9080` | 次要文字 |
| `--tx3` | `#5c5445` | 禁用文字 |

### 1.2 字體系統

| Token | 字體 | 用途 |
|-------|------|------|
| `--fn` | `"Oswald", "Noto Sans TC", sans-serif` | 標題、數字 |
| `--fs` | `"Source Sans 3", "Noto Sans TC", sans-serif` | 內文 |
| `--fm` | `"IBM Plex Mono", monospace` | 數值、代碼 |

### 1.3 核心元件 Class

- **按鈕**：`btn bp` (primary)、`btn bg` (ghost)、`btn bd` (danger)、`btn bs` (success)、`btn ba` (amber)
- **標籤**：`tag tg` (green)、`tag tr` (red)、`tag ta` (amber)、`tag tb` (blue)、`tag tx` (gray)、`tag to` (gold)
- **警告**：`alert al-w` (warning)、`alert al-d` (danger)、`alert al-i` (info)、`alert al-s` (success)
- **表格容器**：`tw` (table wrapper)
- **KPI 卡片**：`kpi`
- **看板**：`kanban`、`kc` (column)、`kcc` (card)

---

## 2. View 分析（10個主要畫面）

### 2.1 Dashboard（工地總覽儀表板）

#### a) 畫面流（Screen Flow）

```
進入 Dashboard
    ├── 點擊 KPI 卡片 → 導航至對應 View
    │   ├── 工程總體進度 (68.3%) → daily (施工日報)
    │   ├── 本月查驗 (143件) → ir (查驗資料)
    │   ├── 待處理 NCR (7件) → ncr (缺失追蹤)
    │   ├── 今日出工人數 (127人) → morning (晨會記錄)
    │   └── 剩餘工期 (286天) → billing (估驗請款)
    ├── 點擊工程分項進度條 → open-work-detail modal
    │   └── 顯示地下/地上/機電/帷幕工程詳情
    ├── 點擊分包商列表「查看」→ open-subcontractor-detail modal
    └── 點擊本週待辦項目 → toggle-checklist
```

#### b) 操作層級（Interaction Hierarchy）

| 層級 | 操作 | 元素 |
|------|------|------|
| **Primary** | 查看詳情 | `.kpi.clickable` (5張卡片) |
| **Secondary** | 查看分包商/工程詳情 | `data-action="open-subcontractor-detail"`、`data-action="open-work-detail"` |
| **Tertiary** | 標記待辦完成 | `data-action="toggle-checklist"` (6個項目) |

#### c) 視覺一致性問題

| 問題 | 位置 | 現況 | 建議 |
|------|------|------|------|
| Inline Style 過多 | 工程分項進度區塊 (line 85-152) | 大量使用 `style="..."` 定義進度條顏色與布局 | 應改用 CSS class（如 `.wc1`、`.wc2`） |
| 進度條顏色不一致 | 不同工程類型 | 使用 `var(--wc1)` ~ `var(--wc5)` 但未文件化 | 建立 design token 對照表 |
| 圖表缺乏響應式 | S-CURVE SVG | 固定 viewBox，無法適配小螢幕 | 需測試 768px 以下顯示 |

#### d) Empty/Loading/Error State

| State | 實作狀況 | 備註 |
|-------|----------|------|
| Empty State | ❌ 未實作 | 無資料時無提示 |
| Loading State | ❌ 未實作 | API 載入時無 skeleton/spinner |
| Error State | ❌ 未實作 | 資料載入失敗無提示 |
| Alert | ✅ 已實作 | `.alert al-w` 用於今日動態 |

#### e) 手機版與桌面版差異

| 項目 | 桌面版 (>1279px) | 手機版 (<768px) |
|------|------------------|-----------------|
| KPI 卡片 | 5 欄 (`g5`) | 2 欄 (CSS media query) |
| 主要布局 | `g73` (左7右3) | 單欄垂直堆疊 |
| S-CURVE | 完整 SVG 顯示 | 需水平捲動或縮小 |
| 分包商表格 | 完整 table | 可水平捲動 (`tw` 容器) |

---

### 2.2 Billing（估驗請款）

#### a) 畫面流（Screen Flow）

```
進入 Billing
    ├── 點擊「新增估驗」→ mo-billing modal
    │   ├── 表單填寫（實際進度、申請金額）
    │   └── 送出 → toast 通知
    ├── 點擊「開始估驗」（第5期）→ mo-billing modal
    ├── 點擊「查看」（歷史期別）→ open-billing-detail modal
    └── 查看現金流預測卡片（靜態資訊）
```

#### b) 操作層級（Interaction Hierarchy）

| 層級 | 操作 | 元素 |
|------|------|------|
| **Primary** | 新增估驗/開始估驗 | `data-action="open-modal" data-modal-id="mo-billing"` |
| **Secondary** | 查看歷史估驗明細 | `data-action="open-billing-detail"` |
| **Tertiary** | 查看現金流預測 | 靜態卡片（無互動） |

#### c) 視覺一致性問題

| 問題 | 位置 | 現況 |
|------|------|------|
| KPI 卡片單位字體不一致 | line 5-8 | 使用 `<span style="font-size:14px">億</span>` inline style |
| 表格欄位寬度未優化 | 請款記錄 table | 長數字欄位可能破版 |

#### d) Empty/Loading/Error State

| State | 實作狀況 | 備註 |
|-------|----------|------|
| Empty State | ❌ 未實作 | 無請款記錄時無提示 |
| Loading State | ❌ 未實作 | 估驗資料載入中無提示 |
| Error State | ❌ 未實作 | 資料錯誤無提示 |

#### e) 手機版與桌面版差異

| 項目 | 桌面版 | 手機版 |
|------|--------|--------|
| KPI 卡片 | 4 欄 (`g4`) | 2 欄 |
| 請款記錄表格 | 完整顯示 | 水平捲動 (`tw`) |
| 現金流預測 | 並排顯示 | 垂直堆疊 |

---

### 2.3 Safety（工安巡檢）

#### a) 畫面流（Screen Flow）

```
進入 Safety
    ├── 點擊「新增巡檢日誌」→ safety-wizard 顯示 (display:block)
    │   └── Step 1: 選擇巡檢位置與項目
    │       ├── 選擇巡檢日期、巡檢人員
    │       ├── 勾選巡檢位置（checkbox）
    │       └── 勾選巡檢項目（checkbox，10項）
    │       └── 點擊「下一步」→ Step 2
    │   └── Step 2: 巡檢查核
    │       ├── 動態生成查核清單（由 JS 根據 Step 1 生成）
    │       ├── 標記合格/不合格
    │       └── 填寫缺失備註
    │       └── 點擊「下一步」→ Step 3
    │   └── Step 3: 上傳照片·送出
    │       ├── 上傳照片區域（點擊觸發 toast）
    │       ├── 安危確認聲明（checkbox）
    │       └── 電子簽名區域
    │       └── 點擊「送出」→ toast 通知
    └── 點擊「取消」→ wizard 關閉 (display:none)
```

#### b) 操作層級（Interaction Hierarchy）

| 層級 | 操作 | 元素 |
|------|------|------|
| **Primary** | 開始巡檢流程 | `data-action="safety-step" data-step="1"` |
| **Primary** | 步驟導航（下一步/上一步） | `data-action="safety-step" data-step="2/3"` |
| **Secondary** | 取消巡檢 | `data-action="safety-cancel"` |
| **Tertiary** | 上傳照片、簽名 | `data-action="toast-msg"`、`data-action="sign-pad"` |

#### c) 視覺一致性問題

| 問題 | 位置 | 現況 | 嚴重度 |
|------|------|------|--------|
| **Wizard step indicator inline style 過多** | line 8-23 | 步驟指示器大量使用 inline style，難以維護 | 🔴 高 |
| **Checkbox 樣式不一致** | Step 1 | 使用原生 `accent-color:var(--gold)`，非統一元件 | 🟡 中 |
| **表單 grid layout 硬編碼** | line 46-57 | `grid-template-columns:1fr 1fr` inline | 🟡 中 |
| **無步驟驗證提示** | 各步驟 | 未填寫必填欄位仍可下一步 | 🔴 高 |

#### d) Empty/Loading/Error State

| State | 實作狀況 | 備註 |
|-------|----------|------|
| Wizard 初始化 | ✅ 已實作 | `#safety-wizard` 預設 `display:none` |
| Step 2 動態內容 | ✅ 已實作 | `#sf-checklist` 由 JS 動態生成 |
| 表單驗證錯誤 | ❌ 未實作 | 無欄位驗證提示 |
| 提交失敗 | ❌ 未實作 | 無錯誤處理 |
| 照片預覽 | ❌ 未實作 | 僅顯示「點擊上傳」無實際預覽 |

#### e) 手機版與桌面版差異

| 項目 | 桌面版 | 手機版 |
|------|--------|--------|
| Wizard 寬度 | 預設 card 寬度 | 需適配小螢幕 |
| Step indicator | 水平排列 | **可能換行**（375px 寬度下需測試） |
| Checkbox 區域 | 2 欄 grid | 應改為單欄 |
| 表單欄位 | 並排 | 垂直堆疊 |

**⚠️ Wave 1 風險**：Step indicator 在 375px 寬度下可能換行，需確認 UI 不會破版。

---

### 2.4 IR（查驗資料）

#### a) 畫面流（Screen Flow）

```
進入 IR
    ├── 點擊「申請查驗」→ mo-ir modal
    │   └── 填寫查驗申請表單 → 提交 → toast
    ├── Filter Bar 操作
    │   ├── 全部 / 待審查 / 已通過 / 不合格
    │   └── `data-action="filter-ir"` 切換表格顯示
    ├── 點擊「審核」（待審查項目）→ mo-review modal
    │   ├── 查核項目勾選（5項檢查點）
    │   ├── 標記合格/不合格
    │   ├── 電子簽名
    │   └── 提交結果 → toast
    └── 點擊「查看」（已通過項目）→ open-ir-detail modal
```

#### b) 操作層級（Interaction Hierarchy）

| 層級 | 操作 | 元素 |
|------|------|------|
| **Primary** | 申請查驗 | `data-action="open-modal" data-modal-id="mo-ir"` |
| **Primary** | 審核查驗 | `data-action="open-modal" data-modal-id="mo-review"` |
| **Secondary** | 篩選查驗記錄 | `data-action="filter-ir"` (fbar) |
| **Tertiary** | 查看查驗詳情 | `data-action="open-ir-detail"` |

#### c) 視覺一致性問題

| 問題 | 位置 | 現況 |
|------|------|------|
| 三級品管欄位過寬 | table header | 標題文字較長，在小螢幕可能擠壓 |
| 狀態標籤多樣性高 | 一級/二級/三級欄位 | `tag tg/ta/tr/tx/to` 混用，需確認語義一致 |

#### d) Empty/Loading/Error State

| State | 實作狀況 |
|-------|----------|
| Filter 無結果 | ❌ 未實作（filter 後無資料無提示） |
| 查驗詳情載入失敗 | ❌ 未實作（`toast('找不到查驗記錄', 'te')` 僅在 actions.js） |

#### e) 手機版與桌面版差異

| 項目 | 桌面版 | 手機版 |
|------|--------|--------|
| Filter bar | 水平排列 | 可水平捲動 |
| 查驗表格 | 完整 8 欄 | 水平捲動（min-width: 480px） |
| 統計卡片 | 並排 | 垂直堆疊 |

---

### 2.5 NCR（缺失追蹤）

#### a) 畫面流（Screen Flow）

```
進入 NCR
    ├── Alert 提示逾期項目（.alert al-d）
    ├── 點擊「開立缺失」→ mo-ncr modal
    │   └── 填寫缺失表單 → 提交 → toast
    └── 點擊 Kanban Card → open-ncr-detail modal
        └── 查看缺失詳情
```

#### b) 操作層級（Interaction Hierarchy）

| 層級 | 操作 | 元素 |
|------|------|------|
| **Primary** | 開立缺失 | `data-action="open-modal" data-modal-id="mo-ncr"` |
| **Secondary** | 查看缺失詳情 | `data-action="open-ncr-detail"` |
| **Tertiary** | 確認逾期提醒 | 關閉 `.alert al-d` |

#### c) 視覺一致性問題

| 問題 | 位置 | 現況 |
|------|------|------|
| Kanban 欄位高度不一致 | `.kc` | 不同狀態欄位卡片數量不同，高度不一 |
| 已關閉卡片透明度 | line 24-25 | `style="opacity:.5"` inline |

#### d) Empty/Loading/Error State

| State | 實作狀況 |
|-------|----------|
| 某欄位無資料 | ❌ 未實作（無 empty placeholder） |
| 逾期提示 | ✅ 已實作（`.alert al-d`） |

#### e) 手機版與桌面版差異

| 項目 | 桌面版 | 手機版 |
|------|--------|--------|
| Kanban 布局 | 4 欄 | 2 欄（CSS grid 調整） |
| 卡片寬度 | 固定 | 自動適配 |

---

### 2.6 Material（材料進場驗收）

#### a) 畫面流（Screen Flow）

```
進入 Material
    ├── 點擊「進場登記」→ mo-material modal
    │   └── 填寫進場表單 → 提交 → toast
    ├── 快速驗收登記（表單直接在畫面）
    │   └── 填寫後點擊「登記進場」→ toast
    ├── 點擊「驗收」（待驗項目）→ open-mat-qc modal
    └── 點擊「查看」（已驗項目）→ open-mat-detail modal
```

#### b) 操作層級（Interaction Hierarchy）

| 層級 | 操作 | 元素 |
|------|------|------|
| **Primary** | 進場登記 | `data-action="open-modal" data-modal-id="mo-material"` |
| **Secondary** | 快速驗收登記 | Card 內表單 |
| **Tertiary** | 查看/驗收材料 | `data-action="open-mat-detail"`、`data-action="open-mat-qc"` |

#### c) 視覺一致性問題

| 問題 | 位置 | 現況 |
|------|------|------|
| 快速登記表單無驗證 | line 19-22 | 可直接點擊送出，無欄位驗證 |

#### d) Empty/Loading/Error State

| State | 實作狀況 |
|-------|----------|
| 無進場記錄 | ❌ 未實作 |
| 驗收完成提示 | ✅ 已實作（toast） |

---

### 2.7 Docs（文件管理）

#### a) 畫面流（Screen Flow）

```
進入 Docs
    ├── 點擊「上傳文件」→ mo-doc-upload modal
    ├── Filter Bar 切換類別（全部/施工計畫書/設計圖說/...）
    ├── 點擊「查看」→ open-doc-view modal
    ├── 點擊「下載」→ toast 通知
    └── 點擊「審查」（審查中文件）→ open-doc-review modal
```

#### b) 操作層級（Interaction Hierarchy）

| 層級 | 操作 | 元素 |
|------|------|------|
| **Primary** | 上傳文件 | `data-action="open-modal" data-modal-id="mo-doc-upload"` |
| **Secondary** | 審查文件 | `data-action="open-doc-review"` |
| **Tertiary** | 查看/下載 | `data-action="open-doc-view"`、toast |

#### c) 視覺一致性問題

| 問題 | 位置 | 現況 |
|------|------|------|
| Filter bar 無 active 狀態綁定 | line 5-11 | 僅第一個有 `act` class，無 data-action |

#### d) Empty/Loading/Error State

| State | 實作狀況 |
|-------|----------|
| 無文件 | ❌ 未實作 |
| 下載中 | ✅ 已實作（toast） |

---

### 2.8 Morning（工地晨會記錄）

#### a) 畫面流（Screen Flow）

```
進入 Morning
    ├── Alert 提示今日記錄尚未建立（.alert al-w）
    ├── 點擊「新增晨會」→ mo-morning modal
    │   └── 表單填寫 → 提交 → toast
    ├── 快速填寫今日晨會（左側 card）
    │   ├── 日期、時間、出工人數、天氣
    │   ├── 今日主要施工項目
    │   ├── 工安宣導重點
    │   └── 協議事項
    │   └── 點擊「儲存」→ toast
    └── 點擊歷史記錄「查看」→ open-morning-view modal
```

#### b) 操作層級（Interaction Hierarchy）

| 層級 | 操作 | 元素 |
|------|------|------|
| **Primary** | 新增晨會（modal） | `data-action="open-modal" data-modal-id="mo-morning"` |
| **Primary** | 快速填寫並儲存 | `data-action="toast-msg"` |
| **Secondary** | 預覽 PDF | 靜態按鈕 |
| **Tertiary** | 查看歷史記錄 | `data-action="open-morning-view"` |

#### c) 視覺一致性問題

| 問題 | 位置 | 現況 |
|------|------|------|
| 表單預設值硬編碼 | line 8-15 | `value="2025-03-21"`、預設文字 |
| textarea 內容換行 | line 10-15 | 多行文字內嵌在 HTML |

#### d) Empty/Loading/Error State

| State | 實作狀況 |
|-------|----------|
| 今日未建立提示 | ✅ 已實作（`.alert al-w`） |
| 儲存成功 | ✅ 已實作（toast） |

---

### 2.9 Daily（施工日報）

#### a) 畫面流（Screen Flow）

```
進入 Daily
    ├── 點擊「新增日報」→ mo-daily modal
    │   └── 表單填寫 → 提交 → toast
    ├── 查看最新日報（左側 card）
    │   ├── 基本資訊（日期、天氣、人數、主任）
    │   ├── 施工日報表格
    │   └── 人力不足 alert（.alert al-w）
    └── 右側：人力配置 + 施工照片
```

#### b) 操作層級（Interaction Hierarchy）

| 層級 | 操作 | 元素 |
|------|------|------|
| **Primary** | 新增日報 | `data-action="open-modal" data-modal-id="mo-daily"` |
| **Secondary** | 上傳照片（靜態） | line 44（僅視覺） |

#### c) 視覺一致性問題

| 問題 | 位置 | 現況 |
|------|------|------|
| 照片區域無實際功能 | line 41-44 | 僅顯示檔名，無真實圖片 |
| 上傳按鈕無功能 | line 44 | `點擊上傳` 無 data-action |

#### d) Empty/Loading/Error State

| State | 實作狀況 |
|-------|----------|
| 無日報記錄 | ❌ 未實作 |
| 人力不足提醒 | ✅ 已實作（`.alert al-w`） |

---

### 2.10 Sub（分包商管理）

#### a) 畫面流（Screen Flow）

```
進入 Sub
    ├── 點擊「新增合約」→ mo-sub-new modal（未在 actions.js 實作）
    └── 點擊「查看」→ mo-sub-detail modal
        ├── 合約資料（唯讀）
        ├── 出工記錄/評比筆記（可編輯）
        │   ├── 新增記錄 → 顯示表單 → 儲存
        │   └── 查看歷史記錄
        └── 匯出評比 / 通知協調會
```

#### b) 操作層級（Interaction Hierarchy）

| 層級 | 操作 | 元素 |
|------|------|------|
| **Primary** | 查看分包商詳情 | `data-action="open-subcontractor-detail"` |
| **Secondary** | 新增出工記錄 | `data-action="add-work-log"` |
| **Tertiary** | 匯出/通知 | `data-action="toast-msg"` |

#### c) 視覺一致性問題

| 問題 | 位置 | 現況 |
|------|------|------|
| 進度條 inline style | line 8-12 | `style="width:68%"` 等 |
| 合約金額格式不一致 | table | 有些有 `$` 符號，有些純數字 |

#### d) Empty/Loading/Error State

| State | 實作狀況 |
|-------|----------|
| 無分包商 | ❌ 未實作 |
| 無出工記錄 | ❌ 未實作 |

---

## 3. Wave 1 重點（dashboard / billing / safety）

### 3.1 優先 UI 狀態需求

| View | 優先狀態 | 需求說明 | 驗收標準 |
|------|----------|----------|----------|
| **Dashboard** | Empty State | KPI 卡片無資料時顯示 placeholder | 顯示「尚無資料」提示與圖示 |
| **Dashboard** | Loading State | 工程進度資料載入中 | Skeleton 或 spinner，不顯示 "0%" |
| **Dashboard** | Error State | API 載入失敗 | 顯示錯誤訊息與重試按鈕 |
| **Billing** | Empty State | 無請款記錄 | 顯示「尚無請款記錄」與「新增估驗」引導 |
| **Safety** | Wizard Mobile 適配 | 三步驟精靈手機版顯示 | Step indicator 在 375px 寬度下不換行 |
| **Safety** | Form Validation | 巡檢表單驗證 | 未填寫必填欄位時顯示錯誤提示，阻擋下一步 |
| **Safety** | Step 2 載入狀態 | 動態生成查核清單 | 顯示 loading spinner |

### 3.2 Wave 1 元件調整

| 元件 | 調整項目 | 說明 |
|------|----------|------|
| **KPI Card** | Inline style 移除 | 將 `style="--kc:var(--gold)"` 改為 CSS class |
| **Progress Bar** | 工程分項進度統一 | 建立 `.wc1` ~ `.wc5` class 對應各工程類型 |
| **Safety Wizard** | Step indicator 重構 | 改用 CSS class 控制 active/inactive 狀態 |
| **Safety Wizard** | Checkbox 統一 | 使用 `.fck` class 取代原生 checkbox |
| **Table** | RWD 優化 | 確保 768px 以下可正常水平捲動 |

---

## 4. 技術脈絡摘要

### 4.1 視圖切換機制

- **無 Router**：透過 CSS `.active` class 控制顯示（`display: block/none`）
- **View ID**：`#v-dashboard`、`#v-billing`、...、`#v-sub`
- **切換函數**：`gv(view, element, label)`、`gvMobile()`、`gvDash()`

### 4.2 互動模式

- **Event Delegation**：`data-action` 屬性標記，document level 監聽
- **Modal**：`data-modal-id` 對應 `#mo-{id}`，`.mo` / `.md` 結構
- **Toast**：`toast(message, type)`，type: `ts`(success)、`tw`(warning)、`te`(error)

### 4.3 響應式斷點

| 斷點 | 範圍 | 調整 |
|------|------|------|
| Desktop | >1279px | 完整布局 |
| Tablet | 768–1279px | Sidebar 縮窄、grid 調整 |
| Icon-only Sidebar | 768–900px | Sidebar 52px，僅顯示 icon |
| Mobile | <768px | Sidebar 隱藏，Bottom Nav 顯示 |

### 4.4 Mobile 導航結構

- **Bottom Nav** (`#bn0`~`#bn4`)：總覽、查驗、缺失、工安、更多
- **Drawer**：從底部滑出，3x4 grid 顯示所有功能
- **資料屬性**：`data-view`、`data-label`、`data-bn-id`

---

## 5. 附錄：data-action 與 data-modal-id 對照表

### 5.1 Global Actions（所有 view 共用）

| data-action | 說明 | 參數 |
|-------------|------|------|
| `navigate-view` | 導航至指定 view | `data-view`, `data-label` |
| `dashboard-nav` | Dashboard KPI 導航 | `data-view`, `data-label` |
| `mobile-bottom-nav` | 手機底部導航 | `data-view`, `data-label` |
| `mobile-drawer-nav` | Drawer 導航 | `data-view`, `data-label`, `data-bn-id` |
| `open-drawer` | 開啟 Drawer | 無 |
| `close-drawer` | 關閉 Drawer | 無 |
| `open-modal` | 開啟 Modal | `data-modal-id` |
| `close-modal` | 關閉 Modal | `data-modal-id` |
| `close-modal-toast` | 關閉 Modal + Toast | `data-modal-id`, `data-msg`, `data-type` |
| `toast-msg` | 顯示 Toast | `data-msg`, `data-type` |
| `toggle-checklist` | 切換待辦狀態 | 無 |

### 5.2 View-specific Actions

| data-action | 所屬 View | 說明 | 參數 |
|-------------|-----------|------|------|
| `open-work-detail` | Dashboard | 工程分項詳情 | `data-work-id` |
| `open-subcontractor-detail` | Dashboard, Sub | 分包商詳情 | `data-sub-id` |
| `open-billing-detail` | Billing | 估驗明細 | `data-billing-id` |
| `safety-step` | Safety | Wizard 步驟導航 | `data-step` (1/2/3) |
| `safety-cancel` | Safety | 取消巡檢 | 無 |
| `safety-send` | Safety | 送出巡檢 | 無 |
| `sign-pad` | Safety | 電子簽名 | 無 |
| `filter-ir` | IR | 篩選查驗記錄 | `data-filter` (all/wait/pass/fail) |
| `open-ir-detail` | IR | 查驗詳情 | `data-ir-id` |
| `ir-review-check` | IR (modal) | 標記查核結果 | `data-result` (pass/fail) |
| `ir-review-sign` | IR (modal) | 電子簽名 | 無 |
| `open-ncr-detail` | NCR | 缺失詳情 | `data-ncr-id` |
| `open-mat-detail` | Material | 材料詳情 | `data-mat-id` |
| `open-mat-qc` | Material | 材料驗收 | `data-mat-id` |
| `open-morning-view` | Morning | 晨會記錄 | `data-morning-id` |
| `open-doc-view` | Docs | 文件查看 | `data-doc-id` |
| `open-doc-review` | Docs | 文件審查 | `data-doc-id` |
| `add-work-log` | Sub (modal) | 新增出工記錄 | 無 |
| `save-work-log` | Sub (modal) | 儲存出工記錄 | 無 |

### 5.3 Modal ID 清單

| Modal ID | 用途 | 觸發方式 |
|----------|------|----------|
| `mo-ir` | 查驗申請 | IR view「申請查驗」|
| `mo-review` | IR 審核 | IR view「審核」按鈕 |
| `mo-ir-detail` | 查驗詳情 | `open-ir-detail` |
| `mo-ncr` | 開立缺失 | NCR view「開立缺失」|
| `mo-ncr-view` | 缺失詳情 | `open-ncr-detail` |
| `mo-material` | 材料進場登記 | Material view「進場登記」|
| `mo-mat-detail` | 材料詳情 | `open-mat-detail` |
| `mo-mat-qc` | 材料驗收 | `open-mat-qc` |
| `mo-billing` | 估驗請款 | Billing view「新增估驗」|
| `mo-billing-detail` | 估驗明細 | `open-billing-detail` |
| `mo-morning` | 新增晨會 | Morning view「新增晨會」|
| `mo-morning-view` | 晨會詳情 | `open-morning-view` |
| `mo-daily` | 新增日報 | Daily view「新增日報」|
| `mo-sub-detail` | 分包商詳情 | `open-subcontractor-detail` |
| `mo-work-detail` | 工程分項詳情 | `open-work-detail` |
| `mo-doc-view` | 文件查看 | `open-doc-view` |
| `mo-doc-review` | 文件審查 | `open-doc-review` |
| `mo-quick` | 快速新增 | Topbar（全域）|
| `mo-alerts` | 系統通知 | Topbar 鈴鐺 icon |

---

*文件結束*
