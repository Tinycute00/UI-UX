# OpenCode Executable Model Whitelist Matrix

**Version:** 1.0  
**Effective Date:** 2026-04-15  
**Owner:** Engineering Team / PM  
**Review Cycle:** After each runtime validation round, or monthly  
**Companion Policy:** `docs/opencode-model-selection-policy.md`

> **核心原則**：優先嘗試高端模型 (Tier P0)，但必須嚴格建立在已驗證的 runtime 事實上。高端模型連續失敗 2 次後，立即切換到穩定中階模型 (Tier P2)。

---

## 1. Tier 分類總覽

### Tier P0 — Premium Exploratory（高端探索型，不穩定）

高能力模型，**不保證每次可用**。作為首選嘗試對象，但必須有回退計畫。

| Model | Full ID | Runtime Evidence | Constraint |
|-------|---------|-------------------|------------|
| Claude Opus 4.6 | `github-copilot/claude-opus-4.6` | /ulw-loop: 1 success / 1 not_supported; ulw-loop: 2 not_supported | 極不穩定，僅供 exploratory 嘗試 |
| Claude Opus 4.5 | `github-copilot/claude-opus-4.5` | /ulw-loop: 1 success / 1 forbidden; ulw-loop: 2 forbidden | TOS/permission 風險高，僅供 exploratory |
| GPT-5.4 | `github-copilot/gpt-5.4` | /ulw-loop: 2 not_supported; ulw-loop: 1 success / 1 not_supported | 高端但不穩定 |
| GPT-5.2 | `github-copilot/gpt-5.2` | /ulw-loop: 1 success / 1 forbidden; ulw-loop: 1 success / 1 forbidden | 可用但有 forbidden 風險 |
| GPT-5.1 | `github-copilot/gpt-5.1` | /ulw-loop: 1 success / 1 forbidden; ulw-loop: 2 success | Premium-general 中相對較佳，仍非穩定保證 |
| Gemini 3.1 Pro Preview | `github-copilot/gemini-3.1-pro-preview` | /ulw-loop: 1 success / 1 not_supported; ulw-loop: 1 success / 1 not_supported | 前端高端模型可嘗試，但屬 unstable |
| Gemini 2.5 Pro | `github-copilot/gemini-2.5-pro` | /ulw-loop: 1 success / 1 forbidden; ulw-loop: 1 success / 1 forbidden | 前端高端模型可嘗試，有 forbidden 風險 |

### Tier P1 — Upper-Mid Fallback（中高階回退，有約束條件）

| Model | Full ID | Runtime Evidence | Constraint |
|-------|---------|-------------------|------------|
| Claude Sonnet 4.6 | `github-copilot/claude-sonnet-4.6` | /ulw-loop: 2/2 success; ulw-loop: 2/2 not_supported | **⚠️ PREFIX-SENSITIVE：只建議 `/ulw-loop` 路徑，`ulw-loop` 不可用** |

### Tier P2 — Stable Mid-Tier Default（穩定中階預設）

全部 4/4 success（/ulw-loop 2/2 + ulw-loop 2/2），作為可靠回退基盤。

| Model | Full ID | Runtime Evidence | Role |
|-------|---------|-------------------|------|
| GLM-5.1 | `opencode-go/glm-5.1` | /ulw-loop: 2/2 success; ulw-loop: 2/2 success | 穩定中階通用主力 |
| Kimi K2.5 | `opencode-go/kimi-k2.5` | /ulw-loop: 2/2 success; ulw-loop: 2/2 success | 穩定中階分析/長文主力 |
| Mimo V2 Pro | `opencode-go/mimo-v2-pro` | /ulw-loop: 2/2 success; ulw-loop: 2/2 success | 穩定中階實作主力 |
| Minimax M2.7 | `opencode-go/minimax-m2.7` | /ulw-loop: 2/2 success; ulw-loop: 2/2 success | 穩定中階快速/低成本主力 |

---

## 2. 依任務類型的嘗試順序表

以下每張表定義特定任務類型的「嘗試順序」：第一嘗試 → 第二嘗試 → 穩定回退。

**通用規則**：任何 P0 模型連續失敗 2 次（跨不同模型也算），停止 premium 重試，切換 P2。

---

### 2.1 高推理 / 架構 (High Reasoning / Architecture)

適用：系統重構規劃、架構決策、關鍵演算法設計、生產問題根因分析

