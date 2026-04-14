# Ta Chen PMIS — Backend API Server

> TypeScript + Fastify 後端服務，為大成工程 PMIS 提供 REST API

## 技術堆疊

| 層級 | 技術 |
|------|------|
| Runtime | Node.js 18+ |
| 框架 | Fastify 5.x |
| 語言 | TypeScript 5.x |
| 環境驗證 | Zod |
| 日誌 | Pino (built-in Fastify) |
| 安全 | @fastify/helmet, @fastify/cors |
| Cookie | @fastify/cookie (httpOnly for refresh token) |
| 測試 | Vitest |

## 快速啟動

```bash
# 1. 進入 backend 目錄
cd backend

# 2. 安裝依賴
npm install

# 3. 設定環境變數
cp .env.example .env
# 編輯 .env 填入實際值（尤其是 JWT_SECRET 和 DATABASE_URL）

# 4. 開發模式（熱重載）
npm run dev

# 5. 確認健康狀態
curl http://localhost:3000/api/v1/health
```

## 建置與部署

```bash
# TypeScript 編譯
npm run build

# 啟動生產服務
npm start

# 執行測試
npm test
```

## 目錄結構

```
backend/
├── src/
│   ├── config.ts              # 環境變數 Zod 驗證
│   ├── server.ts              # Fastify 主入口（App Factory）
│   ├── routes/
│   │   ├── health.ts          # GET /api/v1/health
│   │   └── health.test.ts     # Vitest smoke test
│   └── plugins/
│       └── requestId.ts       # X-Request-Id plugin
├── package.json
├── tsconfig.json
├── .env.example               # 環境變數範例
└── README.md
```

## API 端點

| Method | Path | Auth | 說明 |
|--------|------|------|------|
| GET | /api/v1/health | Public | 健康檢查 |

### GET /api/v1/health

回傳 API 服務健康狀態（無需認證）。

**Response 200**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-14T12:00:00.000Z",
  "version": "1.0.0"
}
```

**Response Headers**:
- `X-Request-Id`: 唯一請求識別碼
- `X-Frame-Options`: SAMEORIGIN（Helmet）
- `Content-Security-Policy`: CSP 設定（Helmet）

## 環境變數

| 變數 | 預設值 | 說明 |
|------|--------|------|
| PORT | 3000 | HTTP 監聽端口 |
| NODE_ENV | development | 執行環境 |
| DATABASE_URL | postgresql://localhost:5432/tachenpmis | PostgreSQL 連線字串 |
| JWT_SECRET | (dev value) | JWT 簽名密鑰（生產環境必須替換） |
| JWT_ACCESS_EXPIRES_MINUTES | 15 | Access Token 有效期（分鐘） |
| JWT_REFRESH_EXPIRES_DAYS | 7 | Refresh Token 有效期（天） |
| CORS_ORIGIN | * | 允許的 CORS 來源 |

## 待辦（BE-002 需要 database schema）

BE-002 身份驗證 API 等待以下 DB tables 就緒後開始實作：

- `auth.users` — 使用者帳號與認證資訊
- `auth.sessions` — Refresh token 儲存
- `auth.audit_login_attempts` — 登入嘗試記錄

## 架構模式

```
Request → Fastify Plugin (helmet/cors/requestId) → Route Handler → Service → Repository → DB
```

- **Route**: 處理 HTTP request/response，輸入驗證
- **Service**: 業務邏輯，不直接操作 DB
- **Repository**: DB 查詢封裝（待 BE-002+ 實作）
