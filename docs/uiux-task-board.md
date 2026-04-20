# UI/UX 任務板 — Ta Chen PMIS

> 文件版本：2026-04-14  
> 優先級定義：P0（阻擋發布）、P1（必要功能）、P2（增強功能）

---

## Wave 1 優先任務（Dashboard / Billing / Safety）

| Task ID | Task Name | Priority | Description | Acceptance Criteria | Dependencies |
|---------|-----------|----------|-------------|---------------------|--------------|
| **W1-001** | Dashboard Empty State 設計 | P0 | 當工程進度、分包商資料無法載入時，顯示友善的 empty state | 1. 顯示「尚無資料」插圖與文字<br>2. 提供「重新載入」按鈕<br>3. 不顯示 "0%" 或空白卡片 | FE-003 |
| **W1-002** | Dashboard Loading State | P0 | API 資料載入中顯示 skeleton 或 spinner | 1. KPI 卡片顯示 skeleton shimmer<br>2. 表格顯示 loading row<br>3. S-CURVE 區塊顯示 spinner | FE-003 |
| **W1-003** | Dashboard Error State | P0 | 資料載入失敗時的錯誤處理 | 1. 顯示錯誤訊息（含錯誤代碼）<br>2. 提供「重試」按鈕<br>3. 不顯示過期/錯誤資料 | FE-001 |
| **W1-004** | Billing Empty State | P0 | 無請款記錄時的 empty state | 1. 顯示「尚無請款記錄」<br>2. 顯示「新增估驗」引導按鈕<br>3. 隱藏空白表格 | FE-004 |
| **W1-005** | Billing Loading State | P0 | 請款資料載入中狀態 | 1. KPI 顯示 skeleton<br>2. 請款記錄表格顯示 loading rows<br>3. 現金流卡片顯示 placeholder | FE-004 |
| **W1-006** | Safety Wizard Step Indicator 手機適配 | P0 | 確保 step indicator 在 375px 寬度正常顯示 | 1. 步驟指示器在 375px 寬度下不換行<br>2. 文字可縮小或隱藏<br>3. 步驟數字圓圈保持可見 | None |
| **W1-007** | Safety Wizard 表單驗證 | P0 | 步驟 1-3 的必填欄位驗證 | 1. 未選擇巡檢位置時阻擋進入 Step 2<br>2. Step 2 未標記查核結果時阻擋進入 Step 3<br>3. Step 3 未勾選安危確認時阻擋送出<br>4. 顯示欄位級錯誤提示 | FE-005 |
| **W1-008** | Safety Wizard Inline Style 重構 | P1 | 將 step indicator 的 inline style 改為 CSS class | 1. 建立 `.sw-step`、`sw-step-active` 等 class<br>2. 移除 step indicator 的 inline style<br>3. 視覺效果與現有保持一致 | None |
| **W1-009** | Dashboard KPI Inline Style 重構 | P1 | 將 KPI 卡片的 inline style 改為 CSS class | 1. 建立 `.kpi-gold`、`.kpi-green` 等 modifier class<br>2. 移除 `--kc` inline style<br>3. 建立 progress bar 顏色 class (`.wc1` ~ `.wc5`) | None |
| **W1-010** | Safety Checkbox 統一元件 | P1 | 使用統一 checkbox 元件 | 1. 使用 `.fck` class 取代原生 checkbox<br>2. 統一樣式與互動效果<br>3. 支援 keyboard navigation | None |

---

## UI Workflow 任務（UI-001 ~ UI-006 拆細）

### UI-001: 設計系統文件化

