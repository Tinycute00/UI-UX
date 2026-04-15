# OpenCode Model Selection Policy — Ta Chen PMIS

**Version:** 1.2  
**Effective Date:** 2026-04-15  
**Owner:** Engineering Team / PM  
**Review Cycle:** Monthly or upon significant model updates

---

## 0. 最新 Runtime 覆蓋規則 (Latest Runtime Override)

> **⚠️ 當本政策內容與 `docs/opencode-executable-whitelist-matrix.md` 衝突時，以白名單矩陣為準。**

**正式白名單矩陣文件**：`docs/opencode-executable-whitelist-matrix.md`

**核心原則**：
- 優先嘗試高端模型 (Tier P0)，但不保證可用
- 高端模型連續失敗 2 次後，必須切換到穩定中階模型 (Tier P2)
- Claude Sonnet 4.6 為 prefix-sensitive，只建議 `/ulw-loop` 路徑

**已驗證的穩定中階模型 (Tier P2)**：
- `opencode-go/glm-5.1` — 通用主力 (4/4 success)
- `opencode-go/kimi-k2.5` — 分析/長文主力 (4/4 success)
- `opencode-go/mimo-v2-pro` — 實作主力 (4/4 success)
- `opencode-go/minimax-m2.7` — 快速/低成本主力 (4/4 success)

**Premium 模型不穩定聲明**：
- Claude Opus 4.6, Claude Opus 4.5, GPT-5.4, GPT-5.2, GPT-5.1, Gemini 3.1 Pro, Gemini 2.5 Pro 均為 Tier P0 (exploratory)，不保證每次可用
- Claude Sonnet 4.6 為 Tier P1，僅 `/ulw-loop` 路徑穩定

---

## 1. 強制執行規則 (Mandatory Rules)

### 1.1 工作目錄強制規定

**所有 OpenCode 與 terminal 專案操作必須顯式使用以下 workdir：**

```
/home/beer8/team-workspace/UI-UX
```

**禁止行為：**
- ❌ 使用相對路徑或隱含的預設工作目錄
- ❌ 假設 OpenCode 會自動切換到正確目錄
- ❌ 在指令中省略 workdir 參數

**正確範例：**
```bash
# Terminal 操作 - 使用 ulw-loop 格式
opencode run '/ulw-loop 
目標：[具體任務描述]

[CONTEXT]
- workdir=/home/beer8/team-workspace/UI-UX
- [其他上下文資訊]

[模型選擇策略]
- 主選：[模型名稱]
- 備援：[備援模型名稱]

[MUST DO]
1. [具體要求]

[MUST NOT DO]
- [禁止事項]

[ACCEPTANCE CRITERIA]
- [驗收標準]
' --workdir /home/beer8/team-workspace/UI-UX
```

### 1.2 模型選擇原則

1. **任務對應優先**：依據任務類型選擇模型，非個人偏好
2. **備援機制**：主選模型無法使用時，依序啟用備援方案
3. **成本控制**：例行任務優先使用成本效益模型
4. **品質閾值**：涉及生產環境或關鍵功能時，自動升級至高推理模型

---

## 2. 可用模型清單

### 2.1 模型分類總覽

| 類別 | 模型系列 | 建議應用情境 |
|------|----------|--------------|
| **高推理** | Claude Opus, GPT-5.4 | 建議用於複雜架構、關鍵決策 |
| **平衡型** | Claude Sonnet, GPT-5.2, Kimi K2.5 | 建議用於一般開發、分析任務 |
| **快速型** | GPT-5-mini, GPT-4o, Gemini Flash | 建議用於快速迭代、原型開發 |
| **專業型** | Gemini Pro/Flash, Minimax M2.5/2.7 | 建議用於 UI/前端、中文處理 |
| **經濟型** | GPT-5-nano, Minimax-free, Nemotron-free | 建議用於大量處理、低優先任務 |

### 2.2 完整模型列表

**OpenCode-Go 系列：**
- `opencode-go/glm-5` — 通用平衡型
- `opencode-go/glm-5.1` — GLM 升級版，中文理解強化
- `opencode-go/kimi-k2.5` — 長文本、文件分析、中文語境
- `opencode-go/mimo-v2-omni` — 多模態處理
- `opencode-go/mimo-v2-pro` — 專業級多模態
- `opencode-go/minimax-m2.5` — 中文語境、對話流暢
- `opencode-go/minimax-m2.7` — Minimax 升級版
- `opencode/big-pickle` — 內部專用
- `opencode/gpt-5-nano` — 極低成本、簡單任務
- `opencode/minimax-m2.5-free` — 免費版 Minimax
- `opencode/nemotron-3-super-free` — 免費版 Nemotron

> **Runtime 驗證狀態（2026-04-15）**：上述 OpenCode-Go 模型中，`opencode-go/glm-5.1`、`opencode-go/kimi-k2.5`、`opencode-go/mimo-v2-pro`、`opencode-go/minimax-m2.7` 已通過 4/4 穩定性測試，為 Tier P2 穩定主力。其餘 OpenCode-Go 模型尚未完成完整 runtime 驗證。

