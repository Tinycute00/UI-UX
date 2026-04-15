# OPS-305 Auth Migration 執行就緒度盤點報告

**Date:** 2026-04-14  
**Workspace:** `/home/beer8/team-workspace/UI-UX`  
**Scope:** `auth` schema migration 上線執行就緒度評估  
**Input sources:**
- `docs/db-303-live-auth-migration-plan.md`（DB-303 migration/grants draft）
- `backend/prisma/schema.prisma`（BE-305 Prisma schema）
- `backend/.env.example`（環境變數範本）
- `.github/workflows/ci.yml`（CI pipeline）
- `.github/workflows/deploy.yml`（部署 pipeline）
- `backend/Dockerfile`（Docker 建構）

**Status:** 🔴 **Not Ready** — 18 項前置條件缺失，8 個 Blocker 需解除。

---

## ⚠️ Explicit Non-Claims（不可聲明事項）

1. 本文件 **不聲明** auth schema 已存在於 live DB。
2. 本文件 **不聲明** DB-303 migration SQL 已執行。
3. 本文件 **不聲明** 任何 GRANT 已生效或已驗證。
4. 本文件 **不聲明** staging 環境已就緒或已通過測試。
5. 本文件 **僅為執行就緒度盤點**，所有狀態標記基於已知事實，不做假設性推斷。

---

## 1. 前置條件清單（Prerequisites Checklist）

### 1.1 目標資料庫連線確認

| # | 前置條件 | 狀態 | 說明 |
|---|---------|------|------|
| 1.1.1 | 目標 DB host / port / dbname 已確認 | ❌ | `.env.example` 僅有 `postgresql://localhost:5432/tachenpmis` 本地開發佔位符，無實際 production host、port、dbname 資訊 |
| 1.1.2 | SSL 連線設定已確認 | ❌ | 尚未定義是否需要 SSL（`?ssl=true` / `?sslmode=require`），production 通常需要 |
| 1.1.3 | 連線可達性驗證已完成 | ❌ | 無任何人員確認過可從部署環境連線至目標 DB |
| 1.1.4 | 連線 credential（非 root）可用於 migration | ❌ | 未確認 migration role 的 host-based auth 或 password 機制 |

### 1.2 Role / Credentials 確認

| # | 前置條件 | 狀態 | 說明 |
|---|---------|------|------|
| 1.2.1 | `<migration_role>` 實際名稱已確認 | ❌ | DB-303 grants draft 使用佔位符 `<migration_role>`，尚未替換為 production role name |
| 1.2.2 | `<backend_service_role>` 實際名稱已確認 | ❌ | DB-303 grants draft 使用佔位符 `<backend_service_role>`，尚未替換 |
| 1.2.3 | migration role credentials 已安全儲存 | ❌ | 無 `MIGRATION_DATABASE_URL` 或 `POSTGRES_USER` / `POSTGRES_PASSWORD` 環境變數定義 |
| 1.2.4 | backend service role credentials 已安全儲存 | ❌ | `.env.example` 的 `DATABASE_URL` 為本地開發佔位符，無 production credential |
| 1.2.5 | Role 權限已驗證（migration role 需 CREATE SCHEMA + CREATE TABLE；backend service role 需 USAGE + CRUD） | ❌ | 未在任何環境驗證過 |

### 1.3 Schema 依賴確認

| # | 前置條件 | 狀態 | 說明 |
|---|---------|------|------|
| 1.3.1 | `project.projects` 在目標 DB 中已存在 | ⚠️ | DB-303 引用此前 live alignment evidence 確認 `project.projects` 存在，但 **DB-303 明確聲明未在此任務重新驗證** |
| 1.3.2 | `project.projects.project_id` 欄位型別為 `BIGINT` | ⚠️ | 同上，來自過往 evidence，未在本次重新驗證 |
| 1.3.3 | `auth` schema 在目標 DB 中尚不存在（避免 `IF NOT EXISTS` 隱藏衝突） | ⚠️ | DB-303 引用 dashboard alignment report 指出 auth tables missing，但未重新驗證目標 DB 是否已有殘留物件 |
| 1.3.4 | Prisma `multiSchema` preview feature 與目標 DB PG 版本相容 | ❌ | Prisma `multiSchema` 為 preview feature，未在目標 PG 版本驗證過 |

### 1.4 CI/CD Pipeline 就緒