| Task ID | Task Name | Priority | Description | Acceptance Criteria | Dependencies |
|---------|-----------|----------|-------------|---------------------|--------------|
| UI-001-A | Design Token 文件建立 | P1 | 建立 docs/design-system.md | 1. 列出所有 CSS variables<br>2. 標註顏色使用場景<br>3. 提供使用範例 | None |
| UI-001-B | 元件 class 對照表 | P1 | 文件化所有元件 class | 1. 按鈕變體對照表<br>2. 標籤變體對照表<br>3. 警告變體對照表 | None |
| UI-001-C | Typography 規範 | P1 | 字體使用規範文件 | 1. 標題/內文/數值字體使用時機<br>2. 字階規範<br>3. 行高規範 | None |

### UI-002: 響應式斷點檢視

| Task ID | Task Name | Priority | Description | Acceptance Criteria | Dependencies |
|---------|-----------|----------|-------------|---------------------|--------------|
| UI-002-A | 320px 寬度測試 | P1 | 測試 10 個 view 在 320px 寬度 | 1. 所有 view 可正常捲動<br>2. 無水平破版<br>3. 按鈕可點擊（min 44px） | None |
| UI-002-B | 768px 寬度測試 | P1 | 測試 10 個 view 在 768px 寬度 | 1. Sidebar 切換正常<br>2. Grid 布局正確<br>3. 表格可水平捲動 | None |
| UI-002-C | 1440px+ 寬度測試 | P1 | 測試大螢幕顯示 | 1. 內容不過度拉伸<br>2. max-width 限制正常 | None |
| UI-002-D | 破版問題清單 | P1 | 記錄並追蹤所有破版問題 | 1. 建立 issues 清單<br>2. 標註優先級<br>3. 提出修正建議 | UI-002-A~C |

### UI-003: 無資料狀態設計

| Task ID | Task Name | Priority | Description | Acceptance Criteria | Dependencies |
|---------|-----------|----------|-------------|---------------------|--------------|
| UI-003-A | Empty State 元件設計 | P1 | 設計可複用的 empty state 元件 | 1. 支援插圖、標題、說明、CTA 按鈕<br>2. 可配置主題色<br>3. RWD 支援 | None |
| UI-003-B | IR Empty State | P1 | 查驗記錄無資料時顯示 | 1. 顯示「尚無查驗記錄」<br>2. 提供「申請查驗」按鈕 | backend-001 |
| UI-003-C | NCR Empty State | P1 | 缺失記錄無資料時顯示 | 1. 各 kanban 欄位顯示「尚無記錄」<br>2. 維持欄位高度一致 | backend-001 |
| UI-003-D | Material Empty State | P1 | 材料記錄無資料時顯示 | 1. 顯示「尚無進場記錄」<br>2. 提供「進場登記」按鈕 | backend-001 |
| UI-003-E | Docs Empty State | P1 | 文件無資料時顯示 | 1. 顯示「尚無文件」<br>2. 提供「上傳文件」按鈕 | backend-001 |
| UI-003-F | Daily Empty State | P1 | 日報無資料時顯示 | 1. 顯示「尚無施工日報」<br>2. 提供「新增日報」按鈕 | backend-001 |
| UI-003-G | Sub Empty State | P1 | 分包商無資料時顯示 | 1. 顯示「尚無分包商資料」<br>2. 提供「新增合約」按鈕 | backend-001 |
| UI-003-H | Loading State 元件 | P1 | Skeleton/Spinner 元件 | 1. 建立 skeleton shimmer 效果<br>2. 支援 table/card/KPI 格式<br>3. 建立 spinner 元件 | None |
| UI-003-I | Error State 元件 | P1 | Error state 元件 | 1. 支援錯誤圖示、標題、訊息、重試按鈕<br>2. 可配置錯誤類型<br>3. RWD 支援 | None |

### UI-004: 無障礙基礎檢視

