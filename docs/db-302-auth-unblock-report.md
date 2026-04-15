# DB-302 Auth Schema Unblock Report for BE-002

**Date:** 2026-04-14  
**Workspace:** `/home/beer8/team-workspace/UI-UX`  
**Source basis:** repo docs only, plus prior live-DB alignment report already present in workspace  
**Status:** **⚠️ 部分完成（設計提案已整理；live DB schema 本任務未重新驗證）**

---

## 1. Executive Summary

BE-002 的阻塞點已可被資料層設計釐清：

- `auth.users`
- `auth.sessions`
- `auth.audit_login_attempts`

Workspace 中的文件一致指出這三張表是 BE-002 的最低依賴；同時，`docs/database-dashboard-auth-alignment.md` 已記錄 **live DB 中 auth tables 不存在**，因此本次交付應以**可落地的 DDL/ER 設計提案**作為 Backend 交接基礎，而不是把文件當成既成 schema 事實。

本報告提供：
1. 逐表欄位設計與用途
2. role ENUM / 權限模型與 project 關聯方案
3. Backend service account 所需 CRUD / 連線權限
4. 明確的待確認項與風險界線

---

## 2. Evidence Matrix

### 2.1 BE-002 依賴文件
`docs/be-002-dependency-analysis.md` 明確列出 BE-002 被以下 tables 阻塞：
- `auth.users`
- `auth.sessions`
- `auth.audit_login_attempts`

並要求 Database 需確認：
- table schema
- Backend service account CRUD 權限
- role ENUM 值
- project 權限關聯方式

### 2.2 API 合約文件
`docs/api-contracts-v1.md` 顯示 auth API 依賴：
- `POST /api/v1/auth/login` → `auth.users`, `auth.sessions`, `auth.audit_login_attempts`
- `POST /api/v1/auth/logout` → `auth.sessions`
- `POST /api/v1/auth/refresh` → `auth.sessions`
- `GET /api/v1/auth/me` → `auth.users`, `auth.user_project_roles`

### 2.3 已存在的 live DB alignment 報告
`docs/database-dashboard-auth-alignment.md` 記錄：
- **Auth tables 不存在**
- `auth.users`, `auth.sessions`, `auth.audit_login_attempts` 均未出現於 live DB

> 因此，本次交付不能聲稱 schema 已建成；只能提供設計提案與待確認事項。

### 2.4 Schema 架構提案文件
`docs/auth-schema-architecture.md` 提供較完整的 auth 設計藍圖，包含：
- `auth.users`
- `auth.roles`
- `auth.user_roles`
- `auth.sessions`
- `auth.refresh_tokens`
- `auth.audit_login_attempts`
- `auth.user_project_roles`

本次報告採用其架構方向，但對外只保留 BE-002 必需最小集合：
- `auth.users`
- `auth.sessions`
- `auth.audit_login_attempts`

---

## 3. Minimum Required Schema Proposal

以下為**設計提案**，不是已驗證 live schema。

### 3.1 `auth.users`

**用途**
- 儲存使用者主檔與登入認證基礎資料
- 提供 `/auth/login` 與 `/auth/me` 查詢來源
- 作為 sessions 與 project 權限關聯的父表

**建議最小欄位**
| 欄位 | 型別 | 約束 | 用途 |
|---|---|---|---|
| `user_id` | `BIGSERIAL` 或 `UUID` | PK | 使用者主鍵 |
| `username` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | 登入帳號 |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | 聯絡 / 登入備援識別 |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | 密碼雜湊，不存明文 |
| `display_name` / `full_name` | `VARCHAR(200)` | nullable 或 `NOT NULL` 依產品規則 | 顯示名稱 |
| `role` | ENUM / varchar+lookup | `NOT NULL` | 全域角色 |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | 帳號是否啟用 |
| `last_login_at` | `TIMESTAMPTZ` | nullable | 最近登入時間 |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | 建立時間 |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | 更新時間 |

**PK/FK**
- PK：`user_id`
- 無需立即依賴外部 FK；可先獨立建立
- 後續可被 `auth.sessions.user_id`、`auth.user_project_roles.user_id` 參照

