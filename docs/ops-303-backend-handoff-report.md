# OPS-303 Backend Handoff Report

**版本**: v1.0  
**產出日期**: 2026-04-14  
**任務**: OPS-303-BACKEND-HANDOFF  
**執行人**: DevOps Agent  

---

## 1. Backend 納版後現狀摘要

### 1.1 Key Commits（已驗證）

| Commit | 說明 |
|--------|------|
| `cf9cddd` | fix(backend): resolve jwt.sign is not a function in ESM context |
| `78fe7a2` | feat(auth): BE-303-AUTH-PREP — JWT/bcrypt utils, jwtAuth middleware, auth DTO types & route skeleton |
| `2086cfe` | feat(backend): initial commit of backend source tree |

### 1.2 技術棧

- **框架**: Fastify 5.2.1 + TypeScript 5.7.3
- **執行環境**: Node.js 20（tsx 開發，tsc build → dist/）
- **認證**: jsonwebtoken ^9.0.3 + bcryptjs ^3.0.3（ESM 相容性已修復）
- **安全**: @fastify/helmet ^13.0.0 + @fastify/cors ^10.0.1 + zod ^3.24.1
- **測試**: Vitest ^2.1.8
- **Port**: 3000

### 1.3 backend/ 目錄結構

```
backend/
├── src/
│   ├── config.ts              — 環境變數讀取 (PORT/NODE_ENV/DATABASE_URL/JWT_SECRET/etc.)
│   ├── server.ts              — Fastify 主程式
│   ├── plugins/
│   │   ├── jwtAuth.ts         — JWT 驗證中介層
│   │   └── requestId.ts       — Request ID plugin
│   ├── routes/
│   │   ├── health.ts          — 健康檢查路由 GET /health
│   │   ├── health.test.ts     — 健康檢查測試
│   │   └── auth.ts            — 認證路由 skeleton（待 DB schema）
│   ├── types/
│   │   └── auth.ts            — DTO types (LoginRequest/RegisterRequest/JWTPayload)
│   └── utils/
│       ├── jwt.ts             — JWT sign/verify（已修 ESM）
│       ├── jwt.test.ts
│       ├── password.ts        — bcrypt utils
│       └── password.test.ts
├── dist/                      — ✅ 已有 compiled JS（server/routes/plugins）
├── .env.example               — ⚠️ 已存在（DATABASE_URL 行有格式問題，見 §2.2）
├── .gitignore
├── package.json               — Fastify 5.2.1 + 所有依賴
└── tsconfig.json
```

---

## 2. OPS-P0-004 / OPS-P0-005 / Staging 準備 最新狀態

### 2.1 OPS-P0-004：Backend Dockerfile 草案

| 欄位 | 內容 |
|------|------|
| **狀態** | 🟡 可立即開始（原阻塞已解除） |
| **原阻塞原因** | backend repo 未就緒 |
| **現況** | backend/src 完整，TypeScript + Fastify 5.2.1，health endpoint 可用，build script 存在 |
| **下一步** | 撰寫 multi-stage Dockerfile |

**建議 Dockerfile 方向**（multi-stage，node:20-alpine）：
```dockerfile
# Stage 1: builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# Stage 2: runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
```

### 2.2 OPS-P0-005：.env.example 模板

| 欄位 | 內容 |
|------|------|
| **狀態** | ✅ 已完成（⚠️ 有格式問題待修正） |
| **frontend .env.example** | ✅ 正常，repo 根目錄，含 VITE_API_BASE_URL + VITE_APP_ENV（三環境） |
| **backend/.env.example** | ✅ 存在，含 PORT/NODE_ENV/DATABASE_URL/JWT_SECRET/JWT_ACCESS_EXPIRES_MINUTES/JWT_REFRESH_EXPIRES_DAYS/CORS_ORIGIN |
| **⚠️ 已知問題** | backend/.env.example 中 DATABASE_URL 行有格式截斷（值被 package.json 依賴字串污染，可能是文件生成時的 copy-paste 錯誤） |
| **修正建議** | backend 角色修正 .env.example 中的 DATABASE_URL 行後，DevOps 重新驗收 |

### 2.3 Staging 準備狀態

| 欄位 | 內容 |
|------|------|
| **狀態** | ⏳ 仍依賴外部決策 |
| **主要阻塞** | (1) PM 尚未決定 staging 平台（Vercel/Netlify vs Cloud VM），(2) Database schema 尚未完成（auth routes 無法完整測試） |
| **已確認** | main → GitHub Pages 自動部署（production）正常運作；CI workflow 完整（lint+format+build+audit）|
| **⚠️ CI 缺口** | ci.yml 只覆蓋 root frontend，無 backend/ 的 npm ci / vitest run / tsc 步驟 |