**GitHub Copilot 系列：**
- `github-copilot/claude-haiku-4.5` — 輕量級 Claude
- `github-copilot/claude-opus-4.5` — 最高推理能力
- `github-copilot/claude-opus-4.6` — Opus 升級版
- `github-copilot/claude-sonnet-4` — 平衡型 Claude
- `github-copilot/claude-sonnet-4.5` — Sonnet 升級版
- `github-copilot/claude-sonnet-4.6` — 最新 Sonnet
- `github-copilot/gemini-2.5-pro` — Gemini 專業版
- `github-copilot/gemini-3-flash-preview` — 快速預覽版
- `github-copilot/gemini-3.1-pro-preview` — 最新 Gemini Pro
- `github-copilot/gpt-4.1` — GPT 4.1 標準版
- `github-copilot/gpt-4o` — GPT-4o 多模態
- `github-copilot/gpt-5-mini` — 輕量 GPT-5
- `github-copilot/gpt-5.1` — GPT-5 系列
- `github-copilot/gpt-5.2` — 平衡型 GPT
- `github-copilot/gpt-5.2-codex` — 程式碼強化版
- `github-copilot/gpt-5.3-codex` — Codex 升級版
- `github-copilot/gpt-5.4` — 高階推理
- `github-copilot/gpt-5.4-mini` — 高階輕量版
- `github-copilot/grok-code-fast-1` — 快速推理

> **Runtime 驗證狀態（2026-04-15）**：所有 GitHub Copilot 模型均為 Tier P0/P1，存在不同程度的不穩定性（not_supported / forbidden）。其中 Claude Sonnet 4.6 為 Tier P1 prefix-sensitive（只建議 `/ulw-loop` 路徑）。詳見 `docs/opencode-executable-whitelist-matrix.md`。

---

## 3. 依任務類型的模型選擇矩陣

### 3.1 任務類型對照表

> **⚠️ 重要**：以下表格為「建議」層級。實際執行時的嘗試順序與穩定回退策略，請以 `docs/opencode-executable-whitelist-matrix.md` 的 Task-Type Try-Order Tables 為準。下表中的 Copilot 模型均為 Tier P0/P1，不保證每次可用。

| 任務類型 | 主選模型 | 備援模型 | 升級條件 | 降級條件 |
|----------|----------|----------|----------|----------|
| **複雜架構設計** | Claude Opus 4.5/4.6 | GPT-5.4 | 核心系統重構 | 單一模組變更 |
| **關鍵演算法** | Claude Opus 4.6 | GPT-5.4 | 效能敏感邏輯 | 非核心工具函式 |
| **一般功能實作** | Claude Sonnet 4.6 | GPT-5.2 | 涉及多模組 | 單檔簡單變更 |
| **快速原型開發** | GPT-4o / GPT-5-mini | Gemini Flash | 驗證概念階段 | 進入正式開發 |
| **前端 UI/UX** | **Gemini 系列優先** | Claude Sonnet | 複雜互動設計 | 純 CSS 調整 |
| **後端 API 開發** | Claude Sonnet / GPT-5.2 | GPT-4o | 涉及業務邏輯 | 純 CRUD 端點 |
| **測試撰寫** | GPT-5.2-Codex | Claude Sonnet | 複雜測試情境 | 簡單單元測試 |
| **DevOps/IaC** | Claude Sonnet | GPT-5.2 | 生產環境部署 | 本地開發腳本 |
| **文件整理** | Kimi K2.5 / GLM-5.1 | Minimax M2.5 | 技術文件撰寫 | 簡單註解補充 |
| **錯誤分析除錯** | Claude Opus | GPT-5.4 | 生產環境問題 | 開發環境警告 |
| **大量批次處理** | GPT-5-nano | Minimax-free | 資料遷移任務 | 手動審查後 |
| **程式碼審查** | Claude Sonnet | GPT-5.2 | 關鍵路徑變更 | 樣式微調 |

### 3.2 前端專職模型 / Frontend-Specialist Models

**治理規則：前端任務需要高發想、發散型模型，因此 Gemini 系列應作為 frontend-specialist family 明確入規。**

前端專職模型區分兩大類任務：
- **高發想/發散型任務**：UI 概念生成、互動設計發想、設計系統規劃
- **實作型任務**：切版、Responsive 實作、組件開發、快速迭代

#### 前端專職模型選擇矩陣

| 任務類型 | 主選模型 | 備援模型 | 狀態 | 適用情境 |
|----------|----------|----------|------|----------|
| **高發想/UI 概念生成** | Gemini-3.1-Pro-Preview | Claude Sonnet 4.6 | ✅ Runnable | 設計發想、互動概念、視覺創意 |
| **切版/互動/Responsive** | Gemini-3.1-Pro-Preview | Claude Sonnet 4.6 | ✅ Runnable | 頁面實作、RWD、組件開發 |
| **快速前端迭代** | Gemini-3-Flash-Preview | GPT-4o | ✅ Runnable | 樣式微調、快速試驗 |
| **設計系統維護** | Gemini-3.1-Pro-Preview | Claude Opus 4.6 | ✅ Runnable | Design tokens、組件庫 |
| ~~Gemini-2.5-Pro~~ | — | — | ❌ Listed but TOS/Permission Blocked | 目前不可執行，不得作為主選 |

#### 模型執行狀態說明（已驗證）

| 模型 | 完整名稱 | 狀態 | 備註 |
|------|----------|------|------|
| Gemini-3.1-Pro-Preview | `github-copilot/gemini-3.1-pro-preview` | ⚠️ Tier P0 Exploratory | ⚠️ Tier P0 Exploratory — 可嘗試但不穩定（1 success / 1 not_supported） |
| Gemini-3-Flash-Preview | `github-copilot/gemini-3-flash-preview` | ⚠️ Tier P0 Exploratory | ⚠️ Tier P0 Exploratory — 可嘗試但不保證穩定 |
| Gemini-2.5-Pro | `github-copilot/gemini-2.5-pro` | ⚠️ Tier P0 Exploratory | ⚠️ Tier P0 Exploratory — 目前回傳 Forbidden/TOS blocked，不保證每次可用 |
| Claude Sonnet 4.6 | `github-copilot/claude-sonnet-4.6` | ⚠️ Tier P1 Prefix-Sensitive | ⚠️ Tier P1 Prefix-Sensitive — 只建議 /ulw-loop 路徑（/ulw-loop: 2/2 success; ulw-loop: 2/2 not_supported） |

