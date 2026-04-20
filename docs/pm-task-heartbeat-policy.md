# PM 任務心跳制度 — Ta Chen PMIS

> **版本**：v2.0  
> **生效日期**：2026-04-15  
> **Workspace**：`/home/beer8/team-workspace/UI-UX`  
> **PM 報告目標**：`discord:1491771769072255208:1493410206351102003`  
> **制度擁有者**：PM（Tiny）  
> **文件性質**：可立即採用的操作政策，非抽象理論  

---

## 1. 心跳制度目的與適用範圍

### 1.1 制度目的

本心跳制度是為了消除以下三種**已在本專案實際發生**的流程事故：

| 事故類型 | 已發生案例 | 根因 |
|----------|-----------|------|
| **任務已做但未回報** | FE-002、FE-004、FE-005、BE-AUTH-SEED-UNBLOCK、BE-314 均已在 repo 完成，但未在 PM thread 正式閉環（參見 `docs/qa/QA-CLOSED-LOOP-RECON-20260415.md`） | 報告送往 QA thread 而非 PM thread；無強制回報節奏 |
| **任務停滯但沒人說** | FE-003 Dashboard 在 blocked 狀態停滯，PM thread 無人追蹤；DB-001~003 因 database 角色未確認阻塞數日 | 無 stale 判定機制，blocked 與 completed 混在同一狀態列表 |
| **跨角色依賴延遲暴露** | BE-002 等待 DB-001、DB 角色未指派、所有 BE P0 任務連鎖阻塞 | 依賴關係只存在文件中，無主動推播或升級路徑 |

**核心原則**：heartbeat = PM 對每個活任務的主動追蹤節奏。任務建立時啟動心跳，依複雜度決定頻率，完成或取消時關閉。不是等代理人回報，而是 PM 主動確認。

### 1.2 適用範圍

**適用**：
- PM 透過 Discord thread 派工的所有任務（UI/UX、FE、BE、DB、DevOps、QA）
- 有 task_id 的任務（對應各任務板：`docs/uiux-task-board.md`、`docs/backend-task-board.md`、`docs/devops-task-board.md`、`docs/tester-task-board.md`）
- 跨角色依賴的任務（如 FE-003 依賴 BE-002）
- P0 與 P1 任務（**強制心跳**）
- P2 任務（**建議啟用**，PM 可視情況決定）

**不適用**：
- 純會議決議（無對應 task_id 的討論）
- 僅資訊分享、不需動作的 thread 消息
- 已閉環的歷史任務

### 1.3 運作基礎

本制度**不引入新工具**，完全基於現有工作流：

| 元件 | 用途 | 現有來源 |
|------|------|---------|
| Discord Thread | PM 與角色代理人溝通的主要管道 | PM report target thread |
| OpenCode CLI | 角色代理人執行任務的指令介面 | `/ulw-loop` 指令 |
| Git Commit Log | 實作進度的客觀證據 | `git log --oneline` |
| Task Board Markdown | 任務狀態的 single source of truth | `docs/*-task-board.md` |
| PM Dispatch Board | PM 派工與路由主控板 | `docs/pm-dispatch-board.md` |

### 1.4 本文件與既有文件的關係

| 既有文件 | 心跳制度如何整合 |
|----------|----------------|
| `docs/pm-dispatch-board.md` | 心跳欄位（見第 6 節）直接加在任務描述中 |
| `docs/uiux-task-board.md` | 表格格式新增 heartbeat 欄位 |
| `docs/backend-task-board.md` | 詳細格式新增 heartbeat 區塊 |
| `docs/implementation-backlog.md` | 依賴關係直接對應 `Waiting on Dep` 狀態 |
| `docs/qa/QA-CLOSED-LOOP-RECON-20260415.md` | 本制度的直接驅動文件，避免相同事故再發 |

---

## 2. 任務複雜度分級模型

### 2.1 複雜度定義

| 複雜度 | 定義 | 典型案例 |
|--------|------|----------|
| **low** | 單一角色、無跨角色依賴、預估 ≤ 1 天完成、驗收標準可直接目視驗證 | CSS 重構、單一元件修改、文件更新 |
| **medium** | 單一角色但有外部依賴、或 2-5 檔修改、或預估 2-4 天完成 | API endpoint 實作、UI state 實作（有依賴）、DB schema 設計 |
| **high** | 多角色協作、6+ 檔修改或新模組、2+ 跨角色依賴、預估 ≥ 5 天、需外部資源（live DB、staging 環境） | Auth API 全流程、Dashboard 整合、跨前後端功能 |

### 2.2 複雜度與優先級交叉判定

複雜度（complexity）與優先級（priority）是**兩個獨立維度**，交叉決定心跳策略：