| Priority | Model | Tier | Command Prefix | Notes |
|----------|-------|------|----------------|-------|
| 1st try | `github-copilot/claude-opus-4.6` | P0 | `/ulw-loop` preferred | 高推理首選；若 not_supported → try next |
| 2nd try | `github-copilot/gpt-5.4` | P0 | `/ulw-loop` preferred | 次選高端；若 not_supported → try next |
| 3rd try | `github-copilot/gpt-5.1` | P0 | Either | Premium-general 中最穩定者 |
| **Stable fallback** | `opencode-go/mimo-v2-pro` | P2 | Either | 連續 2 次 P0 失敗後切換至此 |

**停止 Premium 重試條件**：Claude Opus 4.6 → not_supported，GPT-5.4 → not_supported → 直接切 P2。

---

### 2.2 一般實作 (General Implementation)

適用：功能開發、API 設計、程式碼審查、Bug 修復、測試撰寫

| Priority | Model | Tier | Command Prefix | Notes |
|----------|-------|------|----------------|-------|
| 1st try | `github-copilot/gpt-5.1` | P0 | Either | Premium-general 中最穩定 |
| 2nd try | `github-copilot/gpt-5.2` | P0 | Either | 若 forbidden → 跳至 fallback |
| **Stable fallback** | `opencode-go/glm-5.1` | P2 | Either | 連續 2 次 P0 失敗後切換至此 |

**停止 Premium 重試條件**：GPT-5.1 失敗 + GPT-5.2 forbidden → 直接切 P2。

---

### 2.3 前端 / UI / 高發想 (Frontend / UI / High Creativity)

適用：UI 概念發想、頁面切版、RWD 實作、CSS 動畫、設計系統維護、互動設計

| Priority | Model | Tier | Command Prefix | Notes |
|----------|-------|------|----------------|-------|
| 1st try | `github-copilot/gemini-3.1-pro-preview` | P0 | Either | 前端高發想首選 |
| 2nd try | `github-copilot/gemini-2.5-pro` | P0 | Either | 若 forbidden → try Sonnet |
| 3rd try | `github-copilot/claude-sonnet-4.6` | P1 | **`/ulw-loop` ONLY** | ⚠️ 必須使用 `/ulw-loop`（含斜線） |
| **Stable fallback** | `opencode-go/minimax-m2.7` | P2 | Either | 連續 2 次 P0/P1 失敗後切換至此 |

**停止 Premium 重試條件**：Gemini 3.1 not_supported + Gemini 2.5 forbidden → 嘗試 Claude Sonnet 4.6（限 `/ulw-loop`）→ 若仍失敗 → 切 P2。

---

### 2.4 長文分析 / 資料查詢 (Long-Document Analysis / Data Query)

適用：長文規格比對、文件交叉核對、Source-of-truth 驗證、跨文件查詢整理

| Priority | Model | Tier | Command Prefix | Notes |
|----------|-------|------|----------------|-------|
| 1st try | `github-copilot/claude-opus-4.6` | P0 | `/ulw-loop` preferred | 深度分析能力最強 |
| 2nd try | `github-copilot/claude-sonnet-4.6` | P1 | **`/ulw-loop` ONLY** | ⚠️ 必須使用 `/ulw-loop`（含斜線） |
| **Stable fallback** | `opencode-go/kimi-k2.5` | P2 | Either | 專職長文/分析穩定主力 |

**停止 Premium 重試條件**：Claude Opus 4.6 not_supported → 嘗試 Claude Sonnet 4.6（限 `/ulw-loop`）→ 若仍失敗 → 切 P2 Kimi K2.5。

---

### 2.5 快速迭代 / 低成本 (Fast Iteration / Low Cost)

適用：樣式微調、簡單腳本、大量批次處理、低優先任務

| Priority | Model | Tier | Command Prefix | Notes |
|----------|-------|------|----------------|-------|
| 1st try | `github-copilot/gpt-5.1` | P0 | Either | 若 premium 可用就用 |
| **Stable fallback** | `opencode-go/minimax-m2.7` | P2 | Either | 成本敏感任務的穩定預設 |

**停止 Premium 重試條件**：GPT-5.1 單次失敗即切 P2（低成本任務不值得多次重試）。

---

## 3. Prefix 規則

### 3.1 團隊標準前綴

- 團隊標準前綴仍為 **`ulw-loop`**（不含斜線）
- 但部分 Copilot 模型對 `/ulw-loop`（含斜線）與 `ulw-loop`（不含斜線）有**敏感性差異**