#### Gemini 系列前端強項

**適用情境：**
- ✅ CSS/Tailwind/Styled Components 樣式生成
- ✅ React/Vue/Angular 組件開發
- ✅ 響應式設計 (RWD) 實作
- ✅ 視覺效果與動畫 (CSS animations, transitions)
- ✅ 切版與佈局調整
- ✅ 無障礙 (a11y) 標記優化
- ✅ 設計系統 (Design System) 維護
- ✅ UI 測試腳本生成
- ✅ **高發想任務**：UI 概念發想、互動設計提案、設計變體生成

**為何 Gemini 適合前端高發想任務：**
- 視覺理解能力強，適合處理設計稿轉換
- CSS 生成品質穩定，較少無效屬性
- 響應式斷點建議符合實務
- 組件結構建議模組化程度高
- **發散思維表現佳，適合生成多種 UI 設計方案**

### 3.3 資料查詢模型 / Data-Query Specialist Models

**治理規則：長文規格比對、文件交叉核對、多源資料查詢需使用專職資料查詢模型。**

資料查詢模型專注於：
- 長文規格比對與差異分析
- 文件 / 報表 / source-of-truth 核對
- 跨文件查詢與資料整理
- 大量文本的資訊擷取

#### 資料查詢模型選擇矩陣

| 任務類型 | 主選模型 | 備援模型 | 升級條件 | 降級條件 |
|----------|----------|----------|----------|----------|
| **長文規格比對** | Kimi K2.5 | Claude Sonnet 4.6 | 超過 100K tokens 或跨 5+ 文件 | 單一簡短文件 |
| **文件/報表核對** | Kimi K2.5 | GLM-5.1 | 技術規格 vs 實作對照 | 純格式檢查 |
| **跨文件查詢整理** | Kimi K2.5 | Claude Sonnet 4.6 | 需從 10+ 文件提取資訊 | 2-3 文件內查詢 |
| **Source-of-truth 驗證** | Kimi K2.5 | Claude Opus 4.6 | 關鍵業務數據核對 | 非關鍵數據 |
| **大量資料批次處理** | GPT-5-nano | Minimax-free | 資料遷移、報表生成 | 人工審查後 |

#### 模型執行狀態說明（已驗證）

| 模型 | 完整名稱 | 狀態 | 資料查詢優勢 |
|------|----------|------|--------------|
| Kimi K2.5 | `opencode-go/kimi-k2.5` | ✅ Tier P2 Stable | 超長上下文、中文語境佳、文件理解強 |
| GLM-5.1 | `opencode-go/glm-5.1` | ✅ Tier P2 Stable | 中文技術文件處理、術語準確 |
| Claude Sonnet 4.6 | `github-copilot/claude-sonnet-4.6` | ⚠️ Tier P1 Prefix-Sensitive | ⚠️ Tier P1 Prefix-Sensitive — 只建議 /ulw-loop 路徑 |
| Claude Opus 4.6 | `github-copilot/claude-opus-4.6` | ⚠️ Tier P0 Exploratory | ⚠️ Tier P0 Exploratory — 極不穩定，僅作為嘗試 |
| GPT-5-nano | `opencode/gpt-5-nano` | ✅ Runnable now | 大量資料低成本處理 |

#### 升級與備援指引

**何時升級至高階模型：**
- 核對結果影響關鍵業務決策
- 涉及法規合規性驗證
- 資料來源超過 10+ 文件且關聯複雜
- 需要精確的差異比對（如合約條文對照）

**備援啟動時機：**
- Kimi K2.5 服務異常 → 改用 Claude Sonnet 4.6
- 中文語境強化需求 → 改用 GLM-5.1
- 需要更強邏輯推理 → 改用 Claude Opus 4.6

---

## 4. 依角色的模型選擇策略

### 4.1 Frontend Developer

**日常工作：**
| 任務 | 主選模型 | 備援模型 | 備註 |
|------|----------|----------|------|
| 新頁面開發 | Gemini-3.1-Pro-Preview ✅ | Claude Sonnet 4.6 | UI/UX 高發想首選 |
| 組件重構 | Gemini-3.1-Pro-Preview ✅ | GPT-5.2 | 注意向後相容 |
| UI 概念發想 | Gemini-3.1-Pro-Preview ✅ | Claude Sonnet 4.6 | **高發想/發散任務** |
| 快速原型開發 | Gemini-3-Flash-Preview ✅ | GPT-4o | 快速迭代首選 |
| CSS 調整 | Gemini-3-Flash-Preview ✅ | GPT-4o | 樣式微調 |
| RWD/Responsive | Gemini-3.1-Pro-Preview ✅ | Claude Sonnet 4.6 | 切版實作 |
| 設計系統維護 | Gemini-3.1-Pro-Preview ✅ | Claude Opus 4.6 | 一致性優先 |
| ~~Gemini-2.5-Pro~~ | — | — | ❌ Listed but TOS/Permission blocked，不可主用 |
| API 整合 | Claude Sonnet 4.6 | GPT-5.2 | 型別檢查 |
| Bug 修復 | Claude Sonnet 4.6 | Gemini-3.1-Pro | 依複雜度調整 |
| 測試撰寫 | Claude Sonnet 4.6 | GPT-5.2 | 覆蓋率優先 |
| 效能優化 | Claude Opus 4.6 | GPT-5.4 | 關鍵路徑 |