| Task ID | Task Name | Priority | Description | Acceptance Criteria | Dependencies |
|---------|-----------|----------|-------------|---------------------|--------------|
| UI-004-A | Color Contrast 檢查 | P2 | 檢查色彩對比度 | 1. 所有文字對比度 >= 4.5:1<br>2. 大文字對比度 >= 3:1<br>3. 記錄不符合項目 | None |
| UI-004-B | Keyboard Navigation | P2 | 鍵盤操作支援 | 1. Tab 順序合理<br>2. Modal 內 focus trap<br>3. Esc 關閉 modal | None |
| UI-004-C | Form Label 檢查 | P2 | 表單 label 正確性 | 1. 所有 input 有對應 label<br>2. 關聯正確（for/id）<br>3. Error message 與 input 關聯 | None |
| UI-004-D | ARIA 屬性補強 | P2 | 新增必要 ARIA 屬性 | 1. Modal 有 role="dialog"、aria-modal<br>2. Button 有 aria-label（icon only）<br>3. Alert 有 role="alert" | None |

### UI-005: 列印樣式支援

| Task ID | Task Name | Priority | Description | Acceptance Criteria | Dependencies |
|---------|-----------|----------|-------------|---------------------|--------------|
| UI-005-A | Morning Meeting 列印樣式 | P2 | 晨會記錄 A4 列印 | 1. 隱藏導航與按鈕<br>2. 調整字體大小適合列印<br>3. 分頁控制 | None |
| UI-005-B | IR 查驗表列印樣式 | P2 | 查驗表列印 | 1. 表格完整顯示<br>2. 簽名欄位留白<br>3. 隱藏互動元素 | None |
| UI-005-C | Daily Report 列印樣式 | P2 | 施工日報列印 | 1. 完整顯示表格與照片位置<br>2. 適合工地存檔 | None |

### UI-006: 深色模式支援

| Task ID | Task Name | Priority | Description | Acceptance Criteria | Dependencies |
|---------|-----------|----------|-------------|---------------------|--------------|
| UI-006-A | CSS Variables 重構 | P2 | 支援 dark/light 主題切換 | 1. 建立 light theme CSS variables<br>2. 使用 data-theme 或 media query 切換 | UI-001 |
| UI-006-B | Theme Toggle 元件 | P2 | 主題切換按鈕 | 1. 放在 topbar<br>2. 儲存偏好至 localStorage<br>3. 切換動畫 | UI-006-A |
| UI-006-C | 圖片適配 | P2 | 確保圖片在 light mode 可見 | 1. 檢查所有圖片對比度<br>2. 必要時提供 light/dark 版本 | UI-006-A |

---

## 元件一致性任務

| Task ID | Task Name | Priority | Description | Acceptance Criteria | Dependencies |
|---------|-----------|----------|-------------|---------------------|--------------|
| COMP-001 | Progress Bar 統一 | P1 | 統一進度條實作 | 1. 建立 `.pb`、`.pf` 標準結構<br>2. 定義顏色 modifier (`.pg`, `.pgr`, `.par`, `.pbl`)<br>3. 移除所有 inline style width | None |
| COMP-002 | Table 樣式統一 | P1 | 統一表格樣式 | 1. 所有 table 包在 `.tw` 容器<br>2. 統一 header/th 樣式<br>3. 統一 td 樣式與 hover 效果 | None |
| COMP-003 | Card Title 統一 | P1 | 統一卡片標題樣式 | 1. 使用 `.ct` class<br>2. 統一 font-size、letter-spacing<br>3. 統一 `.bar` 裝飾線 | None |
| COMP-004 | Form Layout 統一 | P1 | 統一表單布局 | 1. 使用 `.fr`、`.fr2`、`.fr3` grid<br>2. 統一 `.fg`、`.fl`、`.fi` 結構<br>3. 統一 spacing | None |
| COMP-005 | Modal 結構統一 | P1 | 統一 Modal 結構 | 1. `.mo` > `.md` > `.mh` + `.mb` + `.mf`<br>2. 統一 header 結構（icon + title + close）<br>3. 統一 footer 按鈕布局 | None |
| COMP-006 | Inline Style 清理 - Dashboard | P1 | 移除 dashboard.html inline style | 1. 工程分項進度區塊<br>2. KPI 卡片<br>3. Timeline 項目 | COMP-001 |
| COMP-007 | Inline Style 清理 - Safety | P1 | 移除 safety.html inline style | 1. Wizard step indicator<br>2. Checkbox grid<br>3. 表單布局 | W1-008 |
| COMP-008 | Inline Style 清理 - Sub | P1 | 移除 sub.html inline style | 1. 進度條 width<br>2. 其他 style 屬性 | COMP-001 |
| COMP-009 | Alert 統一使用 | P1 | 統一 alert 使用方式 | 1. 使用 `.alert` + `.al-w/d/i/s`<br>2. 不允許純文字 alert<br>3. 統一 icon 使用 | None |

