# OPS-305 — Auth Migration 執行就緒度盤點報告

**Date:** 2026-04-14  
**Task:** OPS-305-AUTH-MIGRATION-EXEC-READINESS  
**Prepared by:** DevOps  
**Input sources:**
- `docs/db-303-live-auth-migration-plan.md` (migration/grants draft)
- `backend/prisma/schema.prisma`
- `backend/.env.example`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `backend/Dockerfile`

**Status:** ⚠️ 未就緒 — 存在多個 Blocker，目前無法安全執行 live migration

---

## Explicit Non-Claims（禁止誤讀事項）

> 本文件**不聲明** auth migration 已執行。  
> 本文件**不聲明** `auth` schema 已存在於任何 live DB 環境。  
> 本文件**不聲明** GRANT statements 已被套用。  
> 本文件**不聲明** staging 決策已解決。  
> 本文件的任務是**盤點缺口**，不是確認完成。

---

## 1. 前置條件清單

| # | 前置條件 | 狀態 | 說明 |
|---|---------|------|------|
| P-01 | 目標 DB 連線資訊確認（host / port / dbname / SSL policy） | ❌ 缺失 | `.env.example` 只有 `postgresql://localhost:5432/tachenpmis`，為 local dev placeholder；無 staging/prod DB host |
| P-02 | `migration_role`（DDL 執行帳號）名稱確認與 credentials 存在 | ❌ 缺失 | DB-303 使用佔位符 `<migration_role>`，實際 PG role 名稱未確認，credentials 未存在於 CI/CD secrets |
| P-03 | `backend_service_role`（app 服務帳號）名稱確認與 credentials 存在 | ❌ 缺失 | DB-303 使用佔位符 `<backend_service_role>`，實際 PG role 名稱未確認，對應 `DATABASE_URL` 未填入 service account credentials |
| P-04 | `project.projects` 在目標 DB 中確認存在（FK 硬性依賴） | ⚠️ 部分具備 | DB-303 引用 `docs/database-dashboard-auth-alignment.md` 作為間接佐證，但 DB-303 本身明確標注「未在此任務重新驗證」；執行前必須在目標環境直接確認 |
| P-05 | `auth` schema 在目標 DB 中尚不存在（避免 IF NOT EXISTS 隱藏衝突） | ⚠️ 未驗證 | 歷史文件顯示 auth tables missing，但未有最新 live 查詢佐證；執行前需執行 `\dn` / `information_schema.schemata` |
| P-06 | `MIGRATION_DATABASE_URL` secret 已在 CI/CD 環境注入（含 migration role credentials） | ❌ 缺失 | ci.yml / deploy.yml 無任何 DB secret 引用；GitHub Actions Secrets 從未設定 |
| P-07 | `DATABASE_URL` secret（service account）已在 CI/CD 環境注入 | ❌ 缺失 | 同上；目前 backend 測試跑無 DB（未 provision test DB container） |
| P-08 | `prisma migrate deploy` 步驟已加入 deploy pipeline | ❌ 缺失 | deploy.yml 只部署 frontend 靜態頁至 GitHub Pages，無任何 backend deployment / Prisma migration 步驟 |
| P-09 | `prisma/migrations/` 目錄存在（migration history 已初始化） | ❌ 缺失 | 目錄完全不存在；`prisma migrate dev` 從未執行過；無法執行 `prisma migrate deploy` |
| P-10 | Migration 前 DB snapshot / backup 就緒 | ❌ 缺失 | 無 backup step 在任何 pipeline 中；無 pg_dump / snapshot 策略文件 |
| P-11 | Staging 環境優先試跑計畫（不可直接跑 production） | ❌ 缺失 | 無 staging 環境定義；無 docker-compose 本地 DB stack；deploy.yml 僅有 production target（GitHub Pages） |
| P-12 | `docker-compose.yml` 或等效本地 DB stack（開發/驗證用） | ❌ 缺失 | 無 docker-compose.yml；本地開發無法完整起 postgres + migrate + backend stack |
| P-13 | `auth.user_project_roles` FK 策略確認（立即啟用 vs. deferred） | ⚠️ 待決策 | DB-303 Section 2.2 與 schema.prisma 均標注此 FK 為 DB_PENDING；必須在 DDL 執行前做出明確決策 |
| P-14 | `auth.users.updated_at` trigger 策略確認（DB trigger vs. Prisma-managed） | ⚠️ 待決策 | DB-303 Section 2.2 標注需要決策；若有非 Prisma writer 則必須加 trigger |

---

## 2. Blocker 清單

以下 blocker 按嚴重度排序。**任何一個 CRITICAL blocker 未解除，即無法安全執行 live migration。**

### 🔴 CRITICAL — 必須解除才能執行