| # | 前置條件 | 狀態 | 說明 |
|---|---------|------|------|
| 1.4.1 | `prisma migrate deploy` 步驟已加入 deploy pipeline | ❌ | `deploy.yml` 僅部署 frontend 至 GitHub Pages，無任何 backend deployment 或 DB migration 步驟 |
| 1.4.2 | `DATABASE_URL` / `MIGRATION_DATABASE_URL` secrets 已注入 CI/CD 環境 | ❌ | CI/CD 無任何 DB 相關 secret 定義（無 `secrets.DATABASE_URL` 等） |
| 1.4.3 | Migration 前 DB backup/snapshot step 已存在 | ❌ | CI/CD 中無任何備份機制（無 `pg_dump`、無 cloud snapshot trigger） |
| 1.4.4 | Staging / production 環境分離機制已建立 | ❌ | 僅有 `github-pages` environment，無 staging / production DB 環境分離 |
| 1.4.5 | Rollback trigger / automation 已建立 | ❌ | 無任何 rollback pipeline 或手動 rollback trigger（無 `workflow_dispatch` rollback job） |
| 1.4.6 | CI 已包含 backend test 步驟 | ✅ | `ci.yml` 的 `backend` job 有 `npm test` 和 `npm run build` |

### 1.5 Docker / Infrastructure

| # | 前置條件 | 狀態 | 說明 |
|---|---------|------|------|
| 1.5.1 | `docker-compose.yml` 可拉起完整 stack（postgres + backend + migration init） | ❌ | 專案根目錄及 `backend/` 中均無 `docker-compose.yml` |
| 1.5.2 | Migration container 或 init script 定義 | ❌ | 無 migration container / init-migration script |
| 1.5.3 | Test DB container 定義 | ❌ | 無 test DB container，CI 中的 backend test 可能使用 Vitest mock 而非真實 DB |
| 1.5.4 | Backend Dockerfile 含 `prisma generate` + `prisma migrate deploy` | ❌ | `backend/Dockerfile` 為 multi-stage build（node:20-alpine），但未包含 `prisma generate` 或 `prisma migrate deploy` 步驟 |

### 1.6 Prisma Migration 狀態

| # | 前置條件 | 狀態 | 說明 |
|---|---------|------|------|
| 1.6.1 | `prisma/migrations/` 目錄存在且包含 baseline migration | ❌ | 目錄不存在，`prisma migrate dev` 或 `prisma migrate diff` 從未執行 |
| 1.6.2 | `_prisma_migrations` tracking table 機制已在目標 DB 就位 | ❌ | 從未執行過任何 Prisma migration |
| 1.6.3 | Prisma schema 與 DDL draft 一致性已驗證 | ⚠️ | 整體一致，但 `user_project_roles.project` FK 在 Prisma 中仍為 comment out，DDL draft 則包含此 FK。需決策是否首次 migration 就啟用 |

### 1.7 安全 / Secrets

| # | 前置條件 | 狀態 | 說明 |
|---|---------|------|------|
| 1.7.1 | `JWT_SECRET` 已使用 production-grade 強隨機值 | ❌ | `.env.example` 內為 `dev-secret-key-at-least-32-characters-long!` 佔位符，非 production 值 |
| 1.7.2 | DB credentials 已存入 secrets manager（GitHub Secrets / Vault 等） | ❌ | 無證據顯示已設定任何 production secrets |
| 1.7.3 | `CORS_ORIGIN` 已設定為 production 域名 | ❌ | 當前為 `*`（允許所有來源），不適用於 production |

---

## 2. Blocker 清單（Migration 無法執行的根本原因）

按嚴重度排序。**任何一個 CRITICAL blocker 未解除，即無法安全執行 live migration。**

### 🔴 CRITICAL — 必須解除才能執行

| # | Blocker | 影響 | 說明 |
|---|---------|------|------|
| B-01 | **無 production DB 連線資訊** | 無法連線目標 DB，所有後續步驟無法開始 | host / port / dbname / SSL 設定均未知，`DATABASE_URL` 為本地佔位符 |
| B-02 | **無 migration role 與 backend service role 名稱及 credentials** | DDL 的 GRANT 語句無法填入實際值，權限管理無法設定 | DB-303 使用 `<migration_role>` 和 `<backend_service_role>` 佔位符 |
| B-03 | **無 CI/CD DB migration 步驟** | 即使 DDL 正確，也沒有自動化路徑可執行 migration | `deploy.yml` 僅部署 frontend，無 backend deployment / DB migration job |
| B-04 | **`project.projects` FK 依賴未在目標 DB 重新驗證** | DDL 中 `auth.user_project_roles.project_id` 硬性 REFERENCES `project.projects(project_id)`，若目標 DB 中 project schema 不存在，migration 會直接失敗 | DB-303 引用過往 evidence 但明確聲明未重新驗證 |
| B-05 | **`prisma/migrations/` 目錄不存在** | Prisma 無法以 `prisma migrate deploy` 執行 structured migration；需先生成 baseline | 從未執行 `prisma migrate dev` |

