# Prisma Migration Init — Readiness Plan

> **狀態 (2026-04-14)：PREFLIGHT / NOT YET EXECUTED**
> `backend/prisma/migrations/` 目前不存在。  
> 本文件為 migration 初始化前的就緒盤點與執行計畫，不代表任何 migration 已跑完。

---

## 1. 現狀盤點

| 項目 | 現狀 |
|------|------|
| `backend/prisma/schema.prisma` | ✅ 存在（4 models：User / Session / AuditLoginAttempt / UserProjectRole） |
| `backend/prisma/migrations/` | ❌ **不存在** — 尚未初始化 |
| Prisma CLI 版本 | ✅ `7.7.0`（已安裝在 `node_modules`） |
| `DATABASE_URL` | ⚠️ 已設定 `postgresql://localhost:5432/tachenpmis`，但本地 PostgreSQL 尚未就緒（OPS-306 pending） |
| `package.json` prisma scripts | ⚠️ **缺少** `db:migrate`, `db:generate`, `db:push` 腳本（見下方「需補齊事項」） |
| `previewFeatures = ["multiSchema"]` | ✅ 已在 schema 中啟用（auth / project 雙 schema） |
| Local PostgreSQL / Docker Compose | ❌ **尚未就緒**（等待 DevOps OPS-306） |

---

## 2. 等待 DevOps 的依賴（阻塞條件）

執行 `prisma migrate dev` **需要** live PostgreSQL 連線。以下是必須由 DevOps（OPS-306）先行提供的前置條件：

1. **PostgreSQL 服務可連線**  
   - 目標：`localhost:5432`（或 docker-compose 服務）  
   - 驗證：`pg_isready -h localhost -p 5432`

2. **資料庫與 schema 建立**  
   - 需要建立 database：`tachenpmis`（或依 `DATABASE_URL` 設定）  
   - 需要建立 PostgreSQL schema：`auth`、`project`（`multiSchema` 模式必要前置）  
   - Prisma 的 multiSchema 模式要求 schema 需先存在，`migrate dev` 才能在對應 schema 建表  

3. **Service Account 權限**  
   - 連線帳號需要 `CREATE TABLE` / `CREATE INDEX` 等建立物件的 DDL 權限  
   - 需要 `USAGE` + `CREATE` on schema `auth` 和 `project`  

4. **環境變數同步**  
   - `DATABASE_URL` 的 user / password 需替換為 DevOps 提供的實際 service account  
   - 生產環境應使用 Secrets Manager，不可 hardcode

---

## 3. Migration Init 最小執行步驟（DevOps stack 就緒後）

```bash
# Step 1：確認 DB 連線
cd backend
npx prisma db ping --schema=prisma/schema.prisma
# 或
pg_isready -h localhost -p 5432

# Step 2：手動建立 multi-schema（若 DevOps 尚未建立）
# 需在 psql 執行：
#   CREATE SCHEMA IF NOT EXISTS auth;
#   CREATE SCHEMA IF NOT EXISTS project;

# Step 3：執行 migration init
npx prisma migrate dev --name init_auth_schema --schema=prisma/schema.prisma

# Step 4：生成 Prisma Client（migration 會自動觸發，但可手動確認）
npx prisma generate --schema=prisma/schema.prisma
```

---

## 4. Migration 執行後的產物與驗證

### 4.1 生成的檔案（需 git commit）

```
backend/prisma/migrations/
└── 20260414XXXXXX_init_auth_schema/
    ├── migration.sql     ← DDL SQL（主要驗收目標）
    └── migration.json    ← Prisma 元資料（自動生成）
```

### 4.2 驗收驗證方式

**Schema 完整性驗證（不需 live DB）：**
```bash
npx prisma validate --schema=prisma/schema.prisma
```

**Migration 狀態驗證（需 live DB）：**
```bash
npx prisma migrate status --schema=prisma/schema.prisma
```