**前端專職模型狀態備註：**
- ⚠️ `github-copilot/gemini-3.1-pro-preview` = Tier P0 Exploratory，前端高發想/發散/UI 主選嘗試（1 success / 1 not_supported，不保證穩定）
- ⚠️ `github-copilot/gemini-3-flash-preview` = Tier P0 Exploratory，快速前端迭代（尚未完成完整驗證）
- ⚠️ `github-copilot/gemini-2.5-pro` = Tier P0 Exploratory，有 forbidden 風險（1 success / 1 forbidden）
- ⚠️ `github-copilot/claude-sonnet-4.6` = Tier P1 Prefix-Sensitive，**只建議 `/ulw-loop` 路徑**（/ulw-loop: 2/2 success; ulw-loop: 2/2 not_supported）
- ✅ 穩定回退：`opencode-go/minimax-m2.7` (Tier P2, 4/4 success)

**升級觸發條件：**
- 涉及核心使用者流程變更
- 需要重構現有架構
- 效能指標明確要求
- 跨團隊協作接口定義

### 4.2 Backend Developer

**日常工作：**
| 任務 | 主選模型 | 備援模型 | 備註 |
|------|----------|----------|------|
| API 設計 | Claude Sonnet 4.6 | GPT-5.2 | REST/GraphQL |
| 資料庫建模 | Claude Opus | GPT-5.4 | 關聯複雜度 |
| 業務邏輯 | Claude Sonnet | GPT-5.2 | 規則引擎 |
| 認證授權 | Claude Opus | GPT-5.4 | 安全優先 |
| 效能優化 | Claude Opus | GPT-5.4 | 演算法選擇 |
| 測試撰寫 | Claude Sonnet | GPT-5.2 | 邊界案例 |
| 文件生成 | Kimi K2.5 | GLM-5.1 | API 文件 |
| 錯誤處理 | Claude Sonnet | GPT-5.2 | 例外流程 |

**升級觸發條件：**
- 涉及資料一致性與交易
- 安全性相關功能 (認證、授權、加密)
- 高併發情境處理
- 與第三方系統整合

### 4.3 Tester / QA

**日常工作：**
| 任務 | 主選模型 | 備援模型 | 備註 |
|------|----------|----------|------|
| 測試計畫 | Kimi K2.5 | Claude Sonnet | 覆蓋率分析 |
| 測試案例 | GPT-5.2 | Claude Sonnet | 邊界值 |
| 自動化腳本 | GPT-5.2-Codex | Claude Sonnet | Playwright/Cypress |
| Bug 報告分析 | Claude Sonnet | GPT-5.2 | 根因分析 |
| 回歸測試 | GPT-5-mini | GPT-4o | 大量重複驗證 |
| 效能測試 | Claude Opus | GPT-5.4 | 瓶頸定位 |
| 測試資料 | GPT-5-nano | Minimax-free | 批次生成 |
| 報告彙整 | Kimi K2.5 | GLM-5.1 | 多語言報告 |

**升級觸發條件：**
- 生產環境事故調查
- 安全性漏洞驗證
- 複雜整合測試情境
- 效能回歸分析

### 4.4 DevOps Engineer

**日常工作：**
| 任務 | 主選模型 | 備援模型 | 備註 |
|------|----------|----------|------|
| CI/CD 腳本 | Claude Sonnet | GPT-5.2 | GitHub Actions |
| IaC 配置 | Claude Sonnet 4.6 | GPT-5.2 | Terraform/CloudFormation |
| 容器化 | Claude Sonnet | GPT-5.2 | Docker/K8s |
| 監控告警 | Claude Sonnet | GPT-5.2 | Prometheus/Grafana |
| 日誌分析 | Kimi K2.5 | Claude Sonnet | 大量文本 |
| 安全掃描 | Claude Opus | GPT-5.4 | 漏洞評估 |
| 緊急應變 | Claude Opus | GPT-5.4 | 生產事故 |
| 文件維護 | Kimi K2.5 | GLM-5.1 | Runbook |

**升級觸發條件：**
- 生產環境部署變更
- 安全性配置調整
- 災難復原流程
- 跨區域基礎設施變更

---

## 5. 模型特性與適用情境詳解

### 5.1 Claude 系列 (Anthropic)

**Claude Opus (4.5/4.6)**
- **治理建議**：適用於複雜架構、關鍵決策、深度分析
- **觀察特性**：
  - 長程依賴理解佳
  - 程式碼結構嚴謹
  - 安全性考量周全
  - 較高成本
- **建議情境**：
  - 系統重構規劃
  - 關鍵演算法設計
  - 安全性審查
  - 生產問題根因分析

**Claude Sonnet (4/4.5/4.6)**
- **治理建議**：適用於一般開發、分析、協作任務
- **觀察特性**：
  - 速度與品質平衡
  - 上下文理解良好
  - 程式碼風格一致
  - 中等成本
- **建議情境**：
  - 功能開發
  - 程式碼審查
  - API 設計
  - 文件撰寫

### 5.2 GPT 系列 (OpenAI)

**GPT-5.4 / GPT-5.4-mini**
- **治理建議**：適用於複雜邏輯、效能關鍵程式碼
- **觀察特性**：
  - 演算法實作精確
  - 多語言支援完整
  - 測試生成能力強
  - 高成本
