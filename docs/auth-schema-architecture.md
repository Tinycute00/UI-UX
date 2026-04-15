# ulw-loop Auth Schema 架構決策分析與實作方案

**Date:** 2026-04-14  
**Workspace:** `/home/beer8/team-workspace/UI-UX`  
**Purpose:** 大成工程 PMIS Auth 資料層設計與落地方案  
**Status:** 待落地（Migration 尚未執行）

---

## 一、Repo 現況核查

### 1.1 已驗證存在的資源 ✅

| 資源 | 位置/依據 | 狀態 |
|------|----------|------|
| Dashboard Schema | `docs/database-dashboard-auth-alignment.md` 第 31-133 行 | ✅ Live DB 已確認 |
| API 合約 | `docs/api-contracts-v1.md` | ✅ 已定義 |
| 前端 API Client | `src/api/config.js`, `src/api/client.js` | ✅ 存在 |

**已確認存在的 Dashboard Tables (Live DB):**
- `project.projects`
- `project.progress_measurement_baselines`
- `contract.contract_headers`
- `contract.contract_items`
- `vendor.vendors`

### 1.2 已確認缺失的資源 ❌

| 資源 | API 合約依據 | 狀態 |
|------|-------------|------|
| `auth.users` | api-contracts-v1.md:81 | ❌ 不存在 |
| `auth.sessions` | api-contracts-v1.md:82,130,172 | ❌ 不存在 |
| `auth.audit_login_attempts` | api-contracts-v1.md:83 | ❌ 不存在 |
| `auth.user_project_roles` | api-contracts-v1.md:230 | ❌ 不存在 |

### 1.3 Repo 實作位置缺口分析 ⚠️

| 預期類型 | 預期位置 | 實際狀態 |
|---------|---------|---------|
| Migration 檔案 | `db/migrations/` 或 `scripts/` | ❌ 無 |
| ORM Models | `src/models/` 或 `db/models/` | ❌ 無 |
| Seed 資料 | `db/seeds/` 或 `scripts/` | ❌ 無 |
| Backend Server | `src/server/` 或 `server.ts` | ❌ 無 |
| SQL 檔案 | `*.sql` | ❌ 無 |

**結論：** 此 workspace 為純前端專案（Vite + Vanilla JS），無 Backend 實作。所有 Auth Schema 設計將以**提案文件**形式產出，並提供具體的 SQL/DDL 供 Backend team 執行。

---

## 二、架構決策分析

### 2.1 Auth Schema 拆分決策

#### 決策矩陣

| 方案 | 描述 | 優點 | 缺點 | 建議 |
|------|------|------|------|------|
| **方案 A: 合并 sessions + refresh_tokens** | sessions 表同時存 refresh token | 減少 JOIN | 職責不清 | ❌ 不建議 |
| **方案 B: 分離 sessions + refresh_tokens** | sessions 存會話元數據，refresh_tokens 存 token | 職責清晰，擴展性佳 | 多一個表 | ✅ 建議 |
| **方案 C: 不拆分 audit_login_attempts** | 將登入嘗試記錄寫入 sessions 表 | 簡單 | 違反單一職責原則 | ❌ 不建議 |

#### ✅ 採用方案 B：分層 Auth Schema

**拆分理由：**

1. **`sessions` 表**：儲存會話元數據
   - 登入時間、IP、裝置資訊
   - 會話狀態（active/revoked）
   - 與 refresh_token 為 1:N 關係（支援多裝置）

2. **`refresh_tokens` 表**：儲存具體 token
   - token_hash（安全儲存）
   - 過期時間
   - 撤回狀態
   - 支援 token rotation 機制

3. **`audit_login_attempts` 表**：儲存登入嘗試
   - 獨立的稽核資料，與 sessions 無直接耦合
   - 支援帳號鎖定邏輯
   - 定期清理（不影響會話資料）

4. **`user_project_roles` 表**：用戶專案角色
   - API `/me` 需要 `projectIds`
   - 支援多專案、多角色（M:N）

### 2.2 與現有 Dashboard Schema 的依賴邊界