**用途說明**
- `username` 是登入主索引
- `email` 可作為通知與查詢備援
- `password_hash` 應儲存 bcrypt/argon2 hash
- `role` 用於全域身份（系統層級）

---

### 3.2 `auth.sessions`

**用途**
- 儲存 login session metadata
- 維護 refresh token lifecycle / revoke 狀態
- 支援 logout、token rotation、裝置追蹤

**建議最小欄位**
| 欄位 | 型別 | 約束 | 用途 |
|---|---|---|---|
| `session_id` | `BIGSERIAL` 或 `UUID` | PK | session 主鍵 |
| `user_id` | `BIGINT` / `UUID` | `NOT NULL`, FK → `auth.users.user_id` | 關聯使用者 |
| `refresh_token_hash` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | refresh token hash（不要存明文） |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | session/token 過期時間 |
| `revoked_at` | `TIMESTAMPTZ` | nullable | 撤銷時間，NULL 表示有效 |
| `device_info` | `JSONB` | nullable | 裝置、OS、client metadata |
| `ip_address` | `INET` 或 `VARCHAR(45)` | nullable | 登入來源 IP |
| `user_agent` | `TEXT` / `VARCHAR(500)` | nullable | 使用者代理 |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | 建立時間 |
| `last_used_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | 最後使用時間 |

**PK/FK**
- PK：`session_id`
- FK：`user_id` → `auth.users.user_id` `ON DELETE CASCADE`

**用途說明**
- 一個 user 可有多個 session（多裝置）
- `revoked_at` 用於 logout / token reuse defense
- `refresh_token_hash` 對應 `/auth/refresh`

---

### 3.3 `auth.audit_login_attempts`

**用途**
- 記錄登入成功/失敗
- 供 rate limit、帳號鎖定、稽核追蹤
- 與 session 主流程分離，避免污染會話表

**建議最小欄位**
| 欄位 | 型別 | 約束 | 用途 |
|---|---|---|---|
| `attempt_id` | `BIGSERIAL` 或 `UUID` | PK | 稽核事件主鍵 |
| `username` | `VARCHAR(100)` | `NOT NULL` | 嘗試登入帳號 |
| `email` | `VARCHAR(255)` | nullable | 可選補充識別 |
| `ip_address` | `INET` 或 `VARCHAR(45)` | nullable | 來源 IP |
| `user_agent` | `VARCHAR(500)` / `TEXT` | nullable | client 指紋 |
| `success` | `BOOLEAN` | `NOT NULL` | 是否成功 |
| `failure_reason` | `VARCHAR(100)` | nullable | 失敗原因，如 `wrong_password` |
| `attempted_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | 嘗試時間 |

**PK/FK**
- PK：`attempt_id`
- 不建議在最小版強制 FK 到 users；因為失敗登入可能對應不存在帳號，且 audit 應保留原始輸入

**用途說明**
- 支援 `/auth/login` 的風險控管
- 支援後續監控與封鎖策略
- 不應與 session 混用

---

## 4. Role / Permission Model

### 4.1 建議結論
**BE-002 的全域 role 不建議直接用單一 ENUM 綁死所有權限語意。**

原因：
- API 合約目前只穩定顯示三個角色字面值：`admin`, `supervisor`, `vendor`
- 但 `/auth/me` 回傳同時包含 `projects[]` 與 `permissions[]`
- 代表 role 是**身份層級**，permission 是**操作層級**，兩者不應混在同一欄位

### 4.2 推薦策略
採用 **雙層模型**：
1. **global role**：`auth.users.role`
   - 值：`admin` / `supervisor` / `vendor`
   - 代表系統級身份
2. **project role association**：`auth.user_project_roles`
   - 代表某 user 在某 project 下的角色
   - 供 `/auth/me` 與 Dashboard permission filter 使用

### 4.3 ENUM / 參照表建議
**短期可行方案：ENUM**
- 若 BE-002 需要快速 unblock，可先用 ENUM：`admin`, `supervisor`, `vendor`
- 優點：實作簡單、合約穩定
- 風險：未來新增角色需要 migration