### 3.2 前綴適用規則

| Model Tier | 建議 Prefix | 說明 |
|------------|-------------|------|
| Tier P0 | 優先 `/ulw-loop`，失敗改 `ulw-loop` | 兩種 prefix 都可能遇到 not_supported/forbidden |
| **Tier P1 (Claude Sonnet 4.6)** | **僅 `/ulw-loop`** | ⚠️ `ulw-loop` 必定 not_supported |
| Tier P2 | Either（兩者皆穩定） | `/ulw-loop` 或 `ulw-loop` 均可 |

### 3.3 Claude Sonnet 4.6 前綴條件（強制）

`github-copilot/claude-sonnet-4.6` 為 **prefix-sensitive** 模型：

- ✅ `/ulw-loop`（含斜線）= 2/2 success
- ❌ `ulw-loop`（不含斜線）= 2/2 not_supported

**任何任務若選用 Claude Sonnet 4.6，必須使用 `/ulw-loop` 前綴。**

### 3.4 正確命令範例

```bash
# Claude Sonnet 4.6 — 必須用 /ulw-loop（PREFIX-SENSITIVE）
opencode run '/ulw-loop
目標：[任務描述]

[模型選擇策略]
- 主選：github-copilot/claude-sonnet-4.6 (P1, prefix-sensitive)
- 穩定回退：opencode-go/glm-5.1 (P2)
' --workdir /home/beer8/team-workspace/UI-UX

# Tier P2 穩定模型 — 兩種 prefix 皆可
opencode run 'ulw-loop
目標：[任務描述]

[模型選擇策略]
- 主選：opencode-go/glm-5.1 (P2 stable)
' --workdir /home/beer8/team-workspace/UI-UX

# Tier P0 Premium 嘗試 — 優先 /ulw-loop
opencode run '/ulw-loop
目標：[任務描述]

[模型選擇策略]
- 1st try：github-copilot/claude-opus-4.6 (P0 exploratory)
- 2nd try：github-copilot/gpt-5.4 (P0 exploratory)
- Stable fallback：opencode-go/mimo-v2-pro (P2)
' --workdir /home/beer8/team-workspace/UI-UX
```

---

## 4. Premium-First Fallback 決策流程

```
Step 1: 嘗試 Tier P0 模型（使用 /ulw-loop prefix）
  ├── SUCCESS → 使用結果
  └── FAIL (not_supported / forbidden / error)
      ├── Step 2: 換另一個 Tier P0 模型（按 try-order 表順序）
      │   ├── SUCCESS → 使用結果
      │   └── FAIL → 累計 1 次 P0 失敗
      │       ├── Step 2b: 再嘗試下一個 P0 模型
      │       │   ├── SUCCESS → 使用結果
      │       │   └── FAIL → 累計 2 次 P0 失敗
      │       │       └── Step 3: 立即切換 Tier P2 穩定模型
      │       │           └── SUCCESS → 使用結果，標記「premium fallback」
      └── 若嘗試 Claude Sonnet 4.6 (P1)
          ├── 確保使用 /ulw-loop prefix
          ├── SUCCESS → 使用結果
          └── FAIL → 計入失敗次數，若累計 2 次則切 P2

停止條件：累計 2 次 P0/P1 失敗 → 停止 premium 重試，切換 P2。
例外：低成本任務（Section 2.5）P0 單次失敗即切 P2。
```

### 快速決策表

| 情境 | 動作 |
|------|------|
| P0 模型第 1 次成功 | ✅ 使用結果 |
| P0 模型第 1 次失敗 | 嘗試下一個 P0 模型 |
| P0 模型連續 2 次失敗 | 🛑 停止 premium，切 P2 |
| P1 (Claude Sonnet 4.6) 失敗 | 確認 prefix 為 `/ulw-loop`；若已正確仍失敗 → 計入失敗 |
| 所有 P0+P1 都失敗 | 使用 P2 對應任務類型的穩定預設 |
| 快速迭代/低成本任務 | P0 單次失敗即切 P2（不值得多次重試） |

---

## 5. Runtime Evidence Appendix（完整測試結果）

以下為 2026-04-15 實測的完整結果，為本文件所有分類的唯一依據。

### 5.1 Premium / Copilot 候選