### 🟠 HIGH — 強烈建議解除後才執行

| # | Blocker | 影響 | 說明 |
|---|---------|------|------|
| B-06 | **無 docker-compose 或 infrastructure 定義** | 無法本地端到端驗證 migration；無法快速 rollback 測試 | 缺少 postgres container、migration container、test DB 等 |
| B-07 | **無 DB backup/snapshot 機制** | Migration 失敗時無法回復至執行前狀態 | CI/CD 無 backup step，也無手動 DB snapshot SOP |
| B-08 | **無 staging 環境** | 無法在 production 前驗證 migration 行為；直接跑 prod 風險極高 | 僅有 `github-pages` environment，無 staging DB |

### 🟡 MEDIUM — 可在首次 migration 後跟進，但建議提前收斂

| # | Blocker | 影響 | 說明 |
|---|---------|------|------|
| B-09 | **Prisma schema FK 差異未收斂** | Prisma 中 `user_project_roles.project` relation 被 comment out，DDL draft 則包含此 FK。若不統一，Prisma generate 與實際 DB 將不一致 | 需決策：首次 migration 是否啟用此 FK |
| B-10 | **`updated_at` trigger 策略未決定** | Prisma `@updatedAt` 可處理 Prisma-managed writes，但若有非 Prisma writer 將 stale data | DB-303 Section 2.2 標注需決策 |

---

## 3. Rollback / 風險控制策略

### 3.1 DB-303 Section 7 Rollback Plan（直接引用）

Rollback 順序為 creation 的逆向操作：

1. **Revoke grants** from `<backend_service_role>`
2. **Drop** `auth.user_project_roles`
3. **Drop** `auth.audit_login_attempts`
4. **Drop** `auth.sessions`
5. **Drop** `auth.users`
6. **Drop enum type** `auth."UserRole"`（需在 dependent objects 移除後執行）
7. **Optionally drop schema `auth`**（僅當 schema 為空且無其他物件依賴時）

> ⚠️ Rollback 必須在確認無 live data 依賴新 auth 物件後方可執行。

### 3.2 Ops 層 Rollback 執行細節與補充

#### 3.2.1 Rollback SQL 腳本（基於 DB-303 Section 7，加上 idempotent 防護）

```sql
-- ================================================================
-- Rollback Script for auth schema migration (OPS-305)
-- Execute ONLY after confirming no live data depends on auth objects
-- All statements use IF EXISTS to be idempotent
-- ================================================================

-- Step 1: 切斷 service account 存取（revoke grants）
REVOKE ALL ON ALL TABLES IN SCHEMA auth FROM <backend_service_role>;
REVOKE USAGE ON SCHEMA auth FROM <backend_service_role>;
REVOKE USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth FROM <backend_service_role>;

-- Step 2-5: 依 FK 依賴順序 drop tables（reverse of creation）
DROP TABLE IF EXISTS auth.user_project_roles CASCADE;
DROP TABLE IF EXISTS auth.audit_login_attempts CASCADE;
DROP TABLE IF EXISTS auth.sessions CASCADE;
DROP TABLE IF EXISTS auth.users CASCADE;

-- Step 6: Drop enum type（所有 dependent columns 已清除）
DROP TYPE IF EXISTS auth."UserRole";

-- Step 7: Optionally drop schema（確認為空後才執行）
-- DROP SCHEMA IF EXISTS auth;
```

#### 3.2.2 Prisma 層 Rollback

| 項目 | 說明 |
|------|------|
| `prisma migrate resolve` | 若使用 `prisma migrate deploy`，rollback 需執行 `prisma migrate resolve --rolled-back <migration_name>` 並手動執行上述 rollback SQL |
| 自訂 down migration | 建議在 `prisma/migrations/` 中為每個 migration 建立 `undo_XXX.sql` 並納入版本控制 |
| Pipeline 回滾 | 建議新增 `workflow_dispatch` rollback job，可一鍵觸發 rollback SQL |

#### 3.2.3 Backup 策略

| 項目 | 說明 |
|------|------|
| ⚠️ 目前狀態 | CI/CD 無任何 DB backup 步驟，無 `pg_dump`，無 cloud snapshot |
| 建議 | Migration 前執行 `pg_dump`（目標 DB 全量或僅 auth schema），或觸發 cloud provider snapshot |
| 保留期 | 至少保留 24 小時，建議 7 天 |
| 還原測試 | 需至少一次從 backup 成功還原的測試紀錄 |