- **建議情境**：
  - 核心業務邏輯
  - 效能優化
  - 複雜測試情境
  - 跨語言整合

**GPT-5.2 / GPT-5.2-Codex**
- **治理建議**：適用於一般程式開發、測試
- **觀察特性**：
  - 程式碼生成品質穩定
  - 註解與文件完整
  - 除錯建議實用
  - 中等成本
- **建議情境**：
  - 功能實作
  - 測試撰寫
  - 程式碼重構
  - API 整合

**GPT-4o / GPT-5-mini**
- **治理建議**：適用於原型開發、簡單任務
- **觀察特性**：
  - 響應速度快
  - 多模態支援
  - 成本效益高
  - 適合大量請求
- **建議情境**：
  - 概念驗證
  - 樣式調整
  - 簡單腳本
  - 快速試錯

### 5.3 Gemini 系列 (Google)

> **重要狀態聲明**：以下 Gemini 模型狀態已實際驗證，必須嚴格區分「可執行」與「Listed but blocked」。

#### ✅ Runnable Now（可立即使用）

**Gemini 3.1 Pro Preview** (`github-copilot/gemini-3.1-pro-preview`)
- **治理建議**：前端高發想/發散/UI 任務可嘗試，但不保證穩定
- **執行狀態**：⚠️ Tier P0 Exploratory（1 success / 1 not_supported）
- **觀察特性**：
  - 視覺理解能力強
  - CSS/HTML 生成精準
  - 響應式設計建議實用
  - 組件結構模組化
  - **發散思維佳，適合 UI 概念生成**
- **建議情境**：
  - 頁面切版與 RWD 實作
  - CSS 動畫效果
  - React/Vue 組件開發
  - **UI 概念發想與互動設計**
  - 設計系統維護

**Gemini 3 Flash Preview** (`github-copilot/gemini-3-flash-preview`)
- **治理建議**：快速前端迭代可嘗試，但不保證穩定
- **執行狀態**：⚠️ Tier P0 Exploratory
- **觀察特性**：
  - 速度優先
  - 即時反饋
  - 適合迭代開發
  - 低延遲
- **建議情境**：
  - 現場樣式調整
  - 快速試驗與原型
  - 簡單組件開發
  - 樣式微調

#### ❌ Listed but Blocked（不可執行）

**Gemini 2.5 Pro** (`github-copilot/gemini-2.5-pro`)
- **執行狀態**：⚠️ Tier P0 Exploratory — 回傳 Forbidden / TOS blocked，不保證每次可用
- **治理規則**：
  - **不得作為當前可直接主用模型**
  - 雖列於 provider models 清單，但執行時回傳 Forbidden / TOS blocked
  - 若未來狀態改變，需重新驗證後更新本政策
- **當前替代方案**：使用 opencode-go/kimi-k2.5 或 opencode-go/glm-5.1（Tier P2 穩定）

### 5.4 專業型模型

#### 資料查詢專職 / Data-Query Specialist

**Kimi K2.5 (Moonshot)** — `opencode-go/kimi-k2.5`
- **定位**：**資料查詢與長文本分析主選**
- **執行狀態**：✅ Runnable now（已驗證）
- **核心強項**：
  - **長文規格比對**：跨文件差異分析、版本對照
  - **文件核對**：技術規格 vs 實作對照、報表交叉驗證
  - **跨文件查詢**：從多份文件中擷取並整合資訊
  - **超長上下文視窗**：支援大量文本的一次性處理
  - 中文語境理解佳
- **建議情境**：
  - 長文規格比對與差異分析
  - Source-of-truth 文件核對
  - 技術規格書撰寫與審查
  - 大型 codebase 分析
  - API 文件生成
  - 多語言文件處理
  - 報表/數據交叉驗證
- **升級條件**：超過 100K tokens、跨 5+ 文件、關鍵業務數據核對
- **備援模型**：Claude Sonnet 4.6（結構化分析）、GLM-5.1（中文強化）

#### 其他專業模型

**GLM-5 / GLM-5.1 (Zhipu)** — `opencode-go/glm-5.1`
- **定位**：中文語境強化
- **執行狀態**：✅ Runnable now
- **治理建議**：適用於中文語境強化場景
- **觀察特性**：
  - 中文表達自然
  - 技術術語準確
  - 文化語境理解
  - 適合華語團隊
- **建議情境**：
  - 中文技術文件撰寫與審查
  - 在地化內容
  - 團隊溝通文件
  - 中文程式碼註解
- **資料查詢備援**：當 Kimi K2.5 無法使用且需中文語境時

**Minimax M2.5 / M2.7** — `opencode-go/minimax-m2.5`
- **定位**：對話介面與流程設計
- **執行狀態**：✅ Runnable now
- **治理建議**：適用於對話介面、流程設計
- **觀察特性**：
  - 對話流暢自然
  - 上下文記憶良好
  - 中文互動佳
  - 適合客服/對話場景
- **建議情境**：
  - 對話流程設計
  - 使用者引導文字
  - 互動式功能
  - 中文內容生成

---

## 6. 成本 / 速度 / 品質 / 穩定性取捨

### 6.1 決策矩陣

| 優先級 | 推薦模型 | 適用情境 | 注意事項 |
|--------|----------|----------|----------|
| **品質優先** | Claude Opus / GPT-5.4 | 核心功能、架構決策 | 成本較高，審查輸出 |
| **速度優先** | GPT-4o / Gemini Flash | 快速原型、緊急修復 | 需人工驗證品質 |
| **成本優先** | GPT-5-nano / Free 系列 | 大量處理、低優先任務 | 僅用於簡單任務 |
| **穩定性優先** | Claude Sonnet / GPT-5.2 | 生產程式碼、長期維護 | 避免使用預覽版 |
| **平衡型** | Claude Sonnet 4.6 | 一般開發任務 | 團隊預設選擇 |

