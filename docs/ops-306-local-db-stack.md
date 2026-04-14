# OPS-306 — 本地 Postgres + Backend 驗證堆疊

| 項目 | 值 |
|------|-----|
| 狀態 | ✅ 完成 |
| 負責人 | DevOps |
| 關聯任務 | OPS-305 (B-08 解除), OPS-306, P1-02 |
| 最後更新 | 2026-04-14 |

---

## 目的

建立可重現的本地 PostgreSQL 驗證環境，讓 Backend / DevOps 開發者能在本機直接執行 `prisma migrate dev`，解除 OPS-305 的 **B-08 blocker**（"no local DB stack to validate migration"），並支撐後續 P1-02 auth 端到端整合測試。

---

## 新增檔案

| 檔案 | 說明 |
|------|------|
| `docker-compose.yml` | 根目錄 compose 主檔；postgres + backend（optional profile） |
| `infra/init-schemas.sql` | 自動建立 `auth` 和 `project` schema + GRANT |
| `backend/.env.local.example` | Backend 本地環境變數範本 |
| `docs/ops-306-local-db-stack.md` | 本說明文件 |

---

## 快速啟動

### 前置條件

- Docker & Docker Compose v2 已安裝（`docker compose version` ≥ 2.0）
- Node.js 20 + npm 已安裝（用於 `prisma` CLI）
- 在 `backend/` 目錄已安裝 npm 依賴：`cd backend && npm install`

### Step 1：啟動 PostgreSQL

```bash
# 在 repo 根目錄執行
docker compose up -d postgres
```

compose 會自動：
1. 啟動 `postgres:16-alpine` 容器（port 5432）
2. 執行 `infra/init-schemas.sql` → 建立 `auth` 和 `project` schema
3. 健康檢查通過後才算 ready（通常 10~20 秒）

驗證 postgres 已就緒：

```bash
docker compose ps postgres
# 應看到：Status = healthy

# 或直接連線測試
docker exec pmis_postgres_dev psql -U pmis -d pmis_dev -c "\dn"
# 應列出 auth 和 project schema
```

### Step 2：設定 Backend 環境變數

```bash
cd backend
cp .env.local.example .env.local
# DATABASE_URL 已對齊 docker-compose.yml 的 postgres service（user: pmis, password: pmis_dev_pw, db: pmis_dev）
# 複製後無需手動修改密碼，可直接執行 prisma migrate dev
```

> ⚠️ **DEV-ONLY**：`pmis_dev_pw` 僅供本地開發環境。`.env.local` 已在 `.gitignore`，不會 commit。
> staging / production 必須使用強隨機密碼並透過 secrets manager 注入，**絕對不可沿用此密碼**。

### Step 3：執行 Prisma Migration

```bash
# 必須在 backend/ 目錄執行
cd backend

# 初始化第一個 migration（首次執行）
npx prisma migrate dev --name init-auth-schema

# 之後每次 schema 變更：
npx prisma migrate dev --name <描述性名稱>
```

成功輸出範例：
```
Environment variables loaded from .env.local
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "pmis_dev", schema "auth" at "localhost:5432"

✔ Generated Prisma Client ...
✔ Your database is now in sync with your schema.
```

> **multiSchema 注意事項**：`schema.prisma` 使用 `schemas = ["auth", "project"]`。
> `infra/init-schemas.sql` 已確保這兩個 schema 在 `prisma migrate dev` 前存在。
> 若 schema 不存在，migrate 會報 `P3014: Prisma Migrate could not create the shadow database`。

### Step 4（選用）：啟動完整 Backend

```bash
# 在 repo 根目錄，使用 full profile 啟動 postgres + backend
docker compose --profile full up -d
```

或直接本機跑 dev server：

```bash
cd backend
npm run dev   # tsx watch src/server.ts，port 3000
```

---

## OPS-305 B-08 解除說明

OPS-305 exec-readiness 報告中的 **B-08 blocker**：
> *"No local DB stack available to validate prisma migrate dev before staging push"*

本 compose 方案解除此 blocker：
- ✅ 提供 postgres:16-alpine 本地容器，可離線驗證 migration
- ✅ 自動建立 multiSchema 所需的 `auth` / `project` schema
- ✅ `prisma migrate dev` 現在可在本機正常執行，不依賴 staging DB
- ✅ `backend/prisma/migrations/` 目錄將在首次 `prisma migrate dev` 後自動建立

---

## 常見問題

### port 5432 被佔用

```bash
# 確認哪個程序佔用
lsof -i :5432

# 若本機有其他 PostgreSQL，可修改 docker-compose.yml ports 為 "5433:5432"
# 同時更新 backend/.env.local 的 DATABASE_URL port
```

### migrate dev 報 P3014 shadow database 錯誤

通常是 `auth` / `project` schema 不存在：

```bash
docker exec pmis_postgres_dev psql -U pmis -d pmis_dev -f /docker-entrypoint-initdb.d/01-init-schemas.sql
# 重新執行 init SQL
```

### 清除所有本地資料重來

```bash
docker compose down -v   # 刪除 volumes（資料清空）
docker compose up -d postgres
cd backend && npx prisma migrate dev --name init-auth-schema
```

---

## 安全注意事項

> ⚠️ `docker-compose.yml` 中的密碼（`pmis_dev_pw`）為 **本地開發專用**。
> staging / production 環境必須使用強隨機密碼，並透過 secrets manager（Vault / AWS SSM / GitHub Secrets）注入，絕對不可 hardcode 或 commit。

---

## 關聯文件

- `docs/ops-305-auth-migration-exec-readiness.md` — exec-readiness 評估
- `backend/prisma/schema.prisma` — Prisma schema（auth domain）
- `backend/Dockerfile` — Backend 多階段建構映像
