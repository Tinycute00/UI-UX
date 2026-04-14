# DevOps Task Board

> 大成工程 PMIS - DevOps 任務追蹤與優先級管理

---

**最後更新：2026-04-14（OPS-303 backend 納版後更新）**

| 任務ID | 標題 | 優先級 | 現況 | 說明 | 驗收標準 |
|--------|------|--------|------|------|----------|
| OPS-P0-001 | Staging 環境建立 | P0 | ⚠️ 草案 | staging branch/CI 待建立；GitHub Pages 單站限制；建議 Vercel 方案但尚未執行；目前僅 main → GitHub Pages 運作正常 | staging URL 可訪問，與 production 獨立 |
| OPS-P0-002 | GitHub Secrets 設定 | P0 | ⏳ 待辦 | backend 已納版，JWT_SECRET/DATABASE_URL/CORS_ORIGIN secrets 名稱已確認，可立即在 GitHub Secrets 介面建立，待 staging 平台確認後填入實際值 | Secrets 已設定，workflow 可引用 |
| OPS-P0-003 | pmis-postgres Volume 確認 | P0 | ✅ 已確認 | named volume `03__pmis_postgres_data` 存在，資料持久化已就緒；⚠️ init scripts bind mount 來源在 /mnt/d/（Windows 路徑），遷移 Linux VM 時需注意 | docker volume ls 可見命名 volume |
| OPS-P0-004 | Backend Dockerfile 草稿 | P0 | ⏳ 可立即開始 | backend repo 已納版（2086cfe），Fastify 5.2.1 + TypeScript，具 health endpoint，可立即草擬 Dockerfile | Image 可 build，container 可啟動 |
| OPS-P0-005 | .env.example 模板 | P0 | ✅ 已完成（⚠️ 有格式問題待修正） | backend/.env.example 已存在（DATABASE_URL 行有截斷問題，需 backend 修正）、frontend .env.example 已完成 | 所有必要 env var 列出，含說明 |

---

## P1 任務（Wave 1 後優先）

| 任務ID | 標題 | 優先級 | 現況 | 說明 | 驗收標準 |
|--------|------|--------|------|------|----------|
| OPS-P1-001 | Staging CI/CD Workflow | P1 | ⏳ 待辦 | deploy.yml 加入 staging branch trigger，獨立部署至 staging 環境 | push to staging 自動觸發 staging 部署 |
| OPS-P1-002 | NGINX Reverse Proxy Config | P1 | ⏳ 待辦 | 設計 nginx.conf：/ → frontend static，/api → backend:3000 | NGINX 可正確路由前後端 |
| OPS-P1-003 | Health Check 監控腳本 | P1 | ⏳ 待辦 | 建立 scripts/healthcheck.sh，檢查 frontend URL、backend /health、DB 連線 | 腳本執行無誤，異常時輸出明確錯誤 |
| OPS-P1-004 | 結構化 Logging 方案 | P1 | ⏳ 待辦 | Backend 使用 Winston/Pino 輸出 JSON log，容器 stdout 收集 | log 含 timestamp/level/message/requestId |
| OPS-P1-005 | 基礎監控（Prometheus/Grafana） | P1 | ⏳ 待辦 | 輕量監控：uptime check + DB 連線數 + API 回應時間 | Dashboard 可視，關鍵指標有 alert |

---

## P2 任務（可延後）

| 任務ID | 標題 | 優先級 | 現況 | 說明 | 驗收標準 |
|--------|------|--------|------|------|----------|
| OPS-P2-001 | pmis-postgres 自動備份 | P2 | ⏳ 待辦 | 每日 pg_dump + 30 天 rotation，存至本機或 S3 | 每日自動執行，備份檔可 restore |
| OPS-P2-002 | 災難恢復 SOP | P2 | ⏳ 待辦 | 撰寫 DB restore 步驟文件，每季執行 restore 演練 | SOP 文件存在，演練記錄存檔 |
| OPS-P2-003 | Trivy Image 安全掃描 | P2 | ⏳ 待辦 | CI 加入 trivy container image scan step，HIGH/CRITICAL 告警 | CI 掃描通過，無 CRITICAL 漏洞 |
| OPS-P2-004 | SOPS/Vault 密鑰管理 | P2 | ⏳ 待辦 | 評估 SOPS（git-crypt）或 Vault 取代純文字 .env | 密鑰加密存放，CI 可解密使用 |
| OPS-P2-005 | Kubernetes 遷移評估 | P2 | ⏳ 待辦 | 評估 K8s 遷移時機與成本，產出評估報告 | 評估報告含 pros/cons/timeline |

---

## 文件資訊

- **最後更新**：2026-04-14（OPS-301 驗收更新）
- **建立者**：DevOps Agent（OPS-101）
- **關聯文件**：devops-readiness-v1.md, implementation-backlog.md

---

*本文件為大成工程 PMIS DevOps 任務追蹤使用，請定期更新任務進度。*
