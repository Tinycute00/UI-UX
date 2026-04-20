# 公共工程甲級營造廠工務所前端管理系統

> Next.js 15 + React 19 + TypeScript + Tailwind CSS + Supabase
> 針對 **50-70 歲工地使用者** 優化的前端管理系統 MVP 1

---

## ✨ 特色

- **50-70 歲友善設計**：正文 ≥18px、按鈕 ≥56/60px、高對比、大字模式、純 SVG 圖示（不使用 Emoji）
- **Top-Down 布局**：桌面側邊欄 + 手機底部 Tab Bar 5 模組 + 抽屜選單
- **自動進度計算**：S-Curve 100% 來自日常作業表單（工項加權），**不允許手動填百分比**
- **PWA + 離線優先**：基本離線殼層已備妥，離線佇列與拍照同步於後續階段完成
- **RBAC**：5 角色（工務所主任 / 工程師 / 品管 / 職安 / 行政）由 Supabase RLS 強制

---

## 🛠 技術棧

| 類別 | 選用 |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| UI | React 19 + Tailwind CSS 3.4 + Radix UI + CVA |
| State | TanStack Query 5 + Zustand 5 |
| Forms | React Hook Form 7 + Zod 3 |
| Charts | Recharts 2（S-Curve / 儀表板）|
| Backend | Supabase（Postgres + Auth + Storage + Realtime + RLS）|
| Signature | react-signature-canvas |
| Lang | TypeScript 5（strict）|

---

## 🚀 快速開始

### 1. 安裝相依套件

```bash
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env.local
```

編輯 `.env.local`，填入 Supabase 專案的 URL 與 anon key：
Supabase Dashboard → Project Settings → API

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. 執行資料庫 migration

使用 Supabase CLI 或 Dashboard SQL Editor 執行：

```bash
supabase db push
# 或手動：依序將下列兩個檔案貼到 SQL Editor 執行
#   supabase/migrations/0001_init.sql
#   supabase/migrations/0002_mvp2_core.sql
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟 <http://localhost:3000>，自動重導向 `/today`。
未設定 Supabase 時，畫面依然可瀏覽（使用 mock 資料）。

---

## 📁 目錄結構

```
src/
├─ app/
│  ├─ (app)/                 # 驗證後布局（Header + Sidebar + TabBar）
│  │  ├─ today/              # 今日工作中心（S-Curve + 快速入口 + 提醒）
│  │  ├─ morning-meeting/    # 早報會議表單
│  │  ├─ daily-log/          # 施工日誌（MVP 2）
│  │  ├─ upload/             # 現場資料上傳（MVP 2）
│  │  ├─ qc/                 # 品管檢驗（MVP 2）
│  │  ├─ safety/             # 職安巡檢（MVP 2）
│  │  ├─ materials/          # 材料驗收（MVP 2）
│  │  ├─ wbs/                # 工項 / S-Curve（MVP 2）
│  │  ├─ office/             # 內業管理（MVP 2）
│  │  ├─ billing/            # 請款管理（MVP 2）
│  │  ├─ labor/              # 路工管理（MVP 2）
│  │  └─ reports/            # 報表中心（MVP 2）
│  ├─ login/                 # 登入頁
│  ├─ layout.tsx             # 根布局（A11yProvider + QueryClient）
│  ├─ page.tsx               # `/` → redirect `/today`
│  └─ globals.css            # 全域樣式 + 字級變數
├─ components/
│  ├─ a11y/                  # 大字 / 高對比 Provider
│  ├─ charts/                # Recharts 圖表（SCurve）
│  ├─ forms/                 # SignaturePad 等表單專用元件
│  ├─ layout/                # Header / Sidebar / MobileTabBar / BackButton / OfflineBanner
│  ├─ ui/                    # Button / Card / Field / Checkbox / Badge
│  ├─ icons.tsx              # 純 SVG 圖示庫
│  └─ providers.tsx          # React Query + A11y
├─ lib/
│  ├─ navigation.ts          # 導航單一真實來源
│  ├─ cn.ts                  # Tailwind class merger
│  └─ supabase/              # client / server / middleware / types
└─ middleware.ts             # Supabase auth session 同步
supabase/
└─ migrations/0001_init.sql  # 完整 schema + RLS + 進度計算函式
```

---

## 🧩 MVP 1 已完成

- [x] 登入頁（Supabase Auth）
- [x] Top-Down 布局骨架（Header + Sidebar + MobileTabBar + 抽屜選單）
- [x] 今日工作中心（日期 + 天氣 + 提醒 + 快速入口 + S-Curve）
- [x] 早報會議表單（日期 + 出席 + 討論 + 照片 + 簽名 + RHF/Zod 驗證）
- [x] 10 個模組 stub 頁面（含返回按鈕）
- [x] PWA manifest + 基本 service worker
- [x] 大字 / 高對比切換 + localStorage 持久化
- [x] GitHub Actions CI（lint + typecheck + build）
- [x] Supabase 完整 schema + RLS + 進度計算函式

## 🧩 MVP 2 已完成（核心 3 項）

- [x] **施工日誌** — 完整表單 + Supabase CRUD + 工項勾選自動觸發 S-Curve 重算（migration 0002 trigger）
- [x] **現場資料上傳** — 批次上傳 + 自動壓縮（≤1.5MB）+ EXIF GPS / 拍攝時間 + 縮圖
- [x] **工項 / 真實 S-Curve** — WBS 樹狀展開、權重與進度條、`scurve_series` RPC 計畫 vs 實際

## 🔮 MVP 2+ 後續

- [ ] 品管 / 職安 Checklist 自動判定
- [ ] 材料驗收 + QR Code + NCR
- [ ] PDF 電子化送審 + 電子簽章
- [ ] 報表中心（月報 / 季報 / 竣工）
- [ ] 通知工作流（推播 + Email）
- [ ] 離線同步強化（IndexedDB + BackgroundSync）

---

## ☁️ 部署（Vercel + GitHub Actions 自動部署）

> **為什麼 Vercel？** Next.js 15 使用 Server Components / middleware / dynamic routes，GitHub Pages（純靜態）無法支援。Vercel 是 Next.js 的原廠託管，零設定即支援 SSR、Edge、preview 環境。免費額度對本專案充裕（個人 Hobby：100GB 頻寬/月、無限部署）。

### 🗺 部署流程總覽

```
本機 vercel link → GitHub Secrets 設定 → Vercel 環境變數設定 → Supabase migration → git push → 自動部署
     (Step 1)         (Step 2-3)             (Step 4)             (Step 5)        (Step 6)