**SQL 產物人工審核 checklist：**
- [ ] `CREATE SCHEMA IF NOT EXISTS "auth";`
- [ ] `CREATE TABLE "auth"."users"` — 含 user_id, username, email, password_hash, role, is_active, last_login_at, created_at, updated_at
- [ ] `CREATE TABLE "auth"."sessions"` — 含 session_id, user_id FK, refresh_token_hash, expires_at, revoked_at
- [ ] `CREATE TABLE "auth"."audit_login_attempts"` — 含 attempt_id, username, ip_address, success, failure_reason
- [ ] `CREATE TABLE "auth"."user_project_roles"` — 含 user_project_role_id, user_id FK, project_id, role
- [ ] `CREATE TYPE "auth"."UserRole" AS ENUM ('admin', 'supervisor', 'vendor')` — 或等效 enum DDL
- [ ] UNIQUE INDEX on `users.username`, `users.email`
- [ ] UNIQUE INDEX on `sessions.refresh_token_hash`
- [ ] UNIQUE INDEX on `user_project_roles.(user_id, project_id)`
- [ ] FK constraints: sessions.user_id → users.user_id (CASCADE DELETE)
- [ ] FK constraints: user_project_roles.user_id → users.user_id (CASCADE DELETE)

**資料庫表格驗證（live DB 就緒後）：**
```bash
# psql 驗證
psql $DATABASE_URL -c "\dt auth.*"
# 應列出: users, sessions, audit_login_attempts, user_project_roles
```

---

## 5. 需補齊的 package.json scripts（建議 DevOps stack 就緒前先補）

目前 `package.json` 缺少以下 Prisma 相關腳本，建議補齊：

```json
"scripts": {
  "db:generate": "prisma generate",
  "db:migrate:dev": "prisma migrate dev --schema=prisma/schema.prisma",
  "db:migrate:deploy": "prisma migrate deploy --schema=prisma/schema.prisma",
  "db:migrate:status": "prisma migrate status --schema=prisma/schema.prisma",
  "db:migrate:reset": "prisma migrate reset --schema=prisma/schema.prisma",
  "db:push": "prisma db push --schema=prisma/schema.prisma",
  "db:studio": "prisma studio --schema=prisma/schema.prisma",
  "db:validate": "prisma validate --schema=prisma/schema.prisma"
}
```

---

## 6. 注意事項 / 已知風險

| 風險項目 | 說明 | 緩解措施 |
|----------|------|----------|
| `multiSchema` 需要手動建 schema | Prisma 的 multiSchema 模式不會自動 `CREATE SCHEMA`，需手動或在 init SQL 中補 | 於 migration.sql review 時確認 schema 建立語句 |
| `UserProjectRole.projectId` FK 暫缺 | `project.projects` 尚未定義，`user_project_roles.project_id` 沒有 FK 約束 | schema.prisma 已標注 DB_PENDING，在 project schema 完成後補齊 FK migration |
| `DATABASE_URL` 含 placeholder | `.env.example` 有 `***` 和重複行，`.env` 使用 `postgresql://localhost:5432/tachenpmis`（無帳密） | DevOps 提供 service account 後更新 `.env`，確認帳密正確 |
| `prisma migrate reset` 會清空 DB | 開發環境誤操作風險 | 只在 feature branch 測試時用，main branch migration 走 `migrate deploy` |
| Migration 歷史一旦開始不可輕易刪除 | 刪除 migration 目錄後若 DB 已套用會導致 schema drift | 每次 migration 前備份，production 走 `migrate deploy` 而非 `migrate dev` |

---

## 7. Git 提交策略

Migration 完成後，以下檔案需要 commit 並 PR：
- `backend/prisma/migrations/XXXXXX_init_auth_schema/migration.sql`
- `backend/prisma/migrations/XXXXXX_init_auth_schema/migration.json`
- `backend/package.json`（補 db:migrate scripts）

**不應 commit 的檔案：**
- `backend/.env`（含 credentials，已在 `.gitignore`）
- `backend/node_modules/`

---

## 8. 實際執行命令（最小集合）

```bash
# 前置（DevOps 提供 stack 後）
export DATABASE_URL="postgresql://SERVICE_ACCOUNT:PASSWORD@localhost:5432/tachenpmis"
# 或確認 backend/.env 已正確設定

# Preflight 驗證（無需 live DB）
cd /home/beer8/team-workspace/UI-UX/backend
npx prisma validate

# Migration init（需 live DB + auth/project schema 已建立）
npx prisma migrate dev --name init_auth_schema

# 驗收
npx prisma migrate status
```

---

_Last updated: 2026-04-14 by Backend_  
_Blocked by: OPS-306 (DevOps local postgres stack)_