---

## Mobile 優化任務

| Task ID | Task Name | Priority | Description | Acceptance Criteria | Dependencies |
|---------|-----------|----------|-------------|---------------------|--------------|
| MOB-001 | Bottom Nav Active State | P1 | 正確顯示當前 view 的 active 狀態 | 1. 切換 view 時 bottom nav 同步更新<br>2. act class 正確添加/移除<br>3. 圖示與文字顏色變化 | None |
| MOB-002 | Drawer 與 Bottom Nav 同步 | P1 | Drawer 導航後同步更新 bottom nav | 1. 點擊 drawer 項目後，對應 bottom nav item 標為 active<br>2. 正確傳遞 `data-bn-id` | None |
| MOB-003 | Table 水平捲動優化 | P1 | 優化手機版表格體驗 | 1. 顯示 scroll hint（陰影或提示）<br>2. 固定首欄（optional）<br>3. 確保 touch 滑動順暢 | None |
| MOB-004 | Modal Bottom Sheet | P1 | 手機版 Modal 改為 Bottom Sheet | 1. <768px 時 `.mo` align-items: flex-end<br>2. `.md` border-radius: 16px 16px 0 0<br>3. 可下滑關閉（optional） | None |
| MOB-005 | Form 手機版優化 | P1 | 表單欄位手機版布局 | 1. 所有 `.fr2`、`.fr3` 在 mobile 改為單欄<br>2. Input 高度適合 touch（min 44px）<br>3. 虛擬鍵盤不遮擋 input | None |
| MOB-006 | Safety Wizard Mobile 完整測試 | P0 | Safety wizard 手機版完整測試 | 1. Step indicator 正常顯示（W1-006）<br>2. 表單可正常填寫<br>3. 送出按鈕不被鍵盤遮擋<br>4. 照片上傳區域可點擊 | W1-006 |
| MOB-007 | Touch Target Size | P1 | 確保所有互動元素足夠大 | 1. 所有按鈕 >= 44x44px<br>2. Table row 的 action 按鈕間距充足<br>3. Kanban card 可點擊區域完整 | None |

---

## 互動改善任務

| Task ID | Task Name | Priority | Description | Acceptance Criteria | Dependencies |
|---------|-----------|----------|-------------|---------------------|--------------|
| IXN-001 | Toast 位置統一 | P1 | 統一 toast 顯示位置 | 1. Desktop: bottom-right<br>2. Mobile: bottom-center（above bottom nav）<br>3. 不遮擋重要內容 | None |
| IXN-002 | Loading 狀態回饋 | P1 | 非同步操作提供 loading 回饋 | 1. 表單提交時按鈕顯示 spinner<br>2. Modal 載入資料時顯示 skeleton<br>3. 防止重複提交 | FE-001 |
| IXN-003 | Filter Bar Active 狀態 | P1 | Filter bar 正確顯示 active 狀態 | 1. 點擊 filter 後，該按鈕標為 `act` class<br>2. 其他按鈕移除 `act` class<br>3. 應用於 IR、Docs 等 view | None |
| IXN-004 | Dashboard Checklist 狀態持久化 | P2 | 待辦清單狀態儲存 | 1. Checklist 狀態儲存至 localStorage<br>2. 重新整理後保留狀態<br>3. 支援一鍵清除 | None |
| IXN-005 | Modal 開啟時鎖定背景捲動 | P1 | 防止背景捲動 | 1. Modal open 時 `body overflow: hidden`<br>2. Modal close 時恢復<br>3. 手機版同樣生效 | None |
| IXN-006 | Safety Wizard 步驟儲存 | P2 | Wizard 步驟資料暫存 | 1. 切換步驟時保留已填資料<br>2. 取消後重新開始可選擇恢復<br>3. 成功送出後清除 | FE-005 |
| IXN-007 | Confirm Dialog | P1 | 危險操作確認對話框 | 1. 刪除、取消等操作顯示確認<br>2. 使用統一 confirm modal<br>3. 支援鍵盤操作（Enter 確認、Esc 取消） | None |

