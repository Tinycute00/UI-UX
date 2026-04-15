# Backend .env.example 草案（待 backend repo 建立後使用）

> 此草案由 DevOps 根據系統需求預備，backend repo 就緒後請直接移植為 backend/.env.example

## 狀態：⚠️ 草案 — backend repo 尚未建立

## 建議的 backend/.env.example 內容

```env
# =============================================================================
# Ta Chen PMIS — Backend 環境變數範本
# 複製為 .env，填入實際值（.env 不應提交到 git）
# =============================================================================

# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=pmis-postgres
DB_PORT=5432
DB_NAME=pmis
DB_USER=pmis_user
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_SSL=false
# DB_SSL_CA_PATH=/path/to/ca-cert.pem

# Authentication
JWT_SECRET=CHANGE_ME_MIN_32_CHARS_RANDOM_STRING
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Security
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## 環境別說明

| 變數 | development | staging | production |
|------|------------|---------|------------|
| NODE_ENV | development | staging | production |
| DB_SSL | false | true | true |
| LOG_LEVEL | debug | info | warn |
| CORS_ORIGIN | localhost:5173 | staging URL | production URL |

## 關聯 GitHub Secrets

待設定（backend repo 建立後）：
- DB_PASSWORD_STAGING
- DB_PASSWORD_PROD
- JWT_SECRET_STAGING
- JWT_SECRET_PROD