| | P0（阻擋發布） | P1（必要功能） | P2（增強功能） |
|---|---|---|---|
| **low** | 🟡 高頻追蹤、快速關閉 | 🟢 標準追蹤 | ⚪ 可選追蹤 |
| **medium** | 🔴 高頻追蹤、依賴偵測 | 🟡 標準追蹤、依賴偵測 | 🟢 低頻追蹤 |
| **high** | 🔴 最高頻追蹤、即時升級 | 🔴 高頻追蹤、依賴偵測 | 🟡 標準追蹤 |

**判定規則**：
1. **先定優先級**：看任務是否阻塞其他任務或發布 → P0/P1/P2
2. **再定複雜度**：看跨角色依賴數量與預估工期 → low/medium/high
3. **交叉查表**：得出一組時間策略（見第 3 節）

### 2.3 快速判定流程

```
收到新任務
  ├─ 預估 ≥ 5 天？ ────────→ 是 → high
  ├─ 有 2+ 跨角色依賴？ ──→ 是 → high
  ├─ 需要外部資源？ ──────→ 是 → high
  ├─ 有 1 個跨角色依賴？ ─→ 是 → medium
  ├─ 涉及 2-5 檔修改？ ──→ 是 → medium
  ├─ 預估 2-4 天？ ──────→ 是 → medium
  └─ 其餘 ─────────────→ low
```

### 2.4 本專案實際任務分級範例

| Task ID | 任務名稱 | Priority | Complexity | 交叉結果 | 理由 |
|---------|----------|----------|------------|----------|------|
| W1-008 | Safety Inline Style 重構 | P1 | low | 🟢 標準追蹤 | 單一角色、無依賴、≤ 1 天 |
| BE-002 | Auth API | P0 | high | 🔴 最高頻追蹤、即時升級 | 多層依賴、阻塞 FE-002~005 |
| FE-003 | Dashboard 資料層重構 | P0 | medium | 🔴 高頻追蹤、依賴偵測 | 依賴 BE-002、阻塞 UIUX |
| DB-001 | 確認 Schema 權限 | P0 | low | 🟡 高頻追蹤、快速關閉 | 單一角色但阻塞全線 |
| FE-001 | API Client 基礎建設 | P0 | medium | 🔴 高頻追蹤、依賴偵測 | 阻塞所有 FE 整合任務 |
| W1-007 | Safety Wizard 表單驗證 | P0 | medium | 🔴 高頻追蹤、依賴偵測 | 多檔修改、依賴 FE-005 |

---

## 3. 心跳時間策略

### 3.1 各複雜度對應的完整時間策略

| 參數 | low | medium | high |
|------|-----|--------|------|
| **首次確認時間** | 30 分鐘 | 1 小時 | 2 小時 |
| **心跳頻率** | 每 4 小時 | 每 2 小時 | 每 1 小時 |
| **stale 判定時間** | 8 小時（無有效回應） | 6 小時 | 4 小時 |
| **失聯判定** | stale + 8 小時 | stale + 6 小時 | stale + 4 小時 |
| **升級條件** | P0：stale 時升級；P1/P2：失聯時升級 | P0：stale 時升級；P1：失聯前 ping 2 次 | P0：1 小時無回應即升級；P1：stale 時升級 |

### 3.2 P0 任務加急策略

P0 任務在交叉判定後自動**升級一級**時間策略：

| 交叉結果 | 實際心跳頻率 | 實際 stale 判定 | 實際升級觸發 |
|----------|-------------|----------------|-------------|
| P0 + low | 每 2 小時 | 4 小時 | stale 時通知 Tiny |
| P0 + medium | 每 1 小時 | 3 小時 | stale 前主動確認 |
| P0 + high | 每 30 分鐘 | 2 小時 | 1 小時無回應立即升級 |

### 3.3 時間計算基準

- 所有時間以 **PM 派工訊息送出**為起點計算
- 時區基準：**Asia/Taipei (UTC+8)**
- 非工作時段（22:00–08:00 Taipei）**不計入**心跳時間，clock 自動暫停
- 例：PM 20:00 派工一個 low 任務（首次確認 30 分鐘），實際首次確認時間為隔日 08:30

---

## 4. 任務生命週期

### 4.1 完整狀態定義與轉換圖

