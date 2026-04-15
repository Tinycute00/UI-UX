# DevOps DB-307 Auth Unblock Report

**Date:** 2026-04-15  
**Executed by:** DevOps (pmis_admin superuser)  
**DB:** `public_works_db` on `pmis-postgres` container  
**Timestamp:** 2026-04-15T15:xx UTC (local docker)  
**Status:** ✅ 完全閉合 — auth schema migration + grants + seed 全部完成

---

## 1. Pre-execution State

| Item | Before |
|------|--------|
| `auth` schema | 存在（空） |
| `auth` tables | 0 |
| `pmis` USAGE on auth | ❌ false |
| `auth.users` rows | 0 |

---

## 2. Migration Result

### Tables Created

| Table | Status |
|-------|--------|
| `auth.users` | ✅ Created |
| `auth.sessions` | ✅ Created |
| `auth.audit_login_attempts` | ✅ Created |
| `auth.user_project_roles` | ✅ Created |

**Table count verification:** `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'auth'` → **4 rows** ✅

### Enum Created
- `auth.UserRole`: `admin`, `supervisor`, `vendor` ✅

### Indexes Created
- `users_username_key` (unique)
- `users_email_key` (unique)
- `sessions_refresh_token_hash_key` (unique)
- `user_project_roles_user_id_project_id_key` (unique composite)

### Foreign Keys
- `auth.sessions.user_id` → `auth.users.user_id` ON DELETE CASCADE
- `auth.user_project_roles.user_id` → `auth.users.user_id` ON DELETE CASCADE

---

## 3. Grants Result

```sql
GRANT USAGE ON SCHEMA auth TO pmis;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO pmis;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO pmis;
```

**Verification:** `has_schema_privilege('pmis', 'auth', 'USAGE')` = **true** ✅

`pmis` role SELECT test:
```
SELECT username, role, is_active FROM auth.users;
→ testuser | vendor | t
→ admin    | admin  | t
(2 rows) ✅
```

---

## 4. Seed Result

| username | email | role | is_active | password |
|----------|-------|------|-----------|----------|
| testuser | testuser@pmis.local | vendor | true | password123 (bcrypt hash, cost=10) |
| admin | admin@pmis.local | admin | true | password123 (bcrypt hash, cost=10) |

**Verification:** `SELECT COUNT(*) FROM auth.users` → **2 rows** ✅

---

## 5. Post-execution State

| Item | After |
|------|-------|
| `auth` schema | 存在 |
| `auth` tables | **4** ✅ |
| `pmis` USAGE on auth | ✅ true |
| `auth.users` rows | **2** (testuser + admin) ✅ |
| backend DATABASE_URL | `pmis_admin@public_works_db`（維持不變） |

---

## 6. Rollback Plan

如需完整 rollback（移除 auth schema 所有物件）：

```sql
-- ⚠️ WARNING: This removes ALL auth data permanently
-- ROLLBACK: remove auth schema entirely
DROP SCHEMA auth CASCADE;
```

**範圍：** 僅影響 `auth` schema，不影響 `project` schema 或 `public` schema。

---

## 7. Known Risks & Post-unblock Notes

### 7.1 `updated_at` — 無 DB-side trigger

`auth.users.updated_at` 設有 `DEFAULT CURRENT_TIMESTAMP`，但**沒有 DB-side trigger**。
這意味著 UPDATE 時不會自動更新此欄位。

**責任方：** Backend  
**處理方式：** Prisma `@updatedAt` 在 ORM 層自動管理（`updatedAt DateTime @updatedAt`）。只要所有寫入都通過 Prisma ORM，此欄位會正確更新。非 Prisma 寫入（直接 SQL）需手動更新。

### 7.2 service role 與 migration role 未分離

目前 backend 容器使用 `pmis_admin`（Superuser），這是 migration role，不應作為 runtime service role。

**建議：** 後續建立專用 `pmis_app` role，只授予必要 CRUD 權限，替換 `DATABASE_URL` 中的 `pmis_admin`。這是安全性強化項，不是今日 unblock 阻塞點。

### 7.3 Staging 環境尚未同步

此次 migration 僅在 local docker `pmis-postgres` 執行。Staging/Production 環境仍需同步。

**建議：** 在 CI/CD pipeline 加入此 migration 步驟：
```bash
docker exec pmis-postgres psql -U pmis_admin -d public_works_db -f backend/prisma/migrations/20260414143005_init_auth_schema/migration.sql
```

---

## 8. Next Steps (for team)

1. **Backend (立即)：** 確認 `/api/v1/auth/login` endpoint 以 `testuser/password123` 或 `admin/password123` 可成功登入
2. **Backend：** 確認 `/auth/me` 和 `/auth/refresh` token flow 正確
3. **Tester：** 執行 auth E2E 測試（login → me → refresh → logout）
4. **DevOps（後續）：** 建立 `pmis_app` runtime role，分離 migration 與 service 帳號
5. **DevOps（後續）：** 在 CI/CD 加入 migration 自動化步驟

---

## 9. DB Connection Materials Summary (for team reference)

| Item | Value |
|------|-------|
| DB Container | `pmis-postgres` (port 5432) |
| DB Name | `public_works_db` |
| Migration Role | `pmis_admin` (Superuser) |
| Backend Runtime Role | `pmis_admin` (current, to be separated later) |
| Auth Schema | `auth` |
| Test Accounts | testuser/password123, admin/password123 |
