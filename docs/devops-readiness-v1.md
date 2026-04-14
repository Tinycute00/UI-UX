# DevOps Readiness Report v1.0

**專案**: Ta Chen PMIS (大成工程工地管理資訊系統)  
**文件編號**: OPS-101  
**版本**: v1.0.0  
**產出日期**: 2026-04-14  
**負責人**: DevOps 專職代理  

---

## v1.1 更新紀錄（2026-04-14 OPS-303）

### Backend 現狀摘要

| 屬性 | 狀態 |
|------|------|
| **納版狀態** | ✅ 已納版 |
| **Key Commits** | cf9cddd（fix jwt ESM）、78fe7a2（BE-303 auth prep）、2086cfe（backend 初始納版） |
| **技術棧** | Fastify 5.2.1 + TypeScript |
| **ESM 問題** | ✅ 已修復（JWT ESM 相容性） |
| **結構** | backend/src/ 包含 server.ts、routes/、plugins/、utils/ |
| **Compiled** | ✅ backend/dist/ 已有 compiled JS |

### 狀態變更

| 項目 | 舊狀態 | 新狀態 | 說明 |
|------|--------|--------|------|
| **Backend Repo** | ❌ 待補 | ✅ 已納版 | 後端 repo 已正式納入主專案 |

### 已知限制

- **auth routes**: 依賴 DB schema（待 Database role 完成）
- **Dockerfile**: 草案可立即開始（阻塞已解除）
- **.env.example**: 已存在但有輕微格式問題（DATABASE_URL 行截斷）

---

## 1. Wave 1 部署現況摘要

### 1.1 專案現況

| 項目 | 狀態 | 說明 |
|------|------|------|
| **Frontend Repo** | ✅ 已就緒 | Vite 5.2.0 + Vanilla JS，靜態前端原型 |
| **Backend Repo** | ✅ 已納版 | Fastify 5.2.1 + TypeScript，已修復 JWT ESM 問題，具 health endpoint |
| **Database** | ✅ 運行中 | `pmis-postgres` 容器 (postgis/postgis:16-3.4)，port 5432 |
| **CI/CD** | ✅ 運作中 | GitHub Actions: `ci.yml` + `deploy.yml` |
| **Deployment** | ✅ 現役 | GitHub Pages (dist/ 目錄) |

### 1.2 重要聲明

> ⚠️ **Frontend 已上線 GitHub Pages，Backend 已納版但尚未部署**。auth routes 需等待 Database schema 完成後才能完整運作。

---

## 2. GitHub Actions CI/CD 說明

### 2.1 CI Workflow: `.github/workflows/ci.yml`

**觸發條件**:
- `pull_request`: 任何 PR 建立或更新時
- `push` to `main`: main 分支推送時

**執行步驟**:
```yaml
1. Checkout (actions/checkout@v4)
2. Setup Node.js 20 (actions/setup-node@v4 with npm cache)
3. Install dependencies (npm ci)
4. Lint (npm run lint - Biome lint check)
5. Format check (npm run format:check - Biome format check)
6. Build (npm run build - Vite production build)
7. Security Audit (npm audit --audit-level=high)
```

**狀態**: ✅ 標準設定，運作正常

### 2.2 Deploy Workflow: `.github/workflows/deploy.yml`

**觸發條件**:
- `push` to `main`: main 分支推送時
- `workflow_dispatch`: 手動觸發

**權限設定**:
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

**並行控制**:
```yaml
concurrency:
  group: pages
  cancel-in-progress: true
```

**執行流程**:

**Build Job**:
```yaml
1. Checkout (actions/checkout@v4)
2. Setup Node.js 20 (actions/setup-node@v4 with npm cache)
3. Install dependencies (npm ci)
4. Lint (npm run lint)
5. Format check (npm run format:check)
6. Build (npm run build)
7. Upload Pages artifact (actions/upload-pages-artifact@v3) - path: dist/
```

**Deploy Job**:
```yaml
1. Deploy to GitHub Pages (actions/deploy-pages@v4)
   - Environment: github-pages
   - URL: ${{ steps.deployment.outputs.page_url }}
```

**狀態**: ✅ 現役，自動部署至 GitHub Pages

---

## 3. 環境切分現況與規劃

### 3.1 現況：只有 Production