```
┌──────────┐
│  Created │  任務已建立，PM 已派工但負責人尚未確認
│  (心跳啟動) │  首次確認時間倒計時開始
└────┬─────┘
     │ 負責人回報「已開始」（在首次確認時間內）
     ▼
┌──────────┐
│ Started  │  負責人已確認接手，開始執行
└────┬─────┘
     │ 提交首次進度
     ▼
┌──────────────┐
│  In Progress │  任務執行中，心跳正常跳動
└──┬───────┬───┘
   │       │
   │       │ 發現需要等待其他角色交付
   │       ▼
   │  ┌────────────────┐
   │  │ Waiting on Dep  │  等待依賴項（標註依賴 task_id）
   │  │  (心跳暫停)      │  每 2 小時檢查依賴狀態
   │  └────┬───────────┘
   │       │ 依賴完成或 PM 協調解鎖
   │       ▼
   │  ┌──────────────┐
   │  │  Unblocked    │  依賴已解除，可繼續執行
   │  └────┬─────────┘
   │       │
   │       │ 遇到無法自行解決的阻塞
   │       ▼
   │  ┌──────────┐
   │  │ Blocked   │  任務受阻（需 PM 協助或外部因素）
   │  │  (升級計時啟動)│  PM 在 1 小時內嘗試解除阻塞
   │  └────┬─────┘
   │       │ PM 協調或阻塞解除
   │       ▼
   │  → In Progress
   │
   │ 執行完成，提交成果
   ▼
┌───────────────────────┐
│  Done (Pending Close) │  成果已提交，但尚未在 PM thread 正式閉環
│  (閉環提醒啟動)         │  每 30 分鐘提醒 PM 確認；4 小時未閉環→標記「回報真空」
└────┬──────────────────┘
     │ PM 在 Discord thread 確認驗收
     ▼
┌───────────┐
│  Closed   │  正式閉環：PM 已確認，任務結束，心跳關閉
└────┬──────┘
     │ 如果有下游任務接棒
     ▼
┌───────────────────┐
│  Handed Off       │  已閉環且有明確下游接棒任務
│  (下游心跳啟動)     │  PM 通知下游角色，啟動新任務心跳
└───────────────────┘
```

### 4.2 每個狀態的心跳行為

| 狀態 | 心跳行為 | PM 動作 |
|------|----------|---------|
| **Created** | 心跳啟動，首次確認倒計時 | 若超過首次確認時間未回應 → PM ping 負責人 |
| **Started** | 心跳正常跳動 | 依心跳頻率追蹤 |
| **In Progress** | 心跳正常跳動 | 依心跳頻率追蹤；stale 時 ping |
| **Waiting on Dep** | 心跳暫停（不計入 stale），但依賴檢查啟動 | 每 2 小時檢查依賴 task_id 的狀態；若依賴方也 stale → 雙重升級 |
| **Blocked** | 心跳暫停，升級計時啟動 | PM 在 1 小時內嘗試解除阻塞；若無法解除 → 通知 Tiny |
| **Done (Pending Close)** | 心跳轉為「閉環提醒」，每 30 分鐘提醒 PM | PM 必須至 thread 確認驗收；超過 4 小時未閉環 → 標記「回報真空」 |
| **Closed** | 心跳關閉 | 無 |
| **Handed Off** | 心跳關閉，下游任務的心跳啟動 | PM 確認下游任務已收到交接 |

### 4.3 狀態轉換規則

| 轉換 | 觸發條件 | PM 必要動作 |
|------|---------|-----------|
| Created → Started | 負責人在首次確認時間內回報「已開始」 | 記錄 `started_at`，開始定期追蹤 |
| Started → In Progress | 負責人首次提交進度回報 | 更新 `last_heartbeat_at` |
| In Progress → Waiting on Dep | 負責人明確標註等待的 task_id 與預計等待時間 | 記錄依賴 task_id，啟動依賴檢查 |
| In Progress → Blocked | 負責人說明阻塞原因與需要的協助 | PM 1 小時內嘗試解除阻塞 |
| Waiting on Dep → Unblocked | 依賴任務完成或 PM 協調解鎖 | 通知負責人恢復執行 |
| Blocked → In Progress | PM 協調或阻塞解除 | 重設 `next_check_at` |
| In Progress → Done (Pending Close) | 負責人提交成果（code commit、文件、測試通過） | PM 比對驗收標準 |
| Done (Pending Close) → Closed | PM 在 Discord thread 確認驗收通過 | 發布閉環確認格式（見第 8 節） |
| Any → Closed（取消） | PM 宣佈任務取消 | 附理由，通知相關角色 |

### 4.4 特殊情況處理

| 情況 | 處理方式 |
|------|---------|
| 負責人中途改派 | PM 在 thread 公開說明原因 → 重設 `started_at`、`first_check_at`、`next_check_at` → 新負責人從 Created 開始 |
| 優先級中途變更 | PM 重新評估複雜度 → 可能調整 `heartbeat_interval` → 更新 task board |
| 任務拆分 | 原任務 Closed（取消/完成部分）→ 新建子任務，各自啟動心跳 |
| 多任務合併 | 所有原任務 Closed → 新建合併任務，啟動心跳 |

---

## 5. Discord PM Thread Closed-Loop 場景處理

### 5.1 場景 A：有心跳但無實質進展

**定義**：負責人按時回報（如「還在進行中」），但連續 2 個心跳週期提交的內容無可量測差異。