### 6.2 升級與降級條件

**何時升級到高推理模型：**
- 任務涉及關鍵業務邏輯
- 需要跨多個系統/模組整合
- 有明確的效能或安全性要求
- 失敗成本高昂（生產環境、客戶影響）
- 架構層級決策

**何時降級到便宜模型：**
- 任務明確且範圍狹小
- 有明確的輸入輸出規格
- 人工審查機制完善
- 開發/測試環境任務
- 重複性高、變化低的任務

### 6.3 成本控管建議

1. **預設使用平衡型模型**（Claude Sonnet / GPT-5.2）
2. **每日任務檢視**：高成本任務需標註理由
3. **批量處理優先使用經濟型模型** + 人工抽樣檢查
4. **定期檢視使用報告**：識別成本異常
5. **建立「高成本任務審批」機制**：單次請求超過閾值需主管確認

---

## 7. 任務指派範例

### 7.1 基本委派原則

所有 OpenCode 任務委派必須遵循：
1. **使用 ulw-loop 格式**：透過 `opencode run '/ulw-loop ...' --workdir /home/beer8/team-workspace/UI-UX` 啟動
2. **明確指定 workdir**：所有命令必須包含 `--workdir /home/beer8/team-workspace/UI-UX`
3. **在 [模型選擇策略] 區塊中宣告主選與備援模型**
4. 提供完整的 context

### 7.2 Frontend 任務範例

**範例 1：新頁面開發（優先使用 Gemini）**

```bash
# Frontend 任務 - 新頁面開發
opencode run '/ulw-loop 
目標：實作使用者儀表板頁面

[CONTEXT]
- workdir=/home/beer8/team-workspace/UI-UX
- 專案：Ta Chen PMIS
- 使用 Vite + Vanilla JS + Tailwind CSS
- 設計稿參考：src/partials/dashboard-view.html
- 需響應式支援 (mobile/tablet/desktop)

[模型選擇策略]
- 主選：github-copilot/gemini-3.1-pro-preview (UI 任務優先)
- 備援：github-copilot/claude-sonnet-4.6

[MUST DO]
1. 建立新的 dashboard 頁面結構
2. 實作三欄式佈局 (sidebar + main + widgets)
3. 確保 mobile 下變為單欄
4. 使用現有 color token 變數
5. 遵循 src/styles/main.css 的命名慣例

[MUST NOT DO]
- 不要修改其他頁面結構
- 不要引入新的 CSS 框架
- 不要使用 !important

[ACCEPTANCE CRITERIA]
- 頁面在 320px-1920px 範圍正常顯示
- 通過 npm run lint
- 通過現有無障礙測試
' --workdir /home/beer8/team-workspace/UI-UX
```

**範例 2：CSS 動畫調整（快速迭代）**

```bash
# Frontend 任務 - CSS 微調
opencode run '/ulw-loop 
目標：優化按鈕 hover 動畫

[CONTEXT]
- workdir=/home/beer8/team-workspace/UI-UX
- 檔案：src/styles/components.css
- 當前動畫過於生硬，需增加 ease-out 效果
- 使用 Tailwind 的 transition utilities

[模型選擇策略]
- 主選：github-copilot/gemini-3-flash-preview (快速迭代)
- 備援：github-copilot/gpt-4o

[MUST DO]
1. 為 .btn-primary 增加平滑 hover 效果
2. 過渡時間 200ms，使用 ease-out 曲線
3. 同時調整 focus 狀態保持一致性

[ACCEPTANCE CRITERIA]
- 動畫在 60fps 下流暢
- 不影響其他組件樣式
' --workdir /home/beer8/team-workspace/UI-UX
```

### 7.3 Backend 任務範例

**範例：API 端點實作（標準開發）**

```bash
# Backend 任務 - API 開發
opencode run '/ulw-loop 
目標：實作使用者認證 API

[CONTEXT]
- workdir=/home/beer8/team-workspace/UI-UX
- 專案：Ta Chen PMIS Backend
- 框架：Express.js
- 資料庫：PostgreSQL with Prisma ORM
- 認證：JWT-based

[模型選擇策略]
- 主選：github-copilot/claude-sonnet-4.6 (平衡型)
- 備援：github-copilot/gpt-5.2

[MUST DO]
1. 實作 POST /api/auth/login
2. 實作 POST /api/auth/register
3. 實作 POST /api/auth/refresh
4. 使用 bcrypt 加密密碼
5. 輸入驗證使用 zod schema
6. 錯誤處理遵循現有 middleware pattern

[MUST NOT DO]
- 不要儲存明文密碼
- 不要在 token payload 放敏感資訊
- 不要跳過輸入驗證

[ACCEPTANCE CRITERIA]
- 所有端點有對應測試
- 通過現有 lint 規則
- API 文件更新
' --workdir /home/beer8/team-workspace/UI-UX
```

**範例：資料庫重構（升級至高推理）**