```

### Step 1：本機連結 Vercel 專案

```bash
# 1-1. 安裝 Vercel CLI（全域）
npm i -g vercel

# 1-2. 登入（瀏覽器會自動開啟 OAuth 頁面）
vercel login
# 選 "Continue with GitHub" → 授權 → 回 terminal 顯示 "Success!"

# 1-3. 在專案根目錄執行 link
cd ~/team-workspace/UI-UX
vercel link

# CLI 互動式提示依序回答：
#   ? Set up "~/team-workspace/UI-UX"? → Y
#   ? Which scope should contain your project? → 選你的帳號或 team
#   ? Link to existing project? → N（首次）
#   ? What's your project's name? → ui-ux（建議）或自訂
#   ? In which directory is your code located? → ./ （按 Enter）
#   （偵測到 Next.js，其他自動填好，全部按 Enter 接受）

# 1-4. 取得 orgId / projectId（之後會用到）
cat .vercel/project.json
# 輸出範例：
# {"projectId":"prj_xxxxxxxxxxxxxxxxxxxxxxxxxx","orgId":"team_xxxxxxxxxxxxxxxx"}
# 或個人帳號：
# {"projectId":"prj_xxx","orgId":"xxxxxxxxxxxxxxxx"}
```

> ⚠️ `.vercel/` 資料夾已在 `.gitignore` 中，不會 commit，請妥善保留以免下次 link 又重設。

### Step 2：產生 Vercel Token

1. 前往 <https://vercel.com/account/tokens>
2. 點右上 **Create Token**
3. 填寫：
   - **Token Name**：`github-actions-ui-ux`
   - **Scope**：選你 link 專案時用的帳號 / team
   - **Expiration**：`No Expiration`（或 1 year）
4. 點 **Create Token** → **立刻複製**（頁面關掉就看不到了）

### Step 3：設定 GitHub Secrets

前往 <https://github.com/Tinycute00/UI-UX/settings/secrets/actions>（若 repo 非此位置請自行替換路徑）

點 **New repository secret**，依序新增 **3 個 secrets**：

| Secret Name | Value 來源 | 範例格式 |
|---|---|---|
| `VERCEL_TOKEN` | Step 2 產生的 token | `abcdef1234567890...` |
| `VERCEL_ORG_ID` | `.vercel/project.json` 的 `orgId` | `team_xxx` 或 `xxx`（一串字） |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` 的 `projectId` | `prj_xxx` |

