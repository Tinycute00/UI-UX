# Database Dashboard & Auth Alignment Report

**Date:** 2026-04-14  
**Environment:** Live DB (pmis-postgres / public_works_db / pmis_admin)  
**Purpose:** `/ulw-loop` Dashboard API 資料核對

---

## 一、查詢依據

```sql
-- 確認 Schema 存在
SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('project','contract','vendor');

-- 確認 Table 欄位
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = ? AND table_name = ?;

-- 確認 FK 關聯
SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON ...
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

## 二、Dashboard API 所需 Table 結構（已存在）

### 2.1 `project.projects` ✅ 已存在

| 欄位名 | 型別 | Nullable | 用途 |
|--------|------|----------|------|
| project_id | bigint | NO | PK |
| project_code | varchar | NO | Unique, 專案代碼 |
| project_name | varchar | NO | 專案名稱 |
| project_location | varchar | YES | 位置 |
| owner_name | varchar | YES | 業主名稱 |
| supervisor_name | varchar | YES | 監造名稱 |
| start_date | date | YES | 開工日期 |
| planned_end_date | date | YES | 預定完工日期 |
| created_at | timestamptz | NO | 建立時間 |
| updated_at | timestamptz | NO | 更新時間 |
| created_by | varchar | NO | 建立者 |
| updated_by | varchar | NO | 更新者 |

**Indexes:** PK (project_id), Unique (project_code)

---

### 2.2 `project.progress_measurement_baselines` ✅ 已存在

| 欄位名 | 型別 | Nullable | 用途 |
|--------|------|----------|------|
| progress_baseline_id | bigint | NO | PK |
| contract_item_id | bigint | NO | FK → contract.contract_items |
| item_code | varchar | NO | 項目代碼 |
| item_name | varchar | NO | 項目名稱 |
| unit | varchar | YES | 單位 |
| unit_price | numeric | YES | 單價 |
| baseline_quantity | numeric | YES | 預定數量 |
| baseline_amount | numeric | YES | 預定金額 |
| weight_percent | numeric | YES | 權重百分比 |
| created_at/updated_at | timestamptz | NO | 時間戳 |
| created_by/updated_by | varchar | NO | 操作者 |

**FK:** contract_item_id → contract.contract_items(contract_item_id)

---

### 2.3 `contract.contract_headers` ✅ 已存在

| 欄位名 | 型別 | Nullable | 用途 |
|--------|------|----------|------|
| contract_id | bigint | NO | PK |
| project_id | bigint | NO | FK → project.projects |
| vendor_id | bigint | YES | FK → vendor.vendors |
| contract_no | varchar | NO | Unique, 合約編號 |
| contract_amount_original | numeric | YES | 原契約金額 |
| contract_amount_current | numeric | YES | 現在契約金額 |
| calendar_days | integer | YES | 日曆天數 |
| created_at/updated_at | timestamptz | NO | 時間戳 |
| created_by/updated_by | varchar | NO | 操作者 |

**FK:** project_id → project.projects, vendor_id → vendor.vendors

---

### 2.4 `contract.contract_items` ✅ 已存在

| 欄位名 | 型別 | Nullable | 用途 |
|--------|------|----------|------|
| contract_item_id | bigint | NO | PK |
| contract_id | bigint | NO | FK → contract.contract_headers |
| item_code | varchar | NO | 項目代碼 |
| item_name | varchar | NO | 項目名稱 |
| unit | varchar | YES | 單位 |
| unit_price | numeric | YES | 單價 |
| contract_quantity_original | numeric | YES | 原預定數量 |
| contract_amount_original | numeric | YES | 原預定金額 |
| contract_quantity_current | numeric | YES | 現預定數量 |
| contract_amount_current | numeric | YES | 現預定金額 |
| is_price_adjustable | boolean | NO | 可調整單價 |
| is_safety_item | boolean | NO | 安全項目 |
| item_level | integer | YES | 階層等級 |
| parent_item_code | varchar | YES | 父項目代碼 |
| parent_item_id | bigint | YES | FK (self-reference) |
| sort_path | varchar | YES | 排序路徑 |
| display_order | integer | YES | 顯示順序 |
| created_at/updated_at | timestamptz | NO | 時間戳 |
| created_by/updated_by | varchar | NO | 操作者 |

**FK:** contract_id → contract.contract_headers, measurement_rule_id, parent_item_id (self)

---

### 2.5 `vendor.vendors` ✅ 已存在

| 欄位名 | 型別 | Nullable | 用途 |
|--------|------|----------|------|
| vendor_id | bigint | NO | PK |
| vendor_code | varchar | YES | Unique, 廠商代碼 |
| vendor_name | varchar | NO | 廠商名稱 |
| tax_id | varchar | YES | 統一編號 |
| contact_name | varchar | YES | 聯絡人 |
| contact_phone | varchar | YES | 電話 |
| contact_email | varchar | YES | Email |
| status | varchar | NO | 狀態 |
| created_at/updated_at | timestamptz | NO | 時間戳 |
| created_by/updated_by | varchar | NO | 操作者 |

**Indexes:** PK (vendor_id), Unique (vendor_code)

---

## 三、Table 關聯圖（Dashboard API）

```
project.projects (1)
       │
       │ 1:N
       ▼