```bash
# Backend 任務 - 複雜重構
opencode run '/ulw-loop 
目標：設計新的多租戶資料庫架構

[CONTEXT]
- workdir=/home/beer8/team-workspace/UI-UX
- 當前：單一租戶架構，需支援多組織
- 資料庫：PostgreSQL
- ORM：Prisma
- 資料量：預計 1000+ 租戶，每戶 10K-1M 記錄

[模型選擇策略]
- 主選：github-copilot/claude-opus-4.6 (高推理)
- 備援：github-copilot/gpt-5.4
- 此為架構層級決策，需使用高推理模型

[MUST DO]
1. 評估 row-level security vs schema-per-tenant vs database-per-tenant
2. 設計租戶隔離策略
3. 規劃資料遷移方案
4. 確保現有資料相容性
5. 提供效能影響評估

[MUST NOT DO]
- 不要造成 downtime
- 不要破壞現有 API 合約
- 不要忽略資料隔離安全性

[ACCEPTANCE CRITERIA]
- 架構文件含優缺點比較
- 遷移計畫含 rollback 策略
- 效能測試方案
' --workdir /home/beer8/team-workspace/UI-UX
```

### 7.4 Tester 任務範例

**範例：測試案例生成**

```bash
# Tester 任務 - 測試開發
opencode run '/ulw-loop 
目標：為登入流程生成 E2E 測試

[CONTEXT]
- workdir=/home/beer8/team-workspace/UI-UX
- 測試框架：Playwright
- 測試範圍：登入頁面完整流程
- 參考規格：docs/test-plan-v1.md

[模型選擇策略]
- 主選：github-copilot/claude-sonnet-4.6 (測試邏輯)
- 備援：github-copilot/gpt-5.2

[MUST DO]
1. 測試成功登入流程
2. 測試錯誤密碼情境
3. 測試空欄位驗證
4. 測試「記住我」功能
5. 測試 session 過期處理
6. 使用 page object pattern

[MUST NOT DO]
- 不要測試第三方服務 (使用 mock)
- 不要依賴測試執行順序
- 不要在測試中留下測試資料

[ACCEPTANCE CRITERIA]
- 測試可獨立執行
- 通過 npm run test:e2e
- 程式碼覆蓋率 >80%
' --workdir /home/beer8/team-workspace/UI-UX
```

### 7.5 DevOps 任務範例

**範例：CI/CD 腳本更新**

```bash
# DevOps 任務 - CI/CD 腳本更新
opencode run '/ulw-loop 
目標：更新 GitHub Actions 部署流程

[CONTEXT]
- workdir=/home/beer8/team-workspace/UI-UX
- 專案：Ta Chen PMIS
- 平台：GitHub Actions → AWS ECS
- 當前問題：部署時間過長 (15+ 分鐘)

[模型選擇策略]
- 主選：github-copilot/claude-sonnet-4.6 (平衡型)
- 備援：github-copilot/gpt-5.2

[MUST DO]
1. 啟用 Docker layer caching
2. 實作 parallel job execution
3. 增加部署通知 (Slack webhook)
4. 增加 rollback 觸發機制
5. 優化測試階段 (只跑影響範圍)

[MUST NOT DO]
- 不要移除安全性掃描步驟
- 不要繞過測試直接部署
- 不要在腳本中暴露 credentials

[ACCEPTANCE CRITERIA]
- 部署時間 < 8 分鐘
- 失敗時自動通知
- 保留最近 10 個部署歷史
' --workdir /home/beer8/team-workspace/UI-UX
```

### 7.6 ulw-loop 完整範例

**使用 ulw-loop 啟動完整工作流：**

```bash
# Frontend 任務 - 完整範例
opencode run '/ulw-loop 
目標：實作響應式導航列組件

[CONTEXT]
- workdir=/home/beer8/team-workspace/UI-UX
- 技術棧：Vite + Tailwind CSS + Vanilla JS
- 設計規格：參考 docs/uiux-delivery-spec.md Section 3.2
- 支援斷點：sm(640px), md(768px), lg(1024px), xl(1280px)

[模型選擇策略]
- 主選：github-copilot/gemini-3.1-pro-preview (UI 任務優先)
- 備援：github-copilot/claude-sonnet-4.6
- 若需效能優化：升級至 claude-opus-4.6

[MUST DO]
1. 建立 src/partials/navbar-responsive.html
2. 實作桌面版水平導航 + 行動版漢堡選單
3. 使用現有 CSS 變數 (--color-primary, --color-secondary)
4. 確保鍵盤導航支援 (a11y)
5. 添加 aria-label 與 role 屬性

[MUST NOT DO]
- 不要引入新的 CSS 框架
- 不要使用 inline style
- 不要破壞現有頁面結構

[驗收標準]
- 通過 npm run lint
- 通過 npm run format:check
- Lighthouse accessibility score ≥ 90
- 所有斷點下正常顯示
'
```

---

## 8. 與其他團隊標準的關聯

### 8.1 引用現有標準

本政策與以下文件協同運作：

- **OPENCODE_TEAM_STANDARD.md** — 基礎執行規範與 workdir 要求
- **docs/opencode-executable-whitelist-matrix.md** — 最新 Runtime 驗證狀態與嘗試順序（衝突時以此為準）
- **docs/uiux-task-board.md** — Frontend 任務細節與驗收標準
- **docs/backend-task-board.md** — Backend 任務細節
- **docs/tester-task-board.md** — QA 任務細節
- **docs/devops-task-board.md** — DevOps 任務細節
- **docs/implementation-backlog.md** — 資料庫任務路由規則

### 8.2 文件更新責任

| 情境 | 更新文件 | 責任人 |
|------|----------|--------|
| 新模型可用 | 本政策第 2 章 | Tech Lead |
| 模型評估改變 | 本政策第 3-5 章 | 各角色 Lead |
| 成本結構調整 | 本政策第 6 章 | PM + Tech Lead |
| 新增任務類型 | 本政策第 3 章 | 相關角色 Lead |
| 工作目錄變更 | OPENCODE_TEAM_STANDARD.md | DevOps |