| # | Blocker | 影響 |
|---|---------|------|
| B-01 | **無 `prisma/migrations/` 目錄** — Prisma migration history 從未初始化 | `prisma migrate deploy` 無法執行；需先在開發環境跑 `prisma migrate dev --name init_auth_schema` 生成 migration file，commit 後才能部署 |
| B-02 | **目標 DB 連線資訊缺失** — 無 staging/prod DB host / credentials | 無論何種方式執行 migration，都需要知道連接到哪個 PostgreSQL instance |
| B-03 | **`<migration_role>` 和 `<backend_service_role>` 名稱與 credentials 未確定** | Grants SQL 無法執行；`DATABASE_URL` 無法注入；pipeline 無法構建 |
| B-04 | **`project.projects` FK 依賴未在目標 DB 中直接驗證** | `auth.user_project_roles` DDL 含 `REFERENCES project.projects(project_id) ON DELETE CASCADE`；若 `project.projects` 不存在，migration 直接失敗；若採 deferred FK 需修改 DDL |
| B-05 | **deploy pipeline 無 backend DB migration job** | 即使 DDL 準備好，也沒有自動化路徑把 migration 套用到目標環境 |

### 🟡 HIGH — 強烈建議解除後才執行

| # | Blocker | 影響 |
|---|---------|------|
| B-06 | **無 staging 環境** — 無法在 production 前驗證 migration 行為 | 直接跑 prod 的 migration 風險極高；無法做遷移驗收 |
| B-07 | **無 migration 前 DB backup 機制** | 如 migration 失敗需要 rollback，若無 backup 則資料風險嚴重 |
| B-08 | **無 docker-compose.yml** — 無法在本地完整起 DB stack | 開發者無法在本地跑 `prisma migrate dev` 驗證 DDL 正確性 |

### 🟠 MEDIUM — 可在首次 migration 後跟進

| # | Blocker | 影響 |
|---|---------|------|
| B-09 | **`auth.user_project_roles` FK 策略未決定** | 若保留 FK，需確認 project schema 版本穩定；若 deferred，需修改 DDL 移除 `REFERENCES` |
| B-10 | **`updated_at` trigger 策略未決定** | 非阻塞，但影響 data integrity 若未來有非 Prisma writer |

---

## 3. Rollback / 風險控制策略

### 3.1 DDL 回滾順序（來自 DB-303 Section 7，DevOps 補充執行細節）

**執行前提：** 回滾**只能在確認 live data 尚未依賴新 auth objects 的情況下執行**。

```sql
-- Step 1: 撤銷 grants（先切斷 service account 存取）
REVOKE ALL ON ALL TABLES IN SCHEMA auth FROM <backend_service_role>;
REVOKE USAGE ON SCHEMA auth FROM <backend_service_role>;

-- Step 2: 刪除 auth.user_project_roles（因為有 FK 到 auth.users）
DROP TABLE IF EXISTS auth.user_project_roles CASCADE;

-- Step 3: 刪除 audit 表
DROP TABLE IF EXISTS auth.audit_login_attempts CASCADE;

-- Step 4: 刪除 sessions 表（有 FK 到 auth.users）
DROP TABLE IF EXISTS auth.sessions CASCADE;

-- Step 5: 刪除 users 表（主表，最後刪）
DROP TABLE IF EXISTS auth.users CASCADE;

-- Step 6: 刪除 enum（依賴 objects 已清除後）
DROP TYPE IF EXISTS auth."UserRole";

-- Step 7: 可選 — 只在 schema 完全空時才 drop
-- DROP SCHEMA IF EXISTS auth;
```

### 3.2 Prisma Migration 回滾（pipeline 層）

- Prisma 無內建 `migrate rollback`，需手動執行上述 DDL 或引入自訂 down migration
- **建議**：採用 `prisma migrate dev` 建立 migration 時，同時準備 `undo_XXX.sql` 並納入版本控制
- **建議**：pipeline 應在 migration 前呼叫 `pg_dump` 建立 snapshot，保留至少 24 小時

### 3.3 風險控制矩陣

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|--------|------|---------|
| FK 依賴失敗（project.projects 不存在） | 中 | 高（migration 中止） | 執行前驗證；或改為 deferred FK |
| Role 衝突（role 名稱已存在但 privileges 不同） | 低 | 中 | `DO $$ BEGIN IF NOT EXISTS ... END $$` 防衛性 SQL |
| Service account 權限不足（migration role 缺少 SUPERUSER 或 schema CREATE） | 中 | 高（migration 失敗） | 預先用 `\du` 確認 role 屬性 |
| `prisma migrate deploy` 在 prod 前無 staging 驗證 | 高（目前無 staging） | 嚴重 | 先建 staging 環境 |
| 資料遺失（rollback 時已有資料） | 低（初次 migration，無資料） | 嚴重 | migration 前必備 backup |

---