---

## 視覺精修任務

| Task ID | Task Name | Priority | Description | Acceptance Criteria | Dependencies |
|---------|-----------|----------|-------------|---------------------|--------------|
| VIS-001 | S-CURVE 響應式 | P1 | S-CURVE 圖表響應式優化 | 1. <768px 時可水平捲動或縮放<br>2. 不裁切重要資訊<br>3. 保持比例 | None |
| VIS-002 | Kanban 欄位高度統一 | P1 | 統一 kanban column 高度 | 1. 空欄位顯示 placeholder<br>2. 或統一 min-height<br>3. 視覺上 4 欄對齊 | None |
| VIS-003 | Tag 大小一致性 | P2 | 統一 tag 尺寸 | 1. 所有 `tag` class 統一 padding/font-size<br>2. 不允許 inline style 調整<br>3. 建立 `.tag-sm` 如有需要 | None |
| VIS-004 | Icon 大小統一 | P2 | 統一 icon 使用 | 1. 建立 icon size 規範（s12/s14/s16/s18/s20/s22）<br>2. 統一使用 `.ic` class<br>3. 不允許 inline width/height | None |
| VIS-005 | 陰影與層級統一 | P2 | 統一 shadow 使用 | 1. 建立 shadow variables（如有）<br>2. Card hover shadow 統一<br>3. Modal shadow 統一 | None |
| VIS-006 | 數值字體統一 | P2 | 數值使用 monospace 字體 | 1. 金額、百分比使用 `var(--fm)`<br>2. 檢查所有數值欄位<br>3. 對齊數字（tabular nums） | None |

---

## 文件與規範任務

| Task ID | Task Name | Priority | Description | Acceptance Criteria | Dependencies |
|---------|-----------|----------|-------------|---------------------|--------------|
| DOC-001 | UI/UX Delivery Spec 維護 | P1 | 持續更新本文件 | 1. View 有變更時同步更新<br>2. 新增 view 時補齊分析<br>3. 標記已完成的改善項目 | None |
| DOC-002 | Component Usage Guide | P2 | 元件使用規範 | 1. 每個核心元件的使用說明<br>2. Do's and Don'ts<br>3. 程式碼範例 | UI-001 |
| DOC-003 | RWD Checklist | P2 | 響應式檢查清單 | 1. Breakpoint 對照表<br>2. 各 view 的 RWD 注意事項<br>3. 測試步驟 | UI-002 |

---

## 依賴說明

| Dependency ID | 說明 | 來源 |
|---------------|------|------|
| backend-001 | API 基礎架構完成 | implementation-backlog.md |
| FE-001 | API Client 基礎建設 | implementation-backlog.md |
| FE-003 | Dashboard 資料層重構 | implementation-backlog.md |
| FE-004 | Billing 資料層重構 | implementation-backlog.md |
| FE-005 | Safety 資料層重構 | implementation-backlog.md |

---

## 任務統計

| Priority | 任務數量 | Wave 1 任務 |
|----------|----------|-------------|
| P0 | 9 | 7 |
| P1 | 36 | 3 |
| P2 | 21 | 0 |
| **Total** | **66** | **10** |

---

*文件結束*