#### 3.2.4 觸發時機

| 情境 | 行動 |
|------|------|
| Migration DDL 執行後驗證失敗（table 缺失、FK 不通、grants 未生效） | 立即執行 rollback SQL |
| Backend service 啟動後 auth API health check 失敗 | 評估是否需 rollback 或 hotfix |
| 安全事件（credential 洩漏等） | Rollback 並輪替 secrets |

### 3.3 風險控制矩陣

| 風險 | 可能性 | 影響 | 控制策略 |
|------|--------|------|---------|
| `project.projects` 不存在導致 FK 失敗 | 中 | 🔴 Migration 整體失敗 | 執行前驗證 `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='project' AND table_name='projects')`；或改用 deferred FK |
| Role name 佔位符未替換 | 高 | 🔴 GRANT 全部失敗 | 執行前由 DBA 確認並替換所有 `<...>` 佔位符 |
| SSL 連線未設定 | 中 | 🟠 應用層連線失敗 | 在 `DATABASE_URL` 加入 `?sslmode=require` 並測試 |
| Backend service 權限過大 | 低 | 🟠 安全風險 | DB-303 Section 5.4 已限制不 grant superuser；建議執行後以 `\dp` 驗證 |
| `updated_at` 無 trigger 導致 stale data | 低 | 🟡 資料正確性 | Prisma `@updatedAt` 可處理 app writes，需確認是否有非 Prisma writer |
| Staging 與 production schema 不一致 | 中 | 🟠 行為差異 | 首次 migration 需在 staging 先跑完整 DDL 並驗證 |
| Service account 權限不足（migration role 缺少 CREATE SCHEMA） | 中 | 🔴 Migration 失敗 | 預先用 `\du` 確認 role 屬性 |

---

## 4. Ops Handoff 清單（PM 排程用）

以下為 PM 可直接拿來排程的下一步行動清單，按優先順序排列。

### Priority 1 — 🔴 Blocker 解除（必須先完成才能進入 staging 測試）

| # | 行動項目 | 負責角色 | 預估複雜度 | 前置依賴 | 產出物 |
|---|---------|----------|-----------|---------|-------|
| H-01 | 取得 production DB 連線資訊（host / port / dbname / SSL 設定 / root credential） | DevOps / DBA | 低 | 無 | 可連線的 `DATABASE_URL` |
| H-02 | 確認 / 建立 migration role 與 backend service role（名稱、密碼、權限邊界） | DBA | 中 | H-01 | 兩組 role credentials + 權限規格文件 |
| H-03 | 填入 DB-303 DDL grants 佔位符（替換 `<backend_service_role>` 和 `<migration_role>` 為實際值） | Backend | 低 | H-02 | 可執行的 migration SQL |
| H-04 | 驗證 `project.projects` 在目標 DB 中存在且 `project_id` 型別為 `BIGINT` | DBA | 低 | H-01 | SQL 查詢結果確認 |
| H-05 | 建立 `docker-compose.yml`（postgres + backend + migration init container） | DevOps | 中 | 無 | 可本地 `docker-compose up` 的完整 stack |
| H-06 | 新增 GitHub Secrets：`DATABASE_URL`、`MIGRATION_DATABASE_URL`、`JWT_SECRET`（production 值） | DevOps | 低 | H-01, H-02 | Secrets 已注入 CI/CD |

### Priority 2 — 🟠 Pipeline / Infrastructure 建立

| # | 行動項目 | 負責角色 | 預估複雜度 | 前置依賴 | 產出物 |
|---|---------|----------|-----------|---------|-------|
| H-07 | 建立 `prisma/migrations/` baseline（執行 `prisma migrate dev --name init_auth_schema`） | Backend | 中 | H-05（需 local DB） | 可版控的 migration 目錄 |
| H-08 | 更新 `deploy.yml` 加入 backend deployment + `prisma migrate deploy` 步驟 | DevOps | 中 | H-06, H-07 | 含 DB migration 的部署 pipeline |
| H-09 | 新增 `prisma migrate deploy` 前的 DB backup step（`pg_dump` 或 cloud snapshot） | DevOps | 中 | H-08 | 自動化 backup 機制 |
| H-10 | 建立 staging 環境（獨立 DB instance + 獨立 deploy workflow） | DevOps | 高 | H-05, H-06 | staging 環境可跑完整 migration |
| H-11 | 新增 rollback workflow（`workflow_dispatch` trigger，執行 rollback SQL） | DevOps | 中 | H-08, H-09 | 可觸發的 rollback pipeline |
| H-12 | 更新 `backend/Dockerfile` 加入 `prisma generate` + `prisma migrate deploy` entrypoint | Backend | 中 | H-07 | 可自動 migrate 的 Docker image |