| 環境 | 狀態 | 部署目標 | 觸發條件 |
|------|------|----------|----------|
| **Production** | ✅ 現役 | GitHub Pages | push to `main` |
| **Staging** | ❌ 待建立 | 待規劃 | 待設定 |

### 3.2 Staging 環境規劃

**方案 A: GitHub Pages Preview（建議優先）**
- 建立 `staging` branch
- 修改 `deploy.yml` 加入 `staging` branch trigger
- GitHub Pages 限制：一個 repo 只能有一個 Pages 網站

**方案 B: Vercel / Netlify Staging**
- 整合 Vercel 或 Netlify 至 GitHub repo
- 自動為每個 PR 產生 preview URL
- 為 `staging` branch 建立獨立部署

**方案 C: Cloud VM Staging**
- 租用 AWS EC2 / GCP Compute Engine / DigitalOcean Droplet
- 透過 Docker Compose 部署
- 完整控制 staging 環境

**建議實施順序**:
1. 先採用 **方案 B (Vercel/Netlify)** 快速建立 staging
2. Backend 完成後，再評估 **方案 C (Cloud VM)**

### 3.3 建議的 deploy.yml Staging 擴充

```yaml
# 建議加入 staging branch trigger
on:
  push:
    branches:
      - main      # production
      - staging   # staging environment
  workflow_dispatch:

# 依據 branch 設定不同環境
jobs:
  build:
    # ... existing steps
    
  deploy:
    environment:
      name: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
      url: ${{ steps.deployment.outputs.page_url }}
```

---

## 4. Frontend 靜態部署路徑

### 4.1 現役部署流程

```
Developer Push → GitHub Actions Trigger
    ↓
Checkout Code
    ↓
npm ci (安裝依賴)
    ↓
npm run lint (Biome 檢查)
    ↓
npm run format:check (格式檢查)
    ↓
npm run build (Vite build)
    ↓
dist/ 目錄產出
    ↓
actions/upload-pages-artifact@v3
    ↓
actions/deploy-pages@v4
    ↓
GitHub Pages 上線
```

### 4.2 Vite 設定

```javascript
// vite.config.js (現況)
export default {
  base: './',  // 相對路徑，支援 GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  // ... other configs
}
```

### 4.3 GitHub Pages 設定

- **Source**: GitHub Actions
- **Build output**: `dist/` 目錄
- **URL Pattern**: `https://<username>.github.io/<repo-name>/`

---

## 5. Future Backend 部署規劃

### 5.1 技術棧規劃

| 項目 | 技術選項 | 說明 |
|------|----------|------|
| Runtime | Node.js 20 LTS | 與 Frontend 一致 |
| Framework | Express.js / Fastify | REST API server |
| Database | PostgreSQL + PostGIS | `pmis-postgres` 容器已就緒 |
| Auth | JWT (jsonwebtoken) | Stateless authentication |

### 5.2 目標 API 端點

```
POST   /api/auth/login          # JWT 登入
POST   /api/auth/logout         # 登出
POST   /api/auth/refresh        # Token 刷新
GET    /api/projects/:id/progress    # 工程進度
GET    /api/valuations              # 估驗請款列表
POST   /api/safety-inspections      # 建立工安巡檢
... (詳見 implementation-backlog.md)
```

### 5.3 容器化部署架構

```yaml
# docker-compose.yml (規劃)
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=pmis-postgres
      - DB_PORT=5432
      - DB_NAME=pmis
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - pmis-postgres
    networks:
      - pmis-network

  pmis-postgres:
    image: postgis/postgis:16-3.4
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=pmis
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pmis-postgres-data:/var/lib/postgresql/data
    networks:
      - pmis-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./dist:/usr/share/nginx/html
    depends_on:
      - backend
    networks:
      - pmis-network

volumes:
  pmis-postgres-data:

networks:
  pmis-network:
    driver: bridge
```

### 5.4 NGINX Reverse Proxy 規劃