```
┌─────────────────────────────────────────────────────────────────┐
│                        auth.* (新建)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   users     │  │  sessions   │  │  audit_login_attempts   │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘ │
│         │                │                                       │
│         └───────┬────────┘                                       │
│                 │                                                │
│         ┌───────▼───────┐       ┌──────────────────────┐       │
│         │user_project  │       │       roles           │       │
│         │   _roles     │       └──────────────────────┘       │
│         └───────┬───────┘                                       │
└─────────────────┼───────────────────────────────────────────────┘
                  │
                  │ created_by/updated_by (FK, Future)
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   已存在的 Dashboard Tables                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │project.projects│ │contract.*    │  │   vendor.vendors     │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**依賴邊界說明：**
- `auth.users` 目前無依賴現有 tables
- `auth.users.created_by/updated_by` 為 Future Work（目前是 VARCHAR）
- 初期不做強制 FK，未來透過 Migration 升級

---

## 三、最小可行模型（Minimum Viable Schema）

### 3.1 Schema 清單

| Table | 用途 | 與 API 合約對應 |
|-------|------|-----------------|
| `auth.users` | 使用者主檔 | `/auth/login`, `/auth/me` |
| `auth.roles` | 角色定義 | 權限模型基礎 |
| `auth.user_roles` | 使用者-角色對應 | `/auth/me` role 欄位 |
| `auth.sessions` | 會話管理 | `/auth/logout`, `/auth/refresh` |
| `auth.refresh_tokens` | JWT Refresh Token | `/auth/refresh` |
| `auth.audit_login_attempts` | 登入稽核 | `/auth/login` rate limit |
| `auth.user_project_roles` | 使用者-專案-角色對應 | `/auth/me` projectIds |

### 3.2 DDL - auth.users

```sql
CREATE TABLE auth.users (
    user_id         BIGSERIAL PRIMARY KEY,
    username        VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(200),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked       BOOLEAN NOT NULL DEFAULT FALSE,
    locked_until    TIMESTAMPTZ,
    last_login_at   TIMESTAMPTZ,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_username ON auth.users(username);
CREATE INDEX idx_users_is_active ON auth.users(is_active);
```

### 3.3 DDL - auth.roles

```sql
CREATE TABLE auth.roles (
    role_id         BIGSERIAL PRIMARY KEY,
    role_name       VARCHAR(50) NOT NULL UNIQUE,
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.4 DDL - auth.user_roles

```sql
CREATE TABLE auth.user_roles (
    user_id         BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE CASCADE,
    role_id         BIGINT NOT NULL REFERENCES auth.roles(role_id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by     BIGINT,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON auth.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON auth.user_roles(role_id);
```

### 3.5 DDL - auth.sessions

```sql
CREATE TABLE auth.sessions (
    session_id      BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE CASCADE,
    device_info     VARCHAR(255),
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sessions_is_active ON auth.sessions(is_active);
CREATE INDEX idx_sessions_created_at ON auth.sessions(created_at);
```

### 3.6 DDL - auth.refresh_tokens

```sql
CREATE TABLE auth.refresh_tokens (
    token_id        BIGSERIAL PRIMARY KEY,
    session_id      BIGINT NOT NULL REFERENCES auth.sessions(session_id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    family          VARCHAR(64) NOT NULL,
    token_seq       INTEGER NOT NULL DEFAULT 1,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ,
    
    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON auth.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_session_id ON auth.refresh_tokens(session_id);
CREATE INDEX idx_refresh_tokens_expires ON auth.refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_family ON auth.refresh_tokens(family);
CREATE INDEX idx_refresh_tokens_hash ON auth.refresh_tokens(token_hash);
```

**設計說明：**
- `family` 欄位用於 Refresh Token Rotation 機制
- 每次 refresh 產生新 token 但 family 不變，舊 token revoke
- 偵測到 reuse 時可撤銷整個 family（防盜用）

### 3.7 DDL - auth.audit_login_attempts

```sql
CREATE TABLE auth.audit_login_attempts (
    attempt_id      BIGSERIAL PRIMARY KEY,
    username        VARCHAR(100),
    email           VARCHAR(255),
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    success         BOOLEAN NOT NULL,
    failure_reason  VARCHAR(100),
    attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_login_attempts_username ON auth.audit_login_attempts(username);
CREATE INDEX idx_audit_login_attempts_ip ON auth.audit_login_attempts(ip_address);
CREATE INDEX idx_audit_login_attempts_attempted_at ON auth.audit_login_attempts(attempted_at);
CREATE INDEX idx_audit_login_attempts_success ON auth.audit_login_attempts(success);
```

### 3.8 DDL - auth.user_project_roles

```sql
CREATE TABLE auth.user_project_roles (
    user_project_role_id  BIGSERIAL PRIMARY KEY,
    user_id               BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE CASCADE,
    project_id            BIGINT NOT NULL REFERENCES project.projects(project_id) ON DELETE CASCADE,
    role_id               BIGINT NOT NULL REFERENCES auth.roles(role_id) ON DELETE CASCADE,
    assigned_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by           BIGINT,
    
    CONSTRAINT uq_user_project_role UNIQUE (user_id, project_id, role_id)
);

CREATE INDEX idx_user_project_roles_user_id ON auth.user_project_roles(user_id);
CREATE INDEX idx_user_project_roles_project_id ON auth.user_project_roles(project_id);
CREATE INDEX idx_user_project_roles_role_id ON auth.user_project_roles(role_id);
```

**⚠️ 注意：** 此表依賴 `project.projects.project_id`，需確認該欄位為 BIGINT 而非 UUID（依據 dashboard 文件確認為 BIGINT）。

---

## 四、Seed 資料

### 4.1 預設角色

```sql
INSERT INTO auth.roles (role_name, description) VALUES 
    ('admin', '系統管理者'),
    ('supervisor', '監造/現場主管'),
    ('vendor', '協力廠商');
```

### 4.2 測試用管理員帳號

```sql
INSERT INTO auth.users (username, email, password_hash, full_name, is_active) VALUES 
    ('admin', 'admin@pmis.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWkJ1r8gTQHO', '系統管理員', TRUE);

INSERT INTO auth.user_roles (user_id, role_id) 
SELECT u.user_id, r.role_id 
FROM auth.users u, auth.roles r 
WHERE u.username = 'admin' AND r.role_name = 'admin';
```

**密碼說明：** `$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWkJ1r8gTQHO` 為 `password123` 的 bcrypt hash，**僅供測試環境使用**。

---

## 五、API 合約對齊分析

### 5.1 DTO 與資料庫欄位映射

| API Response 欄位 | 來源 Table | 備註 |
|-------------------|-----------|------|
| `user.id` | `auth.users.user_id` | 需轉 string |
| `user.username` | `auth.users.username` | - |
| `user.displayName` | `auth.users.full_name` | - |
| `user.email` | `auth.users.email` | - |
| `user.role` | `auth.roles.role_name` (via user_roles) | 預設取第一個角色 |
| `user.projectIds` | `auth.user_project_roles.project_id` | array |
| `user.lastLoginAt` | `auth.users.last_login_at` | - |

### 5.2 需 Backend 調整的 DTO

```typescript
// api-contracts-v1.md LoginResponseDTO.user
interface UserInfo {
  id: string;           // auth.users.user_id (需轉 string)
  username: string;     // auth.users.username
  displayName: string;  // auth.users.full_name (建議改名)
  email: string;        // auth.users.email
  role: 'admin' | 'supervisor' | 'vendor';  // 來自 auth.user_roles + auth.roles
  projectIds: string[];  // 來自 auth.user_project_roles (新增)
}
```

### 5.3 資料庫支撐的欄位

| 欄位 | DB 支撐 | 說明 |
|------|--------|------|
| `user.role` | ✅ | 需 JOIN auth.user_roles + auth.roles |
| `user.projectIds` | ✅ | 需 JOIN auth.user_project_roles |
| `user.lastLoginAt` | ✅ | auth.users.last_login_at |
| 帳號鎖定 | ✅ | auth.users.is_locked, locked_until |
| 登入失敗次數 | ✅ | auth.users.failed_attempts |
| 登入稽核 | ✅ | auth.audit_login_attempts |

### 5.4 Future-Only 欄位（不纳入 Phase 1）

| 欄位 | 說明 | 依據 |
|------|------|------|
| `permissions[]` | 細粒度權限陣列 | api-contracts-v1.md `/me` 有此欄位，但 Phase 1 可用 role-based 代替 |
| 密碼過期策略 | 需額外欄位 | 尚未在 API 合約定義 |
| MFA/2FA | 需額外表 | Phase 2 |

---

## 六、實作落點建議

### 6.1 建議的 Backend 專案結構

```
backend/
├── db/
│   ├── migrations/
│   │   └── 001_auth_schema.sql
│   ├── seeds/
│   │   └── auth_seed.sql
│   └── models/
│       └── auth/
│           ├── user.model.ts
│           ├── session.model.ts
│           └── refresh-token.model.ts
├── src/
│   ├── routes/
│   │   └── auth.routes.ts
│   ├── services/
│   │   └── auth.service.ts
│   └── middleware/
│       └── auth.middleware.ts
└── prisma/
    └── schema.prisma  (or other ORM)
```

### 6.2 Migration 檔案位置

建議 Backend team 建立於：`db/migrations/001_auth_schema.sql`

### 6.3 需要確認的阻塞項目

| 項目 | 負責方 | 說明 |
|------|--------|------|
| 資料庫連線資訊 | DevOps/DBA | 目前 repo 無 `.env` 或連線字串 |
| 密碼雜湊演算法版本 | Backend | 建議 bcrypt cost factor = 12 |
| JWT secret 管理 | Backend | 建議使用 Vault 或 KMS |
| Refresh token 有效期 | Backend | 建議 7-30 天（可配置） |

---

## 七、回滾方案

### 7.1 Migration Down

若需回滾 001_auth_schema：

```sql
-- 回滾順序（反向依賴）

-- 1. 刪除 user_project_roles（依賴 project.projects）
DROP TABLE IF EXISTS auth.user_project_roles;

-- 2. 刪除 audit_login_attempts（無依賴）
DROP TABLE IF EXISTS auth.audit_login_attempts;

-- 3. 刪除 refresh_tokens（依賴 sessions）
DROP TABLE IF EXISTS auth.refresh_tokens;

-- 4. 刪除 sessions
DROP TABLE IF EXISTS auth.sessions;

-- 5. 刪除 user_roles
DROP TABLE IF EXISTS auth.user_roles;

-- 6. 刪除 roles
DROP TABLE IF EXISTS auth.roles;

-- 7. 刪除 users（最後，因其他表可能有 created_by FK）
DROP TABLE IF EXISTS auth.users;

-- 8. 刪除 schema
DROP SCHEMA IF EXISTS auth CASCADE;
```

### 7.2 驗證命令

```sql
-- 驗證所有 auth tables 已建立
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 預期輸出：
-- audit_login_attempts
-- refresh_tokens
-- roles
-- sessions
-- user_project_roles
-- user_roles
-- users

-- 驗證 FK 關聯
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'auth';

-- 驗證預設角色已建立
SELECT * FROM auth.roles;

-- 驗證測試帳號已建立
SELECT user_id, username, email, is_active FROM auth.users;
```

---

## 八、產出摘要

### 8.1 分類清單

| 類別 | 項目 | 狀態 |
|------|------|------|
| **已驗證存在** | project.projects | ✅ |
| | project.progress_measurement_baselines | ✅ |
| | contract.contract_headers | ✅ |
| | contract.contract_items | ✅ |
| | vendor.vendors | ✅ |
| **缺失/待設計** | auth.users | ❌ 提案完成 |
| | auth.roles | ❌ 提案完成 |
| | auth.user_roles | ❌ 提案完成 |
| | auth.sessions | ❌ 提案完成 |
| | auth.refresh_tokens | ❌ 提案完成 |
| | auth.audit_login_attempts | ❌ 提案完成 |
| | auth.user_project_roles | ❌ 提案完成 |
| **Repo 缺口** | Backend migration 實作位置 | ❌ 無 |
| | ORM Models | ❌ 無 |
| | Backend Server | ❌ 無 |

### 8.2 交付物

| 檔案 | 位置 | 用途 |
|------|------|------|
| 本文件 | `docs/auth-schema-architecture.md` | 完整分析報告 |
| Migration SQL | `docs/sql/001_auth_schema.sql` | 可直接執行 |
| Rollback SQL | `docs/sql/001_auth_schema_down.sql` | 回滾用 |
| Seed SQL | `docs/sql/auth_seed.sql` | 預設資料 |

---

## 九、Backend 團隊 Action Items

| # | Action | 負責方 | 優先級 |
|---|--------|--------|--------|
| 1 | 確認 DB 連線資訊 | DevOps | P0 (Blocker) |
| 2 | 執行 Migration | DBA | P0 |
| 3 | 執行 Seed | DBA | P0 |
| 4 | 實作 auth.service.ts | Backend | P1 |
| 5 | 實作 auth.routes.ts | Backend | P1 |
| 6 | 對齊 LoginResponseDTO | Backend | P1 |
| 7 | 對齊 GetCurrentUserResponseDTO | Backend | P1 |
| 8 | 實作 JWT middleware | Backend | P2 |
| 9 | 實作帳號鎖定邏輯 | Backend | P2 |

---

**Document Path:** `/home/beer8/team-workspace/UI-UX/docs/auth-schema-architecture.md`
**Generated:** 2026-04-14
**Next Review:** 需 DB 連線資訊確認後