---

## 9. 附錄

### 9.1 快速查詢卡

**常用任務一鍵查詢：**

```
新頁面開發          → Gemini-3.1-Pro-Preview / workdir=/home/beer8/team-workspace/UI-UX
UI 概念發想         → Gemini-3.1-Pro-Preview / workdir=/home/beer8/team-workspace/UI-UX
前端快速迭代        → Gemini-3-Flash-Preview / workdir=/home/beer8/team-workspace/UI-UX
API 開發            → Claude Sonnet 4.6 / workdir=/home/beer8/team-workspace/UI-UX
Bug 修復            → Claude Sonnet 4.6 / workdir=/home/beer8/team-workspace/UI-UX
測試撰寫            → Claude Sonnet 4.6 / workdir=/home/beer8/team-workspace/UI-UX
長文規格比對        → Kimi K2.5 / workdir=/home/beer8/team-workspace/UI-UX
文件/報表核對       → Kimi K2.5 / workdir=/home/beer8/team-workspace/UI-UX
Source-of-truth 驗證 → Kimi K2.5 / workdir=/home/beer8/team-workspace/UI-UX
效能優化            → Claude Opus 4.6 / workdir=/home/beer8/team-workspace/UI-UX
緊急修復            → GPT-4o / workdir=/home/beer8/team-workspace/UI-UX
批次處理            → GPT-5-nano / workdir=/home/beer8/team-workspace/UI-UX
```

**前端專職模型注意事項：**
- ⚠️ Gemini-3.1-Pro-Preview = Tier P0 Exploratory，高發想/UI 首選嘗試（不保證穩定）
- ⚠️ Gemini-3-Flash-Preview = Tier P0 Exploratory，快速迭代嘗試（不保證穩定）
- ⚠️ Gemini-2.5-Pro = Tier P0 Exploratory，有 forbidden 風險
- ⚠️ Claude Sonnet 4.6 = Tier P1 Prefix-Sensitive，**只建議 `/ulw-loop` 路徑**
- ✅ 穩定回退：Minimax M2.7 (Tier P2)

**資料查詢模型注意事項：**
- ✅ Kimi K2.5 = 長文比對/文件核對主選
- 備援：Claude Sonnet 4.6（結構化分析）、GLM-5.1（中文強化）

### 9.2 例外處理流程

**當主選與備援模型皆無法使用時：**

1. **檢查模型狀態** — 確認是否為平台問題
2. **暫時降級** — 使用次一級模型並標註「模型降級執行」
3. **增加審查** — 輸出必須經過人工審查
4. **記錄問題** — 在日誌中記錄模型不可用事件
5. **通知 Tech Lead** — 若持續超過 30 分鐘

### 9.3 詞彙表

| 術語 | 定義 |
|------|------|
| **ulw-loop** | OpenCode 的連續工作模式，支援多輪迭代 |
| **workdir** | 工作目錄，所有專案操作必須顯式指定 |
| **主選模型** | 特定任務類型的預設推薦模型 |
| **備援模型** | 主選無法使用時的替代方案 |
| **升級** | 因任務複雜度提高而改用更高階模型 |
| **降級** | 因成本或速度考量改用較輕量模型 |
| **category** | OpenCode 任務分類（visual-engineering, ultrabrain, etc.） |
| **skills** | OpenCode 技能外掛，增強特定領域能力 |
| **Tier P0** | Premium Exploratory — 高端模型，不保證穩定可用 |
| **Tier P1** | Upper-Mid Fallback — 中高階模型，有約束條件（如 prefix-sensitive） |
| **Tier P2** | Stable Mid-Tier — 穩定中階模型，4/4 runtime 驗證通過 |

---

## 10. 修訂歷史

| 版本 | 日期 | 修訂內容 | 作者 |
|------|------|----------|------|
| 1.2 | 2026-04-15 | 新增 Section 0「最新 Runtime 覆蓋規則」引用白名單矩陣文件（`docs/opencode-executable-whitelist-matrix.md`）；修正多處模型狀態與最新 runtime 事實衝突：Claude Opus 4.6/4.5、GPT-5.4/5.2/5.1、Gemini 3.1 Pro/2.5 Pro 標記為 Tier P0 Exploratory；Claude Sonnet 4.6 標記為 Tier P1 Prefix-Sensitive（只建議 `/ulw-loop`）；所有 Copilot 模型加入不穩定性警告；更新 Section 4.1、5.3、9.1 狀態備註；Section 8.1 新增白名單矩陣引用 | Engineering Team |
| 1.1 | 2026-04-15 | 增補兩類模型治理規則：(1) 新增 Section 3.2「前端專職模型」，明確 Gemini 系列為 frontend-specialist family，區分高發想/發散任務與實作型任務，明確標示 Gemini-2.5-Pro 為 listed but blocked 不可主用；(2) 新增 Section 3.3「資料查詢模型」，定義 Kimi K2.5 為長文規格比對/文件核對主選；更新 Section 4.1 Frontend Developer 表格與 Section 5.3 Gemini 系列說明；更新 OPENCODE_TEAM_STANDARD.md 索引 | Engineering Team |
| 1.0 | 2026-04-15 | 初始版本：建立完整模型選擇治理框架，納入 Gemini UI/前端強項規範，定義各角色策略與 workdir 強制規則 | Engineering Team |

---

**本政策為強制執行文件，所有 OpenCode 任務委派必須遵循。如有例外需求，請聯繫 Tech Lead 審批。**