contract.contract_headers (N)
       │
       │ 1:N
       ▼
contract.contract_items (N)
       │                    │
       │                    │ 1:N (self-ref parent)
       │                    ▼
       │              contract.contract_items
       │
       │ 1:N
       ▼
project.progress_measurement_baselines (N)
```

**廠商關聯：** contract.contract_headers.vendor_id → vendor.vendors.vendor_id

---

## 四、Auth 結構狀態

### 4.1 現況：Auth Tables ❌ 不存在

查詢結果：`無任何 auth/user/role/token/permission 相關 table`

目前所有 schema 中的 tables:
- audit: audit_logs, import_batch_rows, import_batches
- contract: contract_headers, contract_item_measurement_rules, contract_items
- document: document_attachments
- finance: advance_payments, advance_payment_recoveries, ...
- project: projects, progress_measurement_baselines
- valuation: valuation_headers, valuation_details, ...
- vendor: vendors

---

### 4.2 最小補表方案（Auth）

若需完整 auth 功能，建議建立以下最小結構：

```sql
-- Schema: auth (新建)
CREATE SCHEMA IF NOT EXISTS auth;

-- 1. users - 使用者主檔
CREATE TABLE auth.users (
    user_id         BIGSERIAL PRIMARY KEY,
    username        VARCHAR(100) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(200),
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. roles - 角色定義
CREATE TABLE auth.roles (
    role_id         BIGSERIAL PRIMARY KEY,
    role_name       VARCHAR(50) NOT NULL UNIQUE,
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. user_roles - 使用者角色對應 (M:N)
CREATE TABLE auth.user_roles (
    user_id         BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE CASCADE,
    role_id         BIGINT NOT NULL REFERENCES auth.roles(role_id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- 4. refresh_tokens - JWT Refresh Token
CREATE TABLE auth.refresh_tokens (
    token_id        BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    device_info     VARCHAR(255),
    ip_address      VARCHAR(45),
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_username ON auth.users(username);
CREATE INDEX idx_refresh_tokens_user_id ON auth.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON auth.refresh_tokens(expires_at);

-- 預設角色
INSERT INTO auth.roles (role_name, description) VALUES 
    ('admin', '系統管理者'),
    ('manager', '專案經理'),
    ('viewer', '僅檢視');
```

---

## 五、Backend/Frontend 影響與建議

### 5.1 Dashboard API（已具備）

| 項目 | 狀態 | 建議 |
|------|------|------|
| 專案清單 | ✅ 可用 | 直接串接 project.projects |
| 合約進度 | ✅ 可用 | 透過 contract_headers → contract_items → progress_baselines 串接 |
| 廠商關聯 | ✅ 可用 | contract.contract_headers.vendor_id 串接 vendor.vendors |
| 金額統計 | ✅ 可用 | 使用 contract_amount_original/current 欄位 |

**建議 Dashboard API SQL Pattern:**
```sql
SELECT p.project_id, p.project_code, p.project_name,
       c.contract_id, c.contract_no, c.contract_amount_current,
       v.vendor_id, v.vendor_name,
       ci.contract_item_id, ci.item_name, ci.contract_quantity_current,
       pb.baseline_quantity, pb.weight_percent
FROM project.projects p
LEFT JOIN contract.contract_headers c ON c.project_id = p.project_id
LEFT JOIN vendor.vendors v ON v.vendor_id = c.vendor_id
LEFT JOIN contract.contract_items ci ON ci.contract_id = c.contract_id
LEFT JOIN project.progress_measurement_baselines pb ON pb.contract_item_id = ci.contract_item_id
WHERE p.project_id = $1;
```

### 5.2 Auth（需實作）

| 項目 | 狀態 | 影響 |
|------|------|------|
| 使用者登入 | ❌ 缺失 | 需新建 auth.users |
| 權限控管 | ❌ 缺失 | 需新建 auth.roles, auth.user_roles |
| JWT Refresh | ❌ 缺失 | 需新建 auth.refresh_tokens |
| 現有 created_by/updated_by | ⚠️ 僅文字 | 目前為 varchar 非 FK，未連結到真實用戶 |

**Backend 建議：**
- 實作 `/auth/login`, `/auth/refresh`, `/auth/logout` API
- 使用 bcrypt 雜湊密碼
- Refresh token 存 DB 而非記憶體

**Frontend 建議：**
- Login page 串接 `/auth/login`
- 將 refresh token 存 httpOnly cookie 或安全儲存
- 401 時自動呼叫 refresh

---

## 六、結論

| 類別 | 狀態 |
|------|------|
| Dashboard Table 結構 | ✅ 完整可用（5 tables + FK relations）|
| Auth 結構 | ❌ 需新建（3 tables minimum）|
| 現有資料筆數 | ⚠️ 目前皆為 0（待 Migration）|

**Next Steps:**
1. 實作 auth schema（users, roles, user_roles, refresh_tokens）
2. 建立 migration 填入初始資料（default users/roles）
3. Dashboard API 可先基於現有 table 結構實作
4. 待 auth 完成後，再將 created_by/updated_by 改為 FK

---

**Document Path:** `/home/beer8/team-workspace/UI-UX/docs/database-dashboard-auth-alignment.md`
**Generated:** 2026-04-14
