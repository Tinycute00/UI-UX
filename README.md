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
# 或手動：將 supabase/migrations/0001_init.sql 內容貼到 SQL Editor
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

## 🔮 MVP 2 規劃

- [ ] 施工日誌完整表單（含自動彙整至 S-Curve）
- [ ] 現場資料上傳（拍照 + GPS + EXIF + 離線佇列）
- [ ] 品管 / 職安 Checklist 自動判定
- [ ] 工項樹狀管理與權重編輯
- [ ] 材料驗收 + QR Code + NCR
- [ ] PDF 電子化送審 + 電子簽章
- [ ] 報表中心（月報 / 季報 / 竣工）
- [ ] 通知工作流（推播 + Email）
- [ ] 離線同步強化（IndexedDB + BackgroundSync）

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