> ✅ 新增完應在列表看到 3 個 Secret。值會被遮蔽無法再檢視，只能「Update」覆蓋。

### Step 4：設定 Vercel 專案環境變數

前往 <https://vercel.com/dashboard> → 選 `ui-ux` 專案 → **Settings** → **Environment Variables**

依序新增 **2 個環境變數**（**Production / Preview / Development 三個 checkbox 全部勾選**）：

| Key | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project>.supabase.co` | 全選 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key（eyJhbGciOi...） | 全選 |

> 📍 **如何取得 Supabase 值**：Supabase Dashboard → 你的專案 → **Settings** → **API**
> - URL → **Project URL**
> - anon key → **Project API keys** → `anon` `public`（不是 `service_role`！）

### Step 5：執行 Supabase Migration

首次部署或 schema 變更時，到 Supabase Dashboard → **SQL Editor** → **New query**：

1. 複製 `supabase/migrations/0001_init.sql` 全文 → 貼上 → **Run**（若尚未執行過）
2. 複製 `supabase/migrations/0002_mvp2_core.sql` 全文 → 貼上 → **Run**

執行成功後在 **Storage** → 應看到 `photos` bucket，**Database → Functions** 應看到 `scurve_series` 與 `recalculate_wbs_progress`。

### Step 6：觸發部署

```bash
# 方式 A：已有新變更 → 直接 push
git push origin main

# 方式 B：無變更，用空 commit 觸發
git commit --allow-empty -m "ci: trigger deploy"
git push origin main
```

前往 <https://github.com/Tinycute00/UI-UX/actions> 觀察 **Deploy to Vercel** workflow：

- ✅ 成功：進入 Vercel Dashboard → 專案頁 → **Domains** 區會看到網址（預設 `ui-ux-xxx.vercel.app`）
- ❌ 失敗：點進 run 看哪一步錯
  - `Checking Vercel secrets` 顯示 skip → 回 Step 3 確認 3 個 secrets 名稱完全正確
  - `vercel pull` 失敗 → token 權限不足，重新產生 token 並更新 `VERCEL_TOKEN`
  - `vercel build` 失敗 → 環境變數未設（回 Step 4）

### 🔄 日常更新流程

設定完成後，日後只需：
```bash
git push origin main   # 即自動部署到 production
```

- **Preview 部署**：開 PR 會自動建立 preview URL，合併前可先試玩
- **Production 部署**：`main` branch push 即觸發
- **區域**：`hnd1`（東京），於 `vercel.json` 調整
- **Rollback**：Vercel Dashboard → Deployments → 選舊版 → **Promote to Production**

### 🧪 自訂網域（可選）

Vercel Dashboard → 專案 → **Domains** → **Add** → 輸入你的網域 → 依指示在 DNS provider 設定 CNAME → Vercel 自動簽發 SSL 憑證。

### ⚠️ 安全提醒

- `anon key` 公開在前端是**設計如此**（靠 Supabase RLS 保護），**不要**放 `service_role key` 到 `NEXT_PUBLIC_*` 變數
- Vercel Token 等同帳號密碼，**不要** commit 到 repo、不要分享，定期輪替
- `.vercel/` 已在 `.gitignore`，保持現狀

---

## 📜 Scripts

```bash
npm run dev         # 啟動開發伺服器
npm run build       # 產生正式版
npm run start       # 執行正式版
npm run lint        # ESLint
npm run typecheck   # TypeScript 檢查
npm run format      # Prettier 格式化
```

---

## 🔐 RBAC 矩陣（規格書 §10）

| 模組 | 主任 | 工程師 | 品管 | 職安 | 行政 |
|---|:-:|:-:|:-:|:-:|:-:|
| 今日工作 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 早報會議 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 施工日誌 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 品管檢驗 | ✅ | ✅ | ✅ |  | ✅ |
| 職安巡檢 | ✅ | ✅ |  | ✅ | ✅ |
| 材料驗收 | ✅ | ✅ |  |  | ✅ |
| 工項 / S-Curve | ✅ | ✅ | ✅ | ✅ | ✅ |

詳細權限由 Supabase RLS policies 強制（參見 `supabase/migrations/0001_init.sql`）。

---

## 📝 License

Proprietary — 大成營造股份有限公司