```nginx
# nginx.conf (規劃)
server {
    listen 80;
    server_name pmis.tachen.com;

    # Frontend 靜態資源
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Backend API 代理
    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 安全性標頭
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 5.5 部署目標選項

| 選項 | 優點 | 缺點 | 建議 |
|------|------|------|------|
| **同一台 VM** | 簡單、成本低 | 單點故障 | Wave 1 建議 |
| **Cloud VM (AWS/GCP)** | 可擴展、專業 | 需管理、成本 | Wave 2 評估 |
| **Container Service** | 自動擴展 | 複雜度高 | 未來評估 |

---

## 6. DB 連線方式

### 6.1 現役 Database 容器

| 屬性 | 值 |
|------|-----|
| **容器名稱** | `pmis-postgres` |
| **Image** | postgis/postgis:16-3.4 |
| **Port** | 0.0.0.0:5432→5432/tcp |
| **Status** | Up / healthy |

### 6.2 Backend 連線設定

透過環境變數連接：

```bash
# .env (backend)
DB_HOST=pmis-postgres        # Docker network 內 hostname
DB_PORT=5432
DB_NAME=pmis
DB_USER=pmis_user
DB_PASSWORD=<secure_password>
DB_SSL=false                 # 本機/內網可關閉
```

**Production SSL 設定**:
```bash
# Production 環境需啟用 SSL
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
# 或提供 CA certificate
DB_SSL_CA_PATH=/path/to/ca-cert.pem
```

### 6.3 Connection Pool 建議

```javascript
// backend/db/pool.js (規劃)
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false,
  // Connection pool 設定
  max: 20,                    // 最大連線數
  idleTimeoutMillis: 30000,   // 閒置超時
  connectionTimeoutMillis: 2000, // 連線超時
});

module.exports = pool;
```

### 6.4 Docker Volume 確認

**重要**: 需確認 `pmis-postgres` 是否使用 named volume：

```bash
# 檢查現況
docker inspect pmis-postgres | grep -A 10 "Mounts"

# 若未使用 named volume，需重建容器：
docker stop pmis-postgres
docker rm pmis-postgres
docker run -d \
  --name pmis-postgres \
  --network pmis-network \
  -p 5432:5432 \
  -v pmis-postgres-data:/var/lib/postgresql/data \
  -e POSTGRES_DB=pmis \
  -e POSTGRES_USER=pmis_user \
  -e POSTGRES_PASSWORD=<password> \
  postgis/postgis:16-3.4
```

---

## 7. 環境變數需求（完整列表）

### 7.1 Frontend 環境變數

| 變數名稱 | 現況 | 未來需求 | 說明 |
|----------|------|----------|------|
| `VITE_API_BASE_URL` | N/A | ✅ 需要 | Backend API 基礎 URL |

```bash
# .env.example (frontend)
# 開發環境
VITE_API_BASE_URL=http://localhost:3000/api

# Staging 環境
# VITE_API_BASE_URL=https://staging-api.pmis.tachen.com/api

# Production 環境
# VITE_API_BASE_URL=https://api.pmis.tachen.com/api
```

### 7.2 Backend 環境變數（待補）

| 變數名稱 | 必要 | 說明 | 範例 |
|----------|------|------|------|
| `NODE_ENV` | ✅ | 執行環境 | `development` / `staging` / `production` |
| `PORT` | ✅ | Server 監聽埠 | `3000` |
| `DB_HOST` | ✅ | 資料庫主機 | `pmis-postgres` 或 IP |
| `DB_PORT` | ✅ | 資料庫埠 | `5432` |
| `DB_NAME` | ✅ | 資料庫名稱 | `pmis` |
| `DB_USER` | ✅ | 資料庫使用者 | `pmis_user` |
| `DB_PASSWORD` | ✅ | 資料庫密碼 | (secret) |
| `DB_SSL` | ⚠️ | SSL 啟用 | `true` (production) |
| `JWT_SECRET` | ✅ | JWT 簽署密鑰 | (secret, min 32 chars) |
| `JWT_EXPIRY` | ✅ | Token 過期時間 | `24h` |
| `CORS_ORIGIN` | ✅ | 允許的 frontend domain | `https://pmis.tachen.com` |
| `LOG_LEVEL` | ⚠️ | 日誌等級 | `info` / `debug` / `error` |
| `RATE_LIMIT_WINDOW` | ⚠️ | 速率限制視窗 | `15` (minutes) |
| `RATE_LIMIT_MAX` | ⚠️ | 速率限制請求數 | `100` |