**判定標準**：

| 進度指標 | 無進展判定 |
|----------|-----------|
| Git commit | 連續 2 個心跳週期無新 commit（或 commit 不涉及該 task） |
| QA 文件 | 無新文件或文件無實質修改 |
| Task board 狀態 | 狀態欄位無變化 |
| 具體描述 | 「繼續進行中」但無完成百分比或阻礙描述 |

**PM 處理步驟**（逐次遞進）：

1. **第一次無進展心跳**：PM 在 thread 要求負責人提供具體進度描述
   - 要求：完成百分比、已做事項、剩餘工作、阻塞描述
2. **第二次無進展心跳**：PM 要求切分任務為更小單位，或說明是否需要協助
   - 要求：列出「已完成事項」vs「剩餘事項」清單
3. **第三次無進展心跳**：PM 改派或升級給 Tiny，附完整無進展記錄

**防止方式**：每次心跳回報必須包含以下至少一項：
- 具體完成百分比（如「60% → 80%」）
- 新 commit hash 或 PR 連結
- 具體阻礙描述（含預計解決時間）
- 依賴狀態更新

### 5.2 場景 B：已完成但未正式回 PM thread

**定義**：任務成果已存在於 repo 或文件中，但 PM thread 未收到正式閉環確認。

> ⚠️ **這是本專案已發生的實際事故**。參見 `docs/qa/QA-CLOSED-LOOP-RECON-20260415.md`。

**根因分析**（基於實際案例）：

| 根因 | 案例 | 心跳制度防止機制 |
|------|------|----------------|
| 報告送往 QA thread 而非 PM thread | FE-002、FE-004、FE-005 | 強制閉環目標指定規則（見下方） |
| 成果只在 QA 文件中，無 PM thread 連結 | BE-314、BE-AUTH-SEED-UNBLOCK | 閉環時必須附上 repo 證據連結 |
| local completion 未轉為 thread 更新 | BE-314 | Done (Pending Close) 狀態不允許停留逾 4 小時 |
| blocked 與 completed 混在同一狀態列表 | FE-003 | 狀態分離機制（見第 4 節） |

**強制閉環規則**：

1. **不允許**「repo 有 commit 但 thread 無閉環」的狀態存在超過 4 小時
2. **不允許**將 QA 報告視為閉環替代品；QA 報告是證據，PM thread 確認才是閉環
3. **不允許**負責人自行關閉任務；必須由 PM 確認後關閉
4. **每次派工必須包含完成回報要求**：「完成後必須在本 thread 回報，包含：修改檔案清單、Task ID、驗收結果」

**PM 偵測與處理步驟**：

1. **偵測**：每 4 小時比對 `docs/qa/` 新文件與 `git log` 變更，和 PM thread 閉環紀錄交叉比對
2. **發現已完成但未閉環**：PM 在 thread 發布閉環確認消息（格式見第 8 節）
3. **標記**：在任務板標記狀態為 Closed
4. **交接**：如有下游依賴，更新下游任務狀態為 Unblocked 並啟動其心跳
5. **提醒**：向負責人提醒「下次請記得在本 thread 回報完成」

### 5.3 場景 C：任務停滯但未聲明阻塞

**定義**：負責人遇到阻塞（依賴缺失、技術困難、權限問題），但未在 Discord thread 中正式宣告 Blocked。

**偵測指標**：

| 指標 | 判定方式 | 閾值 |
|------|---------|------|
| 回應漸趨模糊 | 回覆含「在看了」「快了」「研究中」但無具體進度 | 2 次連續 |
| Git commit 減少 | 近期 commit 頻率明顯下降 | 與前一期比較 |
| 開始詢問依賴問題 | Thread 中出現「需要 XXX 才能繼續」但未標記 blocked | 1 次即警覺 |
| 驗收標準無進展 | 已過半 `closure_target` 時間但 AC 無一通過 | closure_target 的 50% |

**PM 處理步驟**：

1. 主動詢問：「是否有阻塞？如有，請宣告 ⚠️ blocked 並說明所需資源。」
2. 幫助負責人明確描述阻塞原因（依賴哪個上游 task_id？缺少什麼資源？）
3. 跨角色協調：
   - 若為上游依賴阻塞 → 通知上游角色加速或 parallel workaround
   - 若為外部資源阻塞 → 評估是否可先以 mock/stub 替代（如 BE-002 可先用 local postgres）
   - 若為權限問題 → 通知 Tiny 解決
4. 在 task board 更新為 ⚠️ blocked + 記錄阻塞原因

---

## 6. 與現有 PM 任務格式整合的欄位建議

### 6.1 心跳欄位定義

以下欄位應加入每個 PM 派工的任務描述中：

