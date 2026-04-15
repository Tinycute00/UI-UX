# BE-002 依賴清單與 Database 交接點分析

> **產出時間**：2026-04-14  
> **依據文件**：docs/backend-task-board.md、docs/api-contracts-v1.md  
> **狀態**：⚠️ 等待 Database Role 完成

---

## 現況摘要

**BE-001（API 基礎架構）**：✅ 已完成  
**BE-002（身份驗證 API）**：🔴 阻塞中 — 等待以下 DB tables 就緒

---

## BE-002 必要 Database Tables（未驗證）

下列 tables 在 `docs/backend-task-board.md` 中明確標示為「待 DB role 設計」：

| Table | 用途 | 狀態 |
|-------|------|------|
| `auth.users` | 使用者帳號、密碼 hash、角色 | ❌ 未建立 |
| `auth.sessions` | Refresh token 儲存與撤銷 | ❌ 未建立 |
| `auth.audit_login_attempts` | 登入嘗試記錄（防暴力破解用） | ❌ 未建立 |

**重要**：以上 tables 均為「待 database role 設計」狀態，Backend **不可**假設其 schema 格式。

---

## BE-002 需要確認的 Schema 細節

Database Role 設計時，需要提供以下欄位規格供 Backend 接上：

### `auth.users` 必需欄位

```sql
-- Backend 需要的最小欄位集
id           UUID or BIGINT  PRIMARY KEY
username     VARCHAR         UNIQUE NOT NULL  -- 登入帳號（員工編號或 email）
email        VARCHAR         UNIQUE
password_hash VARCHAR        NOT NULL         -- bcrypt hash
display_name VARCHAR         NOT NULL
role         ENUM('admin','supervisor','vendor') NOT NULL
project_ids  UUID[]          or 關聯表       -- 使用者有權限的專案清單
is_active    BOOLEAN         DEFAULT true
created_at   TIMESTAMPTZ     DEFAULT now()
updated_at   TIMESTAMPTZ
```

### `auth.sessions` 必需欄位

```sql
id              UUID        PRIMARY KEY
user_id         FK → auth.users.id
refresh_token   TEXT        UNIQUE NOT NULL  -- hashed refresh token
expires_at      TIMESTAMPTZ NOT NULL
created_at      TIMESTAMPTZ DEFAULT now()
revoked_at      TIMESTAMPTZ                 -- NULL 表示有效
device_info     JSONB                       -- optional: 裝置/IP 記錄
```

### `auth.audit_login_attempts` 必需欄位

```sql
id          UUID        PRIMARY KEY
username    VARCHAR     NOT NULL
ip_address  INET
success     BOOLEAN     NOT NULL
attempt_at  TIMESTAMPTZ DEFAULT now()
failure_reason VARCHAR  -- 'wrong_password', 'account_locked', etc.
```

---

## BE-002 可以提前準備的部分（不需要 DB schema）

下列工作可以在 DB schema 確認前先完成：

| 工作項目 | 說明 | 需要 DB? |
|---------|------|---------|
| JWT 工具函式 | `signToken()`, `verifyToken()`, `parseToken()` | ❌ 不需要 |
| bcrypt 工具函式 | `hashPassword()`, `comparePassword()` | ❌ 不需要 |
| JWT middleware | `authenticateRequest()` — 驗證 bearer token | ❌ 不需要 |
| Auth 路由骨架 | POST /auth/login, /auth/logout, /auth/refresh, GET /auth/me | ❌ 不需要（實際查詢 DB 需要） |
| DTO 型別定義 | LoginRequestDTO, LoginResponseDTO, etc. | ❌ 不需要 |
| Rate limiter 工具 | In-memory 暴力破解防護（暫用，DB 就緒後改為持久化） | ❌ 不需要 |

---

## 交接點協議

### Database → Backend 交接條件

Database Role 完成以下工作後，Backend 即可開始 BE-002 實作：

1. ✅ 確認 `auth.users`、`auth.sessions`、`auth.audit_login_attempts` table schema
2. ✅ 提供資料庫連線資訊（DATABASE_URL）
3. ✅ 確認 Backend service account 具備 CRUD 權限
4. ✅ 確認 `role` 欄位的 ENUM 值（admin/supervisor/vendor 或其他）
5. ✅ 確認 `project_ids` 關聯方式（陣列欄位 or 關聯表 `user_project_permissions`）

### Backend 交接給 Frontend 的條件（FE-002 依賴）

1. ✅ BE-001 完成（API 基礎架構）← 已達成
2. ✅ BE-002 完成（Auth API）
3. ✅ API 合約確認（POST /api/v1/auth/login 格式），見 docs/api-contracts-v1.md

---

## 阻塞風險評估

| 風險 | 嚴重度 | 說明 |
|------|--------|------|
| DB schema 延遲 | 🔴 高 | BE-002~BE-005 全部阻塞 |
| users table role 設計不一致 | 🟡 中 | 如 role ENUM 與 API 合約不符，需重新協商 |
| project 權限關聯方式未定 | 🟡 中 | 影響 Dashboard API 查詢邏輯 |

---

## 建議行動

1. **立即**：PM 確認 database role 派發，解除 RISK-001 阻塞
2. **BE-001 完成後可立即推進**：BE-002 的 JWT/bcrypt 工具層（不依賴 DB）
3. **DB schema 就緒後 3 天內**：完成 BE-002 完整實作