```bash
# .env.example (backend)
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=pmis-postgres
DB_PORT=5432
DB_NAME=pmis
DB_USER=pmis_user
DB_PASSWORD=your_secure_password_here
DB_SSL=true

# Authentication
JWT_SECRET=your_jwt_secret_min_32_characters_long
JWT_EXPIRY=24h

# Security
CORS_ORIGIN=https://pmis.tachen.com

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 7.3 CI/CD Secrets (GitHub Actions)

| Secret 名稱 | 狀態 | 用途 |
|-------------|------|------|
| `GITHUB_TOKEN` | ✅ 內建 | GitHub Actions 自動提供 |
| `DB_PASSWORD_STAGING` | ❌ 待設定 | Staging 資料庫密碼 |
| `DB_PASSWORD_PROD` | ❌ 待設定 | Production 資料庫密碼 |
| `JWT_SECRET_STAGING` | ❌ 待設定 | Staging JWT 密鑰 |
| `JWT_SECRET_PROD` | ❌ 待設定 | Production JWT 密鑰 |

---

## 8. Wave 1 最小部署路徑

### 8.1 執行摘要

Wave 1 目標：**Frontend 上線 GitHub Pages + Backend 基礎就緒 + DB 穩定運行**

```
┌─────────────────────────────────────────────────────────────────┐
│                    WAVE 1 最小部署路徑                          │
├─────────────────────────────────────────────────────────────────┤
│  Step 1: Frontend → GitHub Pages（現役）                        │
│  Step 2: Backend container → Docker Compose + .env              │
│  Step 3: NGINX config → 反向代理前後端                          │
│  Step 4: pmis-postgres → Volume 持久化 + 備份                   │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Step-by-Step 執行步驟

#### Step 1: Frontend → GitHub Pages（現役）

**狀態**: ✅ 已就緒

**驗證項目**:
```bash
# 1. 確認 GitHub Pages 啟用
# 前往 GitHub Repository > Settings > Pages
# Build and deployment > Source: GitHub Actions

# 2. 確認 deploy.yml 運作正常
# 前往 GitHub Repository > Actions > Deploy to GitHub Pages
# 確認最近一次部署成功 (綠色勾勾)

# 3. 確認網站可訪問
# 開啟 https://<username>.github.io/<repo-name>/
```

#### Step 2: Backend Container → Docker Compose + .env

**狀態**: ⏳ 待後端 repo 就緒後執行

**執行步驟**:
```bash
# 1. 建立 backend repo（若尚未建立）
# 建議路徑: /home/beer8/team-workspace/pmis-backend/

# 2. 建立 backend/Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
EXPOSE 3000
CMD ["node", "src/server.js"]
EOF

# 3. 建立 backend/.env
cp .env.example .env
# 編輯 .env，填入實際值

# 4. 建立根目錄 docker-compose.yml
# 參考第 5.3 節的 docker-compose.yml

# 5. 啟動服務
docker-compose up -d backend

# 6. 驗證
curl http://localhost:3000/health
```

#### Step 3: NGINX Config → 反向代理前後端

**狀態**: ⏳ 待 Backend 就緒後執行

**執行步驟**:
```bash
# 1. 建立 nginx.conf（參考第 5.4 節）

# 2. 更新 docker-compose.yml 加入 nginx service

# 3. 啟動 nginx
docker-compose up -d nginx

# 4. 驗證路由
# Frontend: http://localhost/
# Backend API: http://localhost/api/health
```

#### Step 4: pmis-postgres → Volume 確認與備份

**狀態**: ⚠️ 需立即確認

**執行步驟**:
```bash
# 1. 確認現有容器 volume 設定
docker inspect pmis-postgres | grep -A 20 "Mounts"

# 2. 若無 named volume，執行遷移：
# 2.1 備份現有資料
docker exec pmis-postgres pg_dump -U pmis_user pmis > backup_$(date +%Y%m%d).sql

# 2.2 停止並移除舊容器
docker stop pmis-postgres
docker rm pmis-postgres

# 2.3 使用 named volume 重建
docker run -d \
  --name pmis-postgres \
  --network pmis-network \
  -p 5432:5432 \
  -v pmis-postgres-data:/var/lib/postgresql/data \
  -e POSTGRES_DB=pmis \
  -e POSTGRES_USER=pmis_user \
  -e POSTGRES_PASSWORD=<password> \
  postgis/postgis:16-3.4

# 2.4 還原資料
docker exec -i pmis-postgres psql -U pmis_user -d pmis < backup_$(date +%Y%m%d).sql

# 3. 設定自動備份腳本
# 參考 devops-task-board.md 的 OPS-P2-001
```