| 欄位名 | 必填 | 類型 | 說明 | 範例 |
|--------|------|------|------|------|
| `task_id` | ✅ | string | 任務唯一識別碼（對應現有 task board） | `BE-002` |
| `owner` | ✅ | string | 負責人/角色 | `@backend` |
| `priority` | ✅ | enum | 任務優先級 | `P0` |
| `complexity` | ✅ | enum | 任務複雜度 | `medium` |
| `started_at` | ✅ | datetime | PM 派工時間（ISO 8601） | `2026-04-15T10:00:00+08:00` |
| `heartbeat_interval` | ✅ | string | 心跳頻率 | `PT2H`（每 2 小時） |
| `next_check_at` | ✅ | datetime | 下一次 PM 檢查時間 | `2026-04-15T12:00:00+08:00` |
| `stale_after` | ✅ | string | stale 判定時間 | `PT6H`（6 小時無回應） |
| `closure_target` | ✅ | datetime | 預期完成時間 | `2026-04-16T18:00:00+08:00` |
| `closure_status` | ✅ | enum | 閉環狀態 | `open` / `pending_close` / `closed` |
| `escalation_rule` | ✅ | string | 升級規則 | `stale → ping owner → 2nd stale → notify Tiny` |

### 6.2 與現有任務板對應關係

| 現有任務板欄位 | 心跳欄位映射 | 備註 |
|----------------|-------------|------|
| Task ID | `task_id` | 直接對應 |
| 負責人/角色 | `owner` | 直接對應 |
| Priority | `priority` | 直接對應 |
| Dependencies | 透過 `Waiting on Dep` 狀態追蹤 | 新增依賴 task_id |
| Acceptance Criteria | `closure_target` 的一部分 | 完成時間 + 驗收標準 |
| Status（現有為中文描述） | `closure_status` | 新增結構化狀態 |

### 6.3 現有中文狀態對應

| 現有中文狀態 | 心跳生命週期狀態 | Emoji |
|-------------|----------------|-------|
| 🟡 進行中 | `In Progress` | 🟢 active |
| ⚠️ 阻塞 | `Blocked` | ⚠️ blocked |
| ✅ 完成 | `Done (Pending Close)` → `Closed` | ✅ completed |
| ❌ 未開始 | 不適用（心跳尚未啟動） | ⏳ not started |
| 🔄 等待依賴 | `Waiting on Dep` | 🔄 waiting |

---

## 7. PM 操作 SOP

### 7.1 派工後多久檢查

| 複雜度 | 首次檢查時間 | 後續檢查頻率 |
|--------|------------|-------------|
| low | 派工後 **30 分鐘** | 每 **4 小時** |
| medium | 派工後 **1 小時** | 每 **2 小時** |
| high | 派工後 **2 小時** | 每 **1 小時** |

**P0 加急**：首次檢查時間減半，後續頻率加倍。例如 P0+low：15 分鐘首次，每 2 小時後續。

### 7.2 如何補 ping

**補 ping 觸發條件**：

| 觸發 | 動作 | 訊息內容 |
|------|------|---------|
| 超過首次確認時間未回應 | 在 Discord thread ping | 「@[owner] 請確認已開始 [task_id]，目前首次確認時間已過。」 |
| stale 判定時間到達 | 在 Discord thread ping + 標記 stale | 「@[owner] [task_id] 已 stale（[時長]無回應），請回報進度或說明阻礙。」 |
| 連續 2 次心跳無實質進展 | 在 Discord thread ping | 「@[owner] [task_id] 連續 2 次心跳無實質進展，請提供具體完成百分比或阻礙描述。」 |

**補 ping 格式**（Discord thread）：

```
🔔 HEARTBEAT CHECK: [task_id] [task_name]
Status: [生命週期狀態]
Expected: [預期進度描述]
Last response: [上次回應時間]
Stale for: [已 stale 時長]
Action needed: [需要的動作]
Next check: [下次檢查時間]
```

### 7.3 何時改派

| 情況 | 改派條件 | 改派動作 |
|------|---------|---------|
| **失聯** | 超過 stale + 失聯判定時間仍無回應 | PM 重新指派負責人並重啟心跳 |
| **連續無進展** | 3 次心跳均無實質進展 | PM 與 Tiny 討論後改派或拆分任務 |
| **能力不符** | 負責人明確表示無法完成 | PM 安排其他角色接手，附交接說明 |
| **阻塞無解** | Blocked 狀態超過 8 小時且無進展 | PM 協調資源或調整範圍 |

改派時必須：
1. 在 Discord thread 中公開說明改派原因
2. 更新 task board 的 owner 欄位
3. 重設對應的心跳時間欄位
4. 通知新負責人接單（等待首次確認）

### 7.4 何時通知 Tiny