**較佳方案：lookup table + user_roles**
- `auth.roles(role_id, role_name, description)`
- `auth.user_roles(user_id, role_id)`
- 優點：擴充性好、適合多角色
- 缺點：比 ENUM 多一層 join

### 4.4 本次建議採用
- **若目標是立即解阻 BE-002**：先採 `auth.users.role` 的 ENUM 方案
- **若同時要兼顧未來擴展**：在 schema proposal 中保留 `auth.roles` / `auth.user_roles` 的升級路線

> 也就是說：**交接給 Backend 的最小提案可用 ENUM；設計上保留表化升級路徑。**

---

## 5. Project Permission Association Strategy

### 5.1 已知需求
`docs/api-contracts-v1.md` 的 `/auth/me` 需要：
- `projects: Array<{ id, name, role }>`
- `permissions: string[]`

這表示使用者不是只擁有一個全域角色，而是可能對不同 project 擁有不同權限。

### 5.2 建議方案
**採 `auth.user_project_roles` 關聯表。**

**建議欄位**
| 欄位 | 型別 | 用途 |
|---|---|---|
| `user_project_role_id` | `BIGSERIAL` / `UUID` | PK |
| `user_id` | FK → `auth.users.user_id` | 使用者 |
| `project_id` | FK → `project.projects.project_id` | 專案 |
| `role` 或 `role_id` | ENUM / FK | 該專案下的角色 |
| `assigned_at` | `TIMESTAMPTZ` | 指派時間 |
| `assigned_by` | nullable FK/ID | 指派者 |

**約束建議**
- `UNIQUE(user_id, project_id)` 或 `UNIQUE(user_id, project_id, role)`
- 若一人只允許一個 project role：用 `UNIQUE(user_id, project_id)`
- 若一人可在單一 project 擁有多角色：用 `UNIQUE(user_id, project_id, role)`

### 5.3 本次對 Backend 的建議
對 BE-002 來說，**最實用的方案是 `user_id + project_id + role` 關聯表**，因為：
- 可直接支援 `/auth/me` 回傳 project role
- 可支援 Dashboard API 中的 project-level authorization
- 未來擴充審計/授權規則較簡單

### 5.4 若要先最小化
若 DB 团队希望先簡化交付，也可暫時用：
- `auth.users.role`（全域身份）
- `auth.user_project_roles`（專案成員關聯）

但不建議只用 `project_ids` array 欄位，原因：
- 無法做 FK integrity
- 無法直接表達 project role
- 權限查詢與審計較弱

---

## 6. Backend Service Account Permissions

### 6.1 需要的連線能力
Backend service account 至少需具備：
- 可連到 PostgreSQL 的 `DATABASE_URL`
- 可跨 `auth` schema 讀寫所需 tables
- 可查詢 `project.projects` 以完成 `/auth/me` 的 project name 組裝

### 6.2 CRUD 權限需求
| Table | Read | Create | Update | Delete | 說明 |
|---|---:|---:|---:|---:|---|
| `auth.users` | ✅ | ✅ | ✅ | ⚠️ 可選 | login / profile / lock / activate |
| `auth.sessions` | ✅ | ✅ | ✅ | ✅ | login, refresh, logout, revoke |
| `auth.audit_login_attempts` | ✅ | ✅ | ❌ 或 limited | ❌ | 主要追加式寫入，通常不刪不改 |
| `project.projects` | ✅ | ❌ | ❌ | ❌ | `/auth/me` 查 project name / id |
| `auth.user_project_roles` | ✅ | ✅ | ✅ | ✅ | 若採 project-role 關聯表 |

### 6.3 權限模型建議
- Backend service account 不應擁有 superuser
- 最好採 **schema-level grants** 或 **專用 DB role**
- `audit_login_attempts` 建議只允許 append + select，避免任意更動稽核資料
- 若採 `refresh_token_hash`，應避免把明文 token 寫入 DB