---

## 3. 可立即執行的 DevOps 項目（Backend 納版後解除阻塞）

| 任務ID | 項目 | 預計產出 | 說明 |
|--------|------|----------|------|
| OPS-P0-004 | Backend Dockerfile 草案 | `backend/Dockerfile` | multi-stage，node:20-alpine，EXPOSE 3000，HEALTHCHECK |
| CI-BE-001 | CI 加入 backend job | `.github/workflows/ci.yml` | `cd backend && npm ci && npx vitest run && npm run build` |
| OPS-P1-002 | NGINX Reverse Proxy 草案 | `docker/nginx.conf` | `/` → frontend static，`/api` → backend:3000 |
| OPS-P1-002B | docker-compose.yml 草案 | `docker-compose.yml` | postgres + backend + nginx 服務編排，含 healthcheck |
| OPS-P0-002 | GitHub Secrets 規格確認 | 備忘/回報 | 命名：`JWT_SECRET`/`DATABASE_URL`/`CORS_ORIGIN_STAGING`，可在 repo settings 預建空值 |

---

## 4. 仍阻塞的項目（依賴外部條件）

| 任務ID | 項目 | 阻塞原因 | 解除條件 |
|--------|------|----------|----------|
| OPS-P0-001 | Staging 環境建立 | PM 未決定 staging 平台（Vercel/Netlify/VM） | PM 確認平台方案 |
| OPS-P0-002（填值）| GitHub Secrets 實際填入 | staging URL/DB 憑證未定（staging 平台未決） | staging 平台決策後 |
| auth routes 完整化 | backend/src/routes/auth.ts 完整實作 | database role 未完成 DB schema（USER table 等） | DB schema 交付後由 backend 角色完成 |
| 完整 staging 啟動 | frontend + backend + DB 全棧 staging | DB schema + staging 平台兩者都需要 | 上述兩個條件同時滿足 |
| backend CI tests | 部分 integration test 依賴 DB | DB mock / 測試容器未配置 | DB schema 完成後，由 Tester 角色協助配置 |

---

## 5. 建議下一步行動（DevOps 視角）

### 立即可執行（本輪/下輪）

1. **撰寫 `backend/Dockerfile` 草案**（multi-stage，見 §2.1 建議方向）
2. **更新 `.github/workflows/ci.yml`**，加入 backend job（`cd backend && npm ci && npx vitest run && npm run build`）
3. **撰寫 `docker-compose.yml` 草案**（postgres + backend 兩服務，含 healthcheck 與 env 引用）
4. **撰寫 `docker/nginx.conf` 草案**（NGINX reverse proxy，`/api` → backend:3000）

### 待 PM 決策後

5. **確認 staging 平台**後執行 OPS-P0-001（建議優先 Vercel/Netlify 快速方案）
6. **填入 GitHub Secrets**（JWT_SECRET、DATABASE_URL、CORS_ORIGIN 各環境值）

### 待 Database Role 交付後

7. **auth routes 完整化**（由 backend 角色完成，DevOps 負責 staging 環境配置）
8. **完整 staging 環境啟動**（所有服務連線測試）

---

## 6. 風險記錄

| 風險 | 嚴重度 | 說明 | 建議 |
|------|--------|------|------|
| backend/.env.example DATABASE_URL 格式問題 | 中 | 截斷錯誤可能導致開發者誤用 | backend 角色修正後 DevOps 重驗 |
| GitHub Secrets 尚未設定 | 高 | backend CI/CD 建立後若 Secrets 缺失，pipeline 會失敗 | 盡早在 repo settings 預建空值佔位 |
| init scripts bind mount 在 /mnt/d/ | 中 | 遷移 Linux VM 時路徑失效 | 將 init scripts 移至 repo `docker/init/` |
| auth routes 依賴 DB schema | 高（功能） | staging backend 無法完整測試認證流程 | Database role 優先交付 schema |

---

## 7. 文件版本記錄

| 版本 | 日期 | 說明 |
|------|------|------|
| v1.0 | 2026-04-14 | OPS-303 backend 納版後初版，DevOps 接手評估 |

---

*本文件為 OPS-303-BACKEND-HANDOFF 任務驗收文件，供 PM 後續引用。*  
*關聯文件：`docs/devops-task-board.md`、`docs/devops-readiness-v1.md`、`docs/ops-301-readiness-report.md`*