| 情況 | 通知條件 | 通知方式 |
|------|---------|---------|
| P0 任務 stale | 任何 P0 任務進入 stale 狀態 | 立即在 PM thread @Tiny |
| P0 任務失聯 | P0 任務失聯（stale + 失聯判定時間） | 立即私訊 Tiny + PM thread 標記 |
| 跨角色依賴阻塞 | 2 個以上下游任務因同一依賴阻塞 | PM thread 標記，附受影響任務清單 |
| 重大風險 | 3 個以上 P0 任務同時 stale 或 blocked | 立即私訊 Tiny + 啟動緊急會議 |

通知 Tiny 的格式：

```
🚨 ESCALATION: [task_id] [任務名稱]
觸發條件：[stale / 失聯 / 連續無進展 / 跨角色依賴阻塞]
已持續時間：[時長]
嘗試聯繫次數：[次數]
影響範圍：[受影響的下游 task_id 清單]
目前狀態：[描述]
需要 Tiny 決策：[具體問題]
```

### 7.5 何時不應打擾 Tiny

| 情況 | 為什麼不通知 | 正確做法 |
|------|------------|---------|
| P1/P2 任務 stale | 非阻塞發布 | PM 自行處理，按 SOP 補 ping |
| 負責人已回報進度但未完成 | 進度正常 | 依心跳頻率追蹤 |
| 依賴已知且已排程 | 非新風險 | 在 Waiting on Dep 狀態下持續追蹤 |
| 任務已 Done (Pending Close) | 待 PM 自身確認 | PM 盡快確認驗收，4 小時內閉環 |
| 單一 P0 stale 且已有改派計畫 | PM 可自行處理 | 執行改派並記錄 |
| 負責人宣告休息/離線 | 尊重 off-hours | 調整 `next_check_at` 到上班時間 |
| PM 正在協調中的阻塞 | 給 PM 時間處理 | 1 小時內無法解決再通知 |

---

## 8. 可直接複製的 Markdown 任務模板

### 8.1 完整任務派工模板

> 複製後填寫所有 `[填寫]` 欄位即可使用。這是 PM 每次派工時的必用模板。

```markdown
## 任務派工：[task_id] [任務名稱]

### 基本資訊

| 欄位 | 值 |
|------|-----|
| task_id | [填寫，如 BE-002] |
| 任務名稱 | [填寫] |
| owner | @[填寫角色/人員，如 @backend] |
| priority | [P0 / P1 / P2] |
| complexity | [low / medium / high] |
| 依賴項目 | [填寫依賴的 task_id，如 DB-001；無填「無」] |
| 驗收標準 | [填寫，從任務板複製] |

### 心跳設定

| 欄位 | 值 |
|------|-----|
| started_at | [填寫派工時間，如 2026-04-15T10:00:00+08:00] |
| heartbeat_interval | [依複雜度填寫：low=PT4H / medium=PT2H / high=PT1H] |
| next_check_at | [started_at + heartbeat_interval] |
| stale_after | [依複雜度填寫：low=PT8H / medium=PT6H / high=PT4H] |
| closure_target | [填寫預期完成時間] |
| closure_status | open |
| escalation_rule | [依交叉判定填寫，如：stale → ping owner → 2nd stale → notify Tiny] |

### 心跳追蹤紀錄

| 時間 | 狀態 | 進度描述 | PM 備註 |
|------|------|----------|---------|
| [started_at] | Created | 等待確認 | — |

---

###進度回報格式（供 owner 使用）

```
📋 進度回報：[task_id]
狀態：[In Progress / Waiting on Dep / Blocked / Done]
完成百分比：[0-100%]
本次完成項目：
- [具體完成事項]
阻礙或依賴：
- [描述，含預計解決時間；無填「無」]
下次預計回報時間：[ISO 8601]
```

### 閉環確認格式（供 PM 使用）

```
✅ CLOSED: [task_id] [任務名稱]
Evidence:
- [commit hash / 文件路徑 / 測試結果]
- [QA 報告路徑（如有）]
Date: [YYYY-MM-DD HH:MM Asia/Taipei]
Closed by: PM (Tiny)
下游接棒：[task_id（如有）；無填「無」]
```

### 升級通知格式（供 PM 使用）

```
🚨 ESCALATION: [task_id] [任務名稱]
觸發條件：[stale / 失聯 / 連續無進展 / 跨角色依賴阻塞]
已持續時間：[時長]
嘗試聯繫次數：[次數]
影響範圍：[受影響的下游 task_id 清單]
目前狀態：[描述]
需要 Tiny 決策：[具體問題]
```
```

### 8.2 填寫範例：BE-002 身份驗證 API

