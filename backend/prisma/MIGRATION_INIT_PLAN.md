# Prisma Migration Init — Readiness Plan

> **狀態 (2026-04-14，BE-309 reconciled)：PREFLIGHT COMPLETE / MIGRATION NOT YET EXECUTED**  
> `backend/prisma/migrations/` 目前**不存在**。  
> 本文件為 migration 初始化前的就緒盤點與執行計畫，不代表任何 migration 已跑完。

---

## 1. 現狀盤點（截至 BE-309 對帳）

| 項目 | 現狀 |
|------|------|
| `backend/prisma/schema.prisma` | ✅ 存在（4 models：User / Session / AuditLoginAttempt / UserProjectRole） |
| `backend/prisma/migrations/` | ❌ **不存在** — 尚未執行 `prisma migrate dev` |
| `backend/prisma.config.ts` | ✅ 存在（Prisma 7.x config 格式） |
| Prisma CLI 版本 | ✅ `7.7.0`（已安裝在 `node_modules`） |
| `backend/package.json` db scripts | ✅ **已補齊**（`db:generate` / `db:validate` / `db:migrate:dev` / `db:migrate:deploy` / `db:migrate:status` / `db:migrate:reset` / `db:push` / `db:studio`） |
| `npx prisma validate` | ✅ **通過**（PM 實跑驗證，schema 對 Prisma 7.x 相容） |
| `schemas = ["auth", "project"]` （datasource） | ✅ 已設定（Prisma 7.x 語法，`previewFeatures = ["multiSchema"]` 已移除；URL 改由 `prisma.config.ts` 管理，`datasource db` 不再含 `url` 欄位） |
| Local PostgreSQL / Docker Compose | ✅ **OPS-306 已落地**（`docker-compose.yml` 含 `pmis_dev` 資料庫 + `pmis` 服務帳號 + `infra/init-schemas.sql`） |
| DATABASE_URL credential 對帳 | ⚠️ **OPS-307 進行中** — `backend/.env.local.example` 的 `DATABASE_URL` 目前為 `postgresql://pmis:***@localhost:5432/pmis_dev`（密碼以 `***` 遮罩，尚未替換為明確可直接使用的 dev 密碼）；`backend/.env.example`（template）內仍殘留舊格式 `tachenpmis`。明確密碼對帳待 OPS-307 完成。 |
| migration 實際執行 | ❌ **尚未執行** |

---

## 2. 前置就緒狀態分層說明

### ✅ 已完成的 preflight

1. **Schema 驗證**：`prisma validate` 通過，schema 語法與 Prisma 7.x 相容
2. **package.json scripts 補齊**：所有 db:* 腳本已就位（BE-308）
3. **Docker Compose 本地 stack**：OPS-306 落地，postgres 服務 `pmis_postgres_dev` 可用，資料庫 `pmis_dev`，schema 初始化 SQL 已掛載
4. **prisma.config.ts**：Prisma 7.x 格式設定檔已建立

### ⚠️ 本地 stack 已建立，但 docs credential 對帳仍部分待完成（OPS-307）

- **`.env.local.example`**：⚠️ OPS-307 **進行中** — 目前 `DATABASE_URL=postgresql://pmis:***@localhost:5432/pmis_dev`（密碼欄位仍為 `***` 遮罩，尚未替換為明確可直接使用的 dev 密碼 `pmis_dev_pw`）；明確密碼對帳待 OPS-307 完成
- **`.env.example`**（template）：⚠️ 仍含舊值 `postgresql://localhost:5432/tachenpmis`，未更新。**開發者請以 `.env.local.example` 為準**，不要沿用 `.env.example` 的 DATABASE_URL
- **`.env`（實際 .gitignored 檔）**：各開發者自行建立，請參考 `.env.local.example` 設定

### ❌ 尚未執行的工作

- **`prisma migrate dev --name init_auth_schema`**：migration 本體尚未執行，`backend/prisma/migrations/` 目錄不存在
- **migration SQL 人工審核**：須在執行後審核 migration.sql 的 DDL 正確性
- **migration push 至 staging / production**：`prisma migrate deploy` 尚未執行