### Priority 3 — 🟡 收斂 / 驗證

| # | 行動項目 | 負責角色 | 預估複雜度 | 前置依賴 | 產出物 |
|---|---------|----------|-----------|---------|-------|
| H-13 | 決策：`user_project_roles.project` FK 首次 migration 是否啟用 | Backend + DBA | 低 | H-04 | 統一的 Prisma schema + DDL |
| H-14 | 決策：`auth.users.updated_at` 是否需要 DB-side trigger | Backend | 低 | 無 | Prisma schema 最終版本 |
| H-15 | 決策：`assigned_by` FK 是否需指向 auth.users（目前為 nullable BigInt） | Backend | 低 | 無 | Schema 確認或 deferred 決策記錄 |
| H-16 | Staging 端到端 migration 測試（執行 DDL → 驗證 schema → 啟動 backend → health check） | Backend + DevOps | 中 | H-10, H-13, H-14 | staging 測試通過報告 |
| H-17 | 驗證 GRANT：backend service role 僅能存取預期 tables（`\dp` 或 `information_schema` 查詢） | DBA | 低 | H-16 | 權限驗證報告 |
| H-18 | Production `JWT_SECRET` 更新為強隨機值 | DevOps / Security | 低 | H-06 | production secret 已輪替 |
| H-19 | `CORS_ORIGIN` 設定為 production 域名 | DevOps | 低 | 無 | `.env` 更新 |

### Priority 4 — 🟢 上線

| # | 行動項目 | 負責角色 | 預估複雜度 | 前置依賴 | 產出物 |
|---|---------|----------|-----------|---------|-------|
| H-20 | Production DB backup / snapshot | DBA | 低 | H-01 | 可還原的 DB 備份 |
| H-21 | Production migration 執行（依照 DB-303 Section 3 順序） | DBA + DevOps | 中 | H-20, H-16, H-17 | Migration 完成 + 驗證通過 |
| H-22 | Production backend deployment（含 Prisma client generate + migrate deploy） | DevOps | 中 | H-21 | Backend 正常啟動 |
| H-23 | Smoke test：`/api/v1/health` + auth endpoint | Backend + QA | 低 | H-22 | API 正常回應確認 |

---

## 5. 前置條件狀態摘要

```
✅ 已具備：1 項
⚠️ 部分具備：4 項
❌ 缺失：18 項

✅ CI backend test/build step (ci.yml)

⚠️ project.projects 存在於 live DB（過往 evidence，未重新驗證）
⚠️ project.projects.project_id 型別為 BIGINT（過往 evidence，未重新驗證）
⚠️ auth schema 不存在於 live DB（過往 evidence，未重新驗證）
⚠️ Prisma schema 與 DDL draft 整體一致（user_project_roles FK 差異待收斂）

❌ Production DB 連線資訊
❌ Migration role / backend service role 名稱與 credentials
❌ MIGRATION_DATABASE_URL / secrets 在 CI/CD
❌ prisma migrate deploy pipeline step
❌ DB backup/snapshot 機制
❌ Staging 環境
❌ docker-compose.yml
❌ prisma/migrations/ 目錄
❌ Rollback pipeline / trigger
❌ Production JWT_SECRET
❌ Production CORS_ORIGIN
❌ Prisma schema FK 差異收斂
❌ Role 權限驗證
❌ DB-side updated_at trigger 決策
❌ assigned_by FK 決策
❌ SSL 連線設定
❌ Backend Dockerfile migration 步驟
```

**整體判定：🔴 未就緒 — 至少需完成 Priority 1（H-01 ~ H-06）才能進入 staging 試跑。**

---

## 6. 參考文件

| 文件 | 說明 |
|------|------|
| `docs/db-303-live-auth-migration-plan.md` | DDL / Grants draft（本報告主要引用，Section 7 rollback plan） |
| `backend/prisma/schema.prisma` | BE-305 Prisma schema 定義 |
| `backend/.env.example` | 環境變數範本 |
| `.github/workflows/ci.yml` | CI pipeline 定義 |
| `.github/workflows/deploy.yml` | Frontend 部署 pipeline |
| `backend/Dockerfile` | Backend Docker 建構定義 |
| `docs/db-302-auth-unblock-report.md` | 前期 auth unblock 報告 |
| `docs/database-dashboard-auth-alignment.md` | Dashboard auth alignment 報告 |
| `docs/auth-schema-architecture.md` | Auth schema 架構文件 |

---

*Generated by DevOps OPS-305 | 2026-04-14*