```markdown
## 任務派工：BE-002 身份驗證 API

### 基本資訊

| 欄位 | 值 |
|------|-----|
| task_id | BE-002 |
| 任務名稱 | 身份驗證 API |
| owner | @backend |
| priority | P0 |
| complexity | high |
| 依賴項目 | DB-001, BE-001 |
| 驗收標準 | 1. POST /api/v1/auth/login 回傳 access_token + httpOnly refresh_token / 2. POST /api/v1/auth/logout 清除 refresh_token / 3. POST /api/v1/auth refresh Token 輪換 / 4. GET /api/v1/auth/me 回傳當前使用者 / 5. JWT middleware 保護受權路由 / 6. bcrypt cost factor ≥ 10 / 7. Login 失敗 5 次鎖定 15 分鐘 |

### 心跳設定

| 欄位 | 值 |
|------|-----|
| started_at | 2026-04-16T09:00:00+08:00 |
| heartbeat_interval | PT1H |
| next_check_at | 2026-04-16T10:00:00+08:00 |
| stale_after | PT4H |
| closure_target | 2026-04-21T18:00:00+08:00 |
| closure_status | open |
| escalation_rule | 1h 無回應 → ping owner → stale → 立即通知 Tiny |

### 心跳追蹤紀錄

| 時間 | 狀態 | 進度描述 | PM 備註 |
|------|------|----------|---------|
| 2026-04-16T09:00 | Created | 等待確認 | — |
```

### 8.3 快速派工檢查清單（PM 每次派工必用）

```
□ 已判定任務優先級（P0/P1/P2）
□ 已判定任務複雜度（low/medium/high）
□ 已交叉查表確認心跳策略
□ 已設定 heartbeat_interval
□ 已計算 next_check_at（派工時間 + heartbeat_interval）
□ 已計算 stale_after
□ 已設定 closure_target（依預估工時）
□ 已設定 escalation_rule
□ 已在 Discord thread 發布任務，含完成回報要求：
  「完成後必須在本 thread 回報，包含：修改檔案清單、Task ID、驗收結果」
□ 已在 task board 更新所有心跳欄位
□ 已記錄依賴關係（如有下游依賴，完成後需啟動 handoff 心跳）
```

---

## 9. 手動操作 vs. 未來自動化候選

### 9.1 目前可手動執行的步驟（立即適用）

| 步驟 | 執行者 | 工具 | 頻率 |
|------|--------|------|------|
| 建立任務、填寫心跳欄位 | PM | Discord thread + 複製第 8 節模板 | 每次派工 |
| 首次確認檢查 | PM | Discord thread 查看 | 依首次確認時間 |
| 心跳追蹤紀錄維護 | PM | Discord thread 編輯 | 每個心跳週期 |
| stale 判定與補 ping | PM | Discord 發送訊息（用第 7.2 節格式） | 依 stale 判定時間 |
| 進度回報 | 負責人 | Discord thread 回覆（用進度回報格式） | 每個心跳週期 |
| 閉環確認 | PM | Discord thread 發送確認格式 | 任務完成時 |
| 升級通知 | PM | Discord @Tiny（用升級通知格式） | 依升級條件 |
| 比對 QA 文件與 PM thread | PM | 手動比對 `docs/qa/` 與 thread | 每 4 小時 |
| 任務狀態更新（任務板） | PM | 編輯 `docs/*.md` 任務板 | 每次狀態變更 |
| Git 進度檢查 | PM | `git log --since="..." --oneline` | 每個心跳週期 |

### 9.2 未來自動化候選（目前不可用，標記為候選）

以下步驟目前需手動執行，但具備自動化潛力。在自動化實現之前，PM 須手動執行，**不得跳過**。

| 步驟 | 自動化候選方案 | 前置條件 | 優先級 | 目前替代 |
|------|---------------|---------|--------|---------|
| 心跳時間到達時自動提醒 PM | Discord Bot 定時發送 heartbeat check 訊息 | Discord Bot 開發與部署 | P2 | PM 手動檢查 |
| stale 自動判定與 ping | Bot 比對 `next_check_at` 與 `stale_after` 自動標記 | 心跳欄位結構化儲存（DB 或 JSON） | P1 | PM 手動比對 |
| QA 文件與 PM thread 自動比對 | 腳本掃描 `docs/qa/` 新文件與 thread 閉環紀錄，產出差異報告 | 結構化任務追蹤系統 | P1 | PM 每 4 小時手動比對 |
| 任務板狀態自動同步 | Bot 讀取 thread 狀態更新任務板 markdown | 任務板格式標準化 + Bot 读写 | P2 | PM 手動編輯 markdown |
| 升級通知自動化 | 超過升級條件時自動 @Tiny | Discord Bot + 心跳追蹤系統 | P1 | PM 手動發送 |
| 心跳欄位結構化儲存 | 從 Discord thread 格式遷移至資料庫 | 資料庫設計與部署 | P2 | Discord thread + markdown |
| 依賴圖自動視覺化 | 從任務依賴欄位自動生成依賴圖 | 結構化儲存 + 視覺化工具 | P2 | 手動追蹤 |
| git commit 自動偵測 | CI webhook 自動偵測相關 commit | GitHub Actions webhook | P2 | PM 手動 `git log` |