---

## 3. 本地開發快速啟動（OPS-306 stack 就緒後）

```bash
# Step 0：建立 backend/.env（以 .env.local.example 為範本）
cd /home/beer8/team-workspace/UI-UX/backend
cp .env.local.example .env.local
# 確認 DATABASE_URL=postgresql://pmis:pmis_dev_pw@localhost:5432/pmis_dev

# Step 1：啟動本地 postgres stack
cd ..
docker compose up -d postgres
# 等待 health check 通過（約 10 秒）
docker compose ps

# Step 2：確認 DB 連線
cd backend
npx prisma db ping --schema=prisma/schema.prisma

# Step 3：執行 migration init（第一次建立 migrations/ 目錄）
npx prisma migrate dev --name init_auth_schema --schema=prisma/schema.prisma

# Step 4：驗證 migration 狀態
npx prisma migrate status --schema=prisma/schema.prisma

# Step 5：生成 Prisma Client（migrate dev 會自動觸發，可手動確認）
npx prisma generate --schema=prisma/schema.prisma
```

或使用 npm scripts：
```bash
npm run db:validate         # 無需 live DB
npm run db:migrate:dev      # 需 live DB（init 時加 --name）
npm run db:migrate:status   # 確認狀態
npm run db:generate         # 生成 client
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

## 5. 依賴 OPS-306 / OPS-307 的前置條件（備查）

執行 `prisma migrate dev` **需要** live PostgreSQL 連線，以下由 DevOps 提供：

1. **PostgreSQL 服務可連線**（OPS-306 ✅）  
   - `docker-compose up -d postgres`  
   - 驗證：`pg_isready -h localhost -p 5432`

2. **資料庫與 schema 建立**（OPS-306 ✅）  
   - 資料庫：`pmis_dev`  
   - PostgreSQL schemas：`auth`、`project`（由 `infra/init-schemas.sql` 初始化）

3. **Service Account 權限**（OPS-306 ✅）  
   - 帳號 `pmis` 擁有 `pmis_dev` 的 DDL 權限

4. **環境變數 credential 完整對帳**（OPS-307 ⚠️ 部分完成）  
   - `.env.local.example` ⚠️ OPS-307 進行中（密碼欄位仍為 `***`，待明確替換）  
   - `.env.example` template ⚠️ 仍含舊格式，開發者使用 `.env.local.example`  
   - 生產環境需 Secrets Manager 注入，不可使用本地 dev 密碼

---

## 6. 注意事項 / 已知風險

| 風險項目 | 說明 | 緩解措施 |
|----------|------|----------|
| `multiSchema` 需要手動建 schema | Prisma 的 multiSchema 模式不會自動 `CREATE SCHEMA`，需手動或在 init SQL 中補 | OPS-306 的 `infra/init-schemas.sql` 已處理；於 migration.sql review 時二次確認 |
| `UserProjectRole.projectId` FK 暫缺 | `project.projects` 尚未定義，`user_project_roles.project_id` 沒有 FK 約束 | schema.prisma 已標注 DB_PENDING，在 project schema 完成後補齊 FK migration |
| `.env.example` 舊 DATABASE_URL | template 仍含 `tachenpmis` 舊值，未與 OPS-307 對齊 | 開發者以 `.env.local.example` 為準，`tachenpmis` 僅為歷史遺留 |

---

_Last updated: 2026-04-14 by Backend (BE-310 accuracy fix — previewFeatures removed, .env.local.example credential status corrected)_  
_Previous: 2026-04-14 by Backend (BE-309 reconciliation)_  
_OPS-306: ✅ DevOps 本地 postgres stack 已落地_  
_OPS-307: ⚠️ credential 對帳進行中（.env.local.example 密碼欄位仍為 `***`，待明確替換；.env.example template ⚠️ 舊格式殘留）_  
_Migration: ❌ 尚未執行 — `backend/prisma/migrations/` 不存在_