| Model | Full ID | /ulw-loop 結果 | ulw-loop 結果 | 結論 |
|-------|---------|----------------|---------------|------|
| Claude Opus 4.6 | `github-copilot/claude-opus-4.6` | 1 success / 1 not_supported | 2 not_supported | 極不穩定 → Tier P0 exploratory |
| Claude Opus 4.5 | `github-copilot/claude-opus-4.5` | 1 success / 1 forbidden | 2 forbidden | TOS/permission 風險 → Tier P0 exploratory |
| GPT-5.4 | `github-copilot/gpt-5.4` | 2 not_supported | 1 success / 1 not_supported | 高端但不穩定 → Tier P0 exploratory |
| GPT-5.2 | `github-copilot/gpt-5.2` | 1 success / 1 forbidden | 1 success / 1 forbidden | 可用但 forbidden 風險 → Tier P0 exploratory |
| GPT-5.1 | `github-copilot/gpt-5.1` | 1 success / 1 forbidden | 2 success | Premium-general 最佳 → Tier P0 exploratory |
| Gemini 3.1 Pro Preview | `github-copilot/gemini-3.1-pro-preview` | 1 success / 1 not_supported | 1 success / 1 not_supported | 前端高端 → Tier P0 exploratory |
| Gemini 2.5 Pro | `github-copilot/gemini-2.5-pro` | 1 success / 1 forbidden | 1 success / 1 forbidden | 前端高端 + forbidden → Tier P0 exploratory |
| Claude Sonnet 4.6 | `github-copilot/claude-sonnet-4.6` | **2 success** | 2 not_supported | /ulw-loop 穩定 → Tier P1 prefix-sensitive |

### 5.2 Stable Mid-Tier / OpenCode-Go 控制組

| Model | Full ID | /ulw-loop 結果 | ulw-loop 結果 | 結論 |
|-------|---------|----------------|---------------|------|
| GLM-5.1 | `opencode-go/glm-5.1` | 2 success | 2 success | 4/4 穩定 → Tier P2 通用主力 |
| Kimi K2.5 | `opencode-go/kimi-k2.5` | 2 success | 2 success | 4/4 穩定 → Tier P2 分析/長文主力 |
| Mimo V2 Pro | `opencode-go/mimo-v2-pro` | 2 success | 2 success | 4/4 穩定 → Tier P2 實作主力 |
| Minimax M2.7 | `opencode-go/minimax-m2.7` | 2 success | 2 success | 4/4 穩定 → Tier P2 快速/低成本主力 |

---

## 6. 一鍵查詢卡

```
高推理/架構        → 1st Claude Opus 4.6 → 2nd GPT-5.4 → 3rd GPT-5.1 → Stable mimo-v2-pro
一般實作           → 1st GPT-5.1 → 2nd GPT-5.2 → Stable glm-5.1
前端/UI/高發想     → 1st Gemini 3.1 Pro → 2nd Gemini 2.5 Pro → 3rd Claude Sonnet 4.6 (/ulw-loop) → Stable minimax-m2.7
長文分析/資料查詢  → 1st Claude Opus 4.6 → 2nd Claude Sonnet 4.6 (/ulw-loop) → Stable kimi-k2.5
快速迭代/低成本    → 1st GPT-5.1 → Stable minimax-m2.7

所有操作 workdir: /home/beer8/team-workspace/UI-UX
```

---

## 7. 與其他文件的關聯

| 文件 | 關係 |
|------|------|
| `OPENCODE_TEAM_STANDARD.md` | 團隊基礎執行規範，引用本矩陣作為模型白名單 |
| `docs/opencode-model-selection-policy.md` | 詳細模型治理政策；若與本矩陣衝突，以本矩陣為準 |
| `docs/uiux-task-board.md` | UI/UX 任務細節與驗收標準 |
| `docs/backend-task-board.md` | Backend 任務細節 |
| `docs/tester-task-board.md` | QA 任務細節 |

---

## 8. 修訂歷史

| 版本 | 日期 | 修訂內容 | 作者 |
|------|------|----------|------|
| 1.0 | 2026-04-15 | 初始版本：基於 2026-04-15 runtime 實測結果，建立 Tier P0/P1/P2 分類、5 種任務類型嘗試順序表、prefix 規則、premium-first fallback 決策流程 | Engineering Team |

---

**本矩陣為 runtime 事實驅動文件。任何模型狀態變更必須基於新的實測結果更新，不得以 catalog listing 推測可用性。**