### 9.3 當前建議的最低手動流程

**PM 每日操作清單**（預估 30–45 分鐘/天）：

```
08:00  □ 開工檢查：查看所有活任務的 next_check_at
         → 對已到期的任務執行心跳檢查
         
每2h   □ 心跳週期：依任務複雜度對活任務執行追蹤
         → low 每 4h、medium 每 2h、high 每 1h
         
即時   □ 升級處理：收到升級條件觸發時立即處理
         
18:00  □ 收工巡檢：比對當日 git log 與 docs/qa/ 新文件
         → 與 PM thread 閉環狀態交叉比對
         → 處理「已做未報」項目
         
每週一 09:00 □ 週報：彙整上週所有任務心跳紀錄
              → 產生週報（完成數、stale 數、改派數、平均閉環時間）
```

---

## 附錄 A：本專案既有事故的心跳回溯分析

以下為 2026-04-15 QA closed-loop reconciliation 中識別的任務，若心跳制度已運作，其處理方式：

| Task ID | 實際事故 | 心跳制度下的預期處理 |
|---------|----------|---------------------|
| FE-002 | 完成但報告送往 QA thread 而非 PM thread | Done (Pending Close) 狀態會在 4 小時內被 PM 比對偵測，PM 會至 PM thread 發布閉環確認 |
| FE-004 | 完成但無 PM thread 閉環 | 同上；心跳追蹤會確保 PM 知道任務已完成 |
| FE-005 | 完成（有限制）但未正式回報 PM | 同上；限制會在心跳回報中明確記錄 |
| BE-314 | local commit 完成但未轉為 thread 更新 | 心跳追蹤會在 stale 判定時間內發現「無回應」，PM 主動詢問後取得 commit hash 並閉環 |
| FE-003 | blocked 但無人追蹤 | Blocked 狀態會在 1 小時內被 PM 處理，升級至 Tiny 協調依賴 |

---

## 附錄 B：複雜度速查表

| 任務類型 | 典型複雜度 | 心跳頻率 | stale 時間 | 升級規則 |
|----------|-----------|---------|-----------|---------|
| CSS 修改、文件更新 | low | 4h | 8h | stale → ping → 失聯 → 通知 Tiny |
| 單一 API endpoint | medium | 2h | 6h | stale → ping → 2nd stale → 通知 Tiny |
| UI state 實作（有依賴） | medium | 2h | 6h | stale → ping + 檢查依賴 → 2nd stale → 通知 Tiny |
| DB schema 設計 | medium | 2h | 6h | stale → ping → 2nd stale → 通知 Tiny |
| Auth API 全流程 | high | 1h | 4h | 1h 無回應 → ping → stale → 立即通知 Tiny |
| Dashboard 整合（多角色） | high | 1h | 4h | 1h 無回應 → ping → stale → 立即通知 Tiny |
| 跨前後端功能 | high | 1h | 4h | 1h 無回應 → ping → stale → 立即通知 Tiny |

## 附錄 C：P0 任務加急速查表

| P0 任務 | 複雜度 | 實際心跳頻率 | 實際 stale | 升級觸發 |
|---------|--------|------------|----------|---------|
| 單一元件 hotfix | P0+low | 2h | 4h | stale 時通知 Tiny |
| API 單一 endpoint | P0+medium | 1h | 3h | stale 前主動確認 |
| Auth / Dashboard 多角色 | P0+high | 30min | 2h | 1h 無回應立即升級 |

## 附錄 D：角色 Discord ID 速查表

| 角色 | Discord Role ID | 心跳預設通道 | 備註 |
|------|----------------|------------|------|
| @uiux | `1487650665151987744` | PM thread | ✅ 可用 |
| @database | `1493421404354514974` | PM thread | ⚠️ 角色待確認，與 tester 衝突 |
| @backend | `1491771733709947000` | PM thread | ✅ 可用 |
| @tester | `1491771710322511892` | PM thread | ⚠️ 與 database 角色衝突 |
| @devops | `1491959742443290786` | PM thread | ✅ 可用 |
| **PM** | — | `discord:1491771769072255208:1493410206351102003` | 回報目標 |

> ⚠️ **已知問題**：Discord Role ID `1491771710322511892` 同時被標記為 database 和 tester。PM 需在派發 DB 任務前先確認正確的角色映射（參見 `docs/pm-dispatch-board.md`）。

---

*文件結束 — PM 任務心跳制度 v2.0*  
*下次修訂：依據實際運作回饋調整時間策略與流程，建議運行 2 個 Sprint 後（約 2026-04-29）檢視心跳頻率是否需要調整*