### 6.4 最低可行權限集
若要讓 BE-002 先可落地，Backend 至少需要：
1. `SELECT/INSERT/UPDATE` on `auth.users`
2. `SELECT/INSERT/UPDATE/DELETE` on `auth.sessions`
3. `SELECT/INSERT` on `auth.audit_login_attempts`
4. `SELECT` on `project.projects`
5. 若有 project-role 關聯表，則需要 `SELECT/INSERT/UPDATE/DELETE` on `auth.user_project_roles`

---

## 7. What Is Verified vs. What Is Still Pending

### 7.1 Verified from workspace docs
- BE-002 確實被 auth schema 阻塞
- API 合約確實依賴 `auth.users`, `auth.sessions`, `auth.audit_login_attempts`
- 先前 workspace 內的 live DB alignment report 已指出 auth tables 不存在
- `auth.user_project_roles` 被 API `/auth/me` 需要

### 7.2 Still pending / not re-verified in this task
- 是否已有新的 live DB migration 在本次任務後出現
- `auth.users` / `auth.sessions` / `auth.audit_login_attempts` 的真實欄位是否與提案一致
- Backend service account 的實際 DB grants 是否已配置

> 因此，本報告對 schema 的描述一律視為**設計提案**，不是既成事實。

---

## 8. Backend-Ready Handoff Notes

Backend 可直接接手 BE-002 的前置條件如下：

1. 使用本報告中的最小 schema 進行 migration 設計
2. 先確定 global role 策略：
   - 快速版：ENUM `admin/supervisor/vendor`
   - 擴展版：`auth.roles` + `auth.user_roles`
3. 確定 project access 方案：
   - 建議 `auth.user_project_roles`
4. 確定 service account 權限：
   - 至少對 `auth.users`, `auth.sessions`, `auth.audit_login_attempts` 具備對應 CRUD
5. 若 live DB 尚未落地，Backend 應將相關行為視為待 migration 完成後再接入

---

## 9. Recommendation

**建議 PM / Backend 採用以下優先級：**
1. 先補 `auth.users`
2. 再補 `auth.sessions`
3. 最後補 `auth.audit_login_attempts`
4. 同時確認 `role` 策略與 `user_project_roles`
5. 再開 BE-002 實作

**最重要的結論：**
- 目前沒有證據可說這些 auth tables 已在 live DB 建成
- 但有足夠證據可以讓 Backend 以本提案立即開始準備 BE-002
- 若 DB team 要快速 unblock，請先以最小 schema + 明確 grants 交付

---

## 10. Appendix: Concise Table-by-Table Answer

### `auth.users`
- **欄位重點**：`user_id`, `username`, `email`, `password_hash`, `role`, `is_active`, `last_login_at`, `created_at`, `updated_at`
- **用途**：使用者主檔與登入識別
- **關聯**：被 `auth.sessions.user_id`、`auth.user_project_roles.user_id` 參照

### `auth.sessions`
- **欄位重點**：`session_id`, `user_id`, `refresh_token_hash`, `expires_at`, `revoked_at`, `device_info`, `ip_address`, `user_agent`, `created_at`, `last_used_at`
- **用途**：refresh token / session lifecycle
- **關聯**：FK → `auth.users.user_id`

### `auth.audit_login_attempts`
- **欄位重點**：`attempt_id`, `username`, `email`, `ip_address`, `user_agent`, `success`, `failure_reason`, `attempted_at`
- **用途**：登入稽核與 rate limit
- **關聯**：最小版可不強制 FK

### role / project 策略
- **role**：建議短期用 ENUM `admin/supervisor/vendor`；長期可升級為 `auth.roles` + `auth.user_roles`
- **project 權限**：建議 `auth.user_project_roles`

### Backend 權限
- 需要 `auth.users`、`auth.sessions`、`auth.audit_login_attempts` 的 CRUD（audit 表以 append 為主）
- 需要 `project.projects` 讀取權限以完成 `/auth/me`
- 若採 project-role 關聯表，需對 `auth.user_project_roles` 有 CRUD