## 4. Ops Handoff 清單（PM 排程用）

以下清單按優先順序排列，格式為：`[優先度] 任務 → 負責角色 → 預估複雜度`

### Phase 1：解除 CRITICAL Blockers（必須在 migration 前完成）

| 優先 | 任務 | 負責角色 | 複雜度 | 備注 |
|------|------|---------|--------|------|
| P1-01 | 建立 `docker-compose.yml`（postgres + backend migration container） | DevOps | 小 | 解除 B-08，為本地驗證提供基礎 |
| P1-02 | 在本地執行 `prisma migrate dev --name init_auth_schema`，生成 `prisma/migrations/` 並 commit | Backend + DevOps | 小 | 解除 B-01；需先有 P1-01 的 local DB |
| P1-03 | 確認 staging/prod DB 連線資訊（host / port / dbname / SSL），提供給 DevOps | PM / DBA | 無技術作業 | 解除 B-02 |
| P1-04 | 確認 `migration_role` 和 `backend_service_role` 的實際 PG role 名稱與 credentials | DBA / Backend | 小 | 解除 B-03；需 DBA 提供或建立 PG roles |
| P1-05 | 在 CI/CD（GitHub Actions）注入 `DATABASE_URL` 和 `MIGRATION_DATABASE_URL` Secrets | DevOps | 小 | 解除 B-03；依賴 P1-04 |
| P1-06 | 在目標 DB 直接驗證 `project.projects` 存在（`SELECT 1 FROM project.projects LIMIT 1`） | DevOps / DBA | 小 | 解除 B-04 |
| P1-07 | 決策：`auth.user_project_roles` FK 採立即啟用還是 deferred | PM + Backend + DBA | 設計決策 | 影響 DDL 最終版本；解除 B-09 |
| P1-08 | 替換 DB-303 grants SQL 中的 `<migration_role>` 和 `<backend_service_role>` 佔位符 | DevOps + DBA | 小 | 依賴 P1-04 |

### Phase 2：建立 Staging 環境與 Pipeline（強烈建議先於 production migration）

| 優先 | 任務 | 負責角色 | 複雜度 | 備注 |
|------|------|---------|--------|------|
| P2-01 | 建立 staging PostgreSQL 環境（可使用 Docker 或 cloud managed DB） | DevOps | 中 | 解除 B-06 |
| P2-02 | 新增 `.github/workflows/migrate.yml`（含 backup → migrate → verify 三步驟） | DevOps | 中 | 解除 B-05；涵蓋 `pg_dump` + `prisma migrate deploy` + 驗收 query |
| P2-03 | 在 staging 環境執行完整 migration 試跑，驗收 Section 6 acceptance criteria | DevOps + Backend | 中 | 包含：schema exists check + FK check + grant test |
| P2-04 | 執行 staging rollback 演練（確認回滾 SQL 可逆） | DevOps | 小 | 建立回滾信心 |

### Phase 3：Production Migration（所有前置條件解除後）

| 優先 | 任務 | 負責角色 | 複雜度 | 備注 |
|------|------|---------|--------|------|
| P3-01 | Production DB snapshot / pg_dump | DevOps / DBA | 小 | 必須在 migration 前執行 |
| P3-02 | 執行 production migration（`prisma migrate deploy`）| DevOps | 小 | 透過 pipeline 執行，非手動 |
| P3-03 | 執行 DB-303 Section 6 驗收條件（`information_schema` 驗證 + GRANT 驗證） | DevOps + Backend | 小 | |
| P3-04 | 通知 Backend 啟用 Prisma client wiring（`DATABASE_URL` 指向 production） | DevOps → Backend | 小 | migration 成功後 handoff |

---

## 5. 執行就緒度摘要

| 層面 | 就緒度 | 說明 |
|------|--------|------|
| DDL 設計 | ✅ 就緒 | DB-303 提供完整 DDL draft，與 BE-305 Prisma 對齊 |
| Grants 設計 | ⚠️ 部分就緒 | 設計完整，但佔位符未替換為實際 role names |
| Prisma Migration Files | ❌ 未就緒 | `prisma/migrations/` 不存在 |
| DB 連線 / Secrets | ❌ 未就緒 | 無任何 staging/prod credentials |
| Deploy Pipeline | ❌ 未就緒 | 無 backend deployment / migration job |
| Staging 環境 | ❌ 未就緒 | 不存在 |
| Rollback 計畫 | ✅ 就緒（設計層） | DB-303 Section 7 已定義；需 ops 層演練確認 |
| FK 依賴驗證 | ⚠️ 未驗證 | `project.projects` 需在目標 DB 直接確認 |

**整體判定：🔴 未就緒 — 至少需完成 Phase 1（P1-01 ~ P1-08）才能進入 staging 試跑。**

---

*Generated by DevOps OPS-305 | 2026-04-14*