### 8.3 Wave 1 完成標準

| 檢查項目 | 標準 | 驗證方式 |
|----------|------|----------|
| Frontend 部署 | GitHub Pages 可訪問 | 瀏覽器開啟 URL |
| Backend 健康 | `/health` 回傳 200 | `curl http://localhost:3000/health` |
| DB 連線 | Backend 可讀寫 DB | API 測試 CRUD |
| NGINX 路由 | `/` → Frontend, `/api/` → Backend | `curl` 測試 |
| DB Volume | 使用 named volume | `docker volume ls` |

---

## 9. 風險清單

### 9.1 P0 - 高風險（阻擋 Wave 1）

| ID | 風險項目 | 影響 | 風險等級 | 緩解措施 |
|----|----------|------|----------|----------|
| **R-001** | **後端尚未存在** | Wave 1 無法完成 API 串接 | 🔴 極高 | 立即啟動 backend repo 開發 |
| **R-002** | **pmis-postgres 無 named volume** | 容器重啟時資料遺失 | 🔴 極高 | 立即確認並遷移至 named volume |
| **R-003** | **GitHub Secrets 未設定** | 未來 CI/CD 無法存取敏感資訊 | 🟡 高 | 建立 Secrets 清單並設定 |
| **R-004** | **無 staging 環境** | 直接部署 production，風險高 | 🟡 高 | 建立 staging branch + 部署 |

### 9.2 P1 - 中風險（影響穩定性）

| ID | 風險項目 | 影響 | 風險等級 | 緩解措施 |
|----|----------|------|----------|----------|
| **R-005** | **無監控/告警** | 系統異常無法即時發現 | 🟡 高 | 導入基礎監控 (Uptime Robot) |
| **R-006** | **無備份策略** | 資料遺失無法復原 | 🟡 高 | 建立每日自動備份 |
| **R-007** | **無 SSL/TLS** | 資料傳輸未加密 | 🟡 中 | 設定 Let's Encrypt |
| **R-008** | **Vite 版本過時** | 5.2.0 已停止維護 | 🟡 中 | 升級至 Vite 6.x |

### 9.3 P2 - 低風險（技術債）

| ID | 風險項目 | 影響 | 風險等級 | 緩解措施 |
|----|----------|------|----------|----------|
| **R-009** | **無測試框架** | 回歸測試成本高 | 🟢 低 | 導入 Vitest + Playwright |
| **R-010** | **無 Dependabot** | 依賴漏洞無自動偵測 | 🟢 低 | 啟用 Dependabot alerts |
| **R-011** | **無文件化部署流程** | 新成員 onboarding 困難 | 🟢 低 | 建立 DEPLOYMENT.md |
| **R-012** | **無災難恢復 SOP** | 事故時無標準處理流程 | 🟢 低 | 建立 DRP 文件 |

### 9.4 風險矩陣

```
影響程度 ↑
    │
 高 │  R-001    R-002
    │  R-003    R-005
    │  R-004    R-006
    │           R-007
    │
 中 │           R-008
    │
 低 │  R-009    R-010
    │  R-011    R-012
    └──────────────────────→ 發生機率
        低        中        高
```

---

## 10. 參考文件

| 文件 | 路徑 | 說明 |
|------|------|------|
| 實施待辦清單 | `docs/implementation-backlog.md` | 完整開發任務清單 |
| 系統清單 | `docs/system-inventory.md` | 技術棧與架構說明 |
| 維護掃描報告 | `docs/devops-weekly-maintenance-scan-2026-04-14.md` | 定期維護檢查結果 |
| DevOps 任務板 | `docs/devops-task-board.md` | P0/P1/P2 任務追蹤 |
| CI Workflow | `.github/workflows/ci.yml` | 持續整合設定 |
| Deploy Workflow | `.github/workflows/deploy.yml` | 部署流程設定 |

---

## 11. 版本記錄

| 版本 | 日期 | 修改內容 | 負責人 |
|------|------|----------|--------|
| v1.0.0 | 2026-04-14 | 初版建立 | DevOps 專職代理 |

---

*文件結束*
