# OPS-301 第一波環境準備驗收報告

**任務**：OPS-P0-001/003/005  
**執行日期**：2026-04-14  
**執行人**：DevOps Agent  
**狀態**：⚠️ 部分完成

---

## OPS-P0-003：pmis-postgres Volume 確認

### 狀態：✅ 已完成

### 實際證據
- 容器：`pmis-postgres`（postgis/postgis:16-3.4）
- 容器狀態：Up 29 hours (healthy)
- Port：0.0.0.0:5432→5432/tcp
- Named volume：`03__pmis_postgres_data`
  - Type：volume（非 bind mount）
  - Driver：local
  - Mountpoint：`/var/lib/docker/volumes/03__pmis_postgres_data/_data`
  - Docker Compose project：`03_`，volume label：`pmis_postgres_data`
  - 建立時間：2026-04-10

### 可立即提供給團隊
- ✅ PostgreSQL + PostGIS 16-3.4 在 port 5432 運行
- ✅ 資料持久化已就緒，容器重啟不會遺失資料
- ✅ init script 已在容器初始化時執行（schema + extensions）

### ⚠️ 風險項目
- init scripts bind mount 來源在 `/mnt/d/`（Windows 路徑）
  - 風險：若遷移到純 Linux VM，bind mount 路徑失效
  - 建議：將 init scripts 複製到 repo 的 `docker/init/` 目錄，修改 docker-compose.yml 指向 repo 相對路徑

---

## OPS-P0-001：Staging 環境準備

### 狀態：⚠️ 草案（待執行）

### 實際現況
- 目前只有 `main` branch（無 `staging` branch）
- `deploy.yml` 只觸發 `main` push（無 staging trigger）
- GitHub Pages 已部署至 main（production）
- GitHub Pages 限制：單 repo 只能有一個 Pages 網站

### 可立即提供給團隊
- ✅ main → GitHub Pages 自動部署（production）運作正常
- ✅ CI（lint + format + build + security audit）完整

### 尚依賴後端交付 / 外部決策
- ❌ staging URL 尚不存在（未整合 Vercel/Netlify）
- ❌ staging branch 尚未建立
- 純 frontend staging 可執行，但需要 PM 決策選擇平台

### 可執行修正建議
1. **優先（可立即執行）**：建立 `staging` branch，設定 Vercel 或 Netlify 連接 GitHub repo，自動為 `staging` branch 產生 preview URL
2. **替代方案**：本機 docker compose staging（`docker-compose.staging.yml`），無需外部平台
3. **完整 staging（依賴 backend）**：Cloud VM + NGINX + docker compose，待 backend repo 就緒後執行

---

## OPS-P0-005：.env.example 模板

### 狀態：✅ 完成（frontend + backend 均已建立）

> **⚠️ OPS-302-RECONCILE 更正紀錄（2026-04-14）**
> 原報告誤載「`backend/.env.example` 尚無法建立（backend/ 子目錄不存在）」。
> 經 PM 指出並重新核實，`backend/` 目錄與 `backend/.env.example` 均已於當日存在。
> 該錯誤陳述係基於執行 OPS-301 時的舊工作區快照（或時間點判讀錯誤），非當前事實。
> 正確狀態更正如下。

### 已完成（更正後）
- ✅ `.env.example`（frontend）已建立於 repo 根目錄
  - 包含：VITE_API_BASE_URL、VITE_APP_ENV
  - 含三個環境別（development / staging / production）的範例
- ✅ `docs/backend-env-example-draft.md` 已建立
  - 包含完整 backend 環境變數規格（NODE_ENV、PORT、DB_*、JWT_*、CORS_ORIGIN、LOG_LEVEL、RATE_LIMIT_*）
  - 含環境別對照表
  - 含待設定 GitHub Secrets 清單
- ✅ `backend/.env.example` 已建立（於 2026-04-14 18:50 建立，1736 bytes）
  - 包含：PORT、NODE_ENV、DATABASE_URL、JWT_SECRET、JWT_ACCESS_EXPIRES_MINUTES、JWT_REFRESH_EXPIRES_DAYS、CORS_ORIGIN
  - 已可供 backend 開發使用

### ~~尚依賴 backend 交付（已更正，此段廢止）~~
- ~~❌ `backend/.env.example` 尚無法建立（backend/ 子目錄不存在）~~ **← 已更正：此陳述不正確**

### ⚠️ 風險項目
- GitHub Secrets（DB_PASSWORD_STAGING/PROD、JWT_SECRET_STAGING/PROD）尚未設定
  - 影響：backend CI/CD 建立後無法直接使用
  - 建議：backend repo 建立時一併設定

---

## 可立即提供給團隊的基礎設施清單

| 項目 | 狀態 | 說明 |
|------|------|------|
| PostgreSQL + PostGIS 16-3.4 | ✅ 運行中 | port 5432，healthy |
| Named Volume 持久化 | ✅ 就緒 | `03__pmis_postgres_data` |
| Frontend CI/CD | ✅ 運作中 | lint + format + build + security audit |
| GitHub Pages 部署 | ✅ 現役 | main push → 自動部署 |
| Frontend .env.example | ✅ 已建立 | repo 根目錄 |
| Backend .env.example | ✅ 已建立（已更正） | backend/.env.example 1736 bytes，2026-04-14 18:50 |

## 仍依賴 backend 交付的項目

| 項目 | 阻塞原因 | 說明 |
|------|----------|------|
| backend/.env.example | ✅ 已建立（已更正） | backend/ 目錄與 .env.example 均已存在 |
| Backend Dockerfile | ⚠️ 待補 | OPS-P0-004，backend 服務化後補建 |
| GitHub Secrets 設定 | backend CI/CD 尚未建立 | 清單已備妥 |
| 完整 staging 環境 | 需 backend 服務 + 外部平台決策 | 純 frontend staging 可先執行 |

---

## 後續建議（依優先級）

1. **立即可執行**：建立 `staging` branch + 整合 Vercel/Netlify（PM 決策後 DevOps 執行，約 30 分鐘）
2. **等待 Backend**：backend repo 建立後立即執行 OPS-P0-004（Dockerfile）並移植 backend .env.example
3. **設定 GitHub Secrets**：backend CI/CD 建立時一併設定 DB_PASSWORD 和 JWT_SECRET
4. **修正 init scripts 路徑**：將 Docker init scripts 移入 repo，消除 Windows 路徑依賴