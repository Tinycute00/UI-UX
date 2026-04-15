# API Contracts v1.0

> 大成工程 PMIS - Wave 1 API 規格書
> 
> Version: 1.0.0  
> Last Updated: 2026-04-14

---

## 架構概述

- **API 版本**: URL path → `/api/v1/`
- **認證機制**: JWT + httpOnly Cookie，含 refresh token
- **技術堆疊**: TypeScript + Node.js + Fastify/Express
- **架構模式**: Controller → Service → Repository
- **資料格式**: JSON

---

## Auth 認證模組

### POST /api/v1/auth/login

使用者登入並取得存取權杖。

**Permission**: `public`（未登入者可存取）

#### Path Parameters
無

#### Query Parameters
無

#### Request Body

```typescript
interface LoginRequestDTO {
  /** 使用者帳號（員工編號或 email） */
  username: string;
  /** 使用者密碼 */
  password: string;
  /** 記住我（延長 token 有效期） */
  rememberMe?: boolean;
}
```

#### Response Body (200 OK)

```typescript
interface LoginResponseDTO {
  /** 存取權杖（短期有效，15 分鐘） */
  accessToken: string;
  /** 權杖類型 */
  tokenType: 'Bearer';
  /** 存取權杖過期時間（Unix timestamp） */
  expiresAt: number;
  /** 使用者基本資訊 */
  user: {
    id: string;
    username: string;
    displayName: string;
    email: string;
    role: 'admin' | 'supervisor' | 'vendor';
    projectIds: string[];
  };
}
```

**Note**: Refresh token 將透過 httpOnly cookie 自動設定，不會出現在 response body。

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 400 | INVALID_CREDENTIALS | 帳號或密碼錯誤 |
| 400 | ACCOUNT_LOCKED | 帳號已鎖定，請聯繫管理員 |
| 429 | RATE_LIMIT_EXCEEDED | 登入嘗試次數過多，請 30 分鐘後再試 |

#### 依賴 DB Tables

- **待 database role 設計**: `auth.users` - 使用者帳號與認證資訊
- **待 database role 設計**: `auth.sessions` - 登入會話管理（refresh token 儲存）
- **待 database role 設計**: `auth.audit_login_attempts` - 登入嘗試記錄

---

### POST /api/v1/auth/logout

使用者登出並使當前 session 失效。

**Permission**: `authenticated`（任何已登入角色）

#### Path Parameters
無

#### Query Parameters
無

#### Request Body

```typescript
interface LogoutRequestDTO {
  /** 是否登出所有裝置（預設 false） */
  logoutAllDevices?: boolean;
}
```

#### Response Body (200 OK)

```typescript
interface LogoutResponseDTO {
  /** 登出成功 */
  success: true;
  /** 訊息 */
  message: string;
  /** 被清除的 session 數量 */
  clearedSessions: number;
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 500 | SESSION_CLEAR_FAILED | 清除 session 時發生錯誤 |

#### 依賴 DB Tables

- **待 database role 設計**: `auth.sessions` - 登入會話管理

---

### POST /api/v1/auth/refresh

使用 refresh token 換發新的 access token。

**Permission**: `public`（透過 httpOnly cookie 攜帶 refresh token）

#### Path Parameters
無

#### Query Parameters
無

#### Request Body
無（refresh token 從 httpOnly cookie 讀取）

#### Response Body (200 OK)

```typescript
interface RefreshTokenResponseDTO {
  /** 新的存取權杖 */
  accessToken: string;
  /** 權杖類型 */
  tokenType: 'Bearer';
  /** 新的過期時間（Unix timestamp） */
  expiresAt: number;
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | REFRESH_TOKEN_INVALID | Refresh token 無效或已過期 |
| 401 | SESSION_REVOKED | Session 已被撤銷，請重新登入 |
| 403 | REFRESH_TOKEN_REUSED | 偵測到 refresh token 重複使用，所有 session 已撤銷 |

#### 依賴 DB Tables

- **待 database role 設計**: `auth.sessions` - 登入會話與 refresh token 管理

---

### GET /api/v1/auth/me

取得當前登入使用者的詳細資訊。

**Permission**: `authenticated`（任何已登入角色）

#### Path Parameters
無

#### Query Parameters
無

#### Request Body
無

#### Response Body (200 OK)

```typescript
interface GetCurrentUserResponseDTO {
  /** 使用者 ID */
  id: string;
  /** 使用者帳號 */
  username: string;
  /** 顯示名稱 */
  displayName: string;
  /** 電子郵件 */
  email: string;
  /** 角色 */
  role: 'admin' | 'supervisor' | 'vendor';
  /** 所屬專案列表 */
  projects: Array<{
    id: string;
    name: string;
    role: 'admin' | 'supervisor' | 'vendor';
  }>;
  /** 權限列表 */
  permissions: string[];
  /** 帳號建立時間 */
  createdAt: string;
  /** 最後登入時間 */
  lastLoginAt: string;
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 401 | TOKEN_EXPIRED | Access token 已過期，請使用 refresh token |

#### 依賴 DB Tables

- **待 database role 設計**: `auth.users` - 使用者基本資料
- **待 database role 設計**: `auth.user_project_roles` - 使用者專案角色關聯

---

## Dashboard 儀表板模組

### GET /api/v1/projects/:projectId/progress

取得專案的整體進度概覽。

**Permission**: `admin`, `supervisor`, `vendor`（需為該專案成員）

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| projectId | string (UUID) | 專案唯一識別碼 |

#### Query Parameters

| 參數 | 型別 | 說明 | 預設值 |
|------|------|------|--------|
| asOfDate | string (ISO 8601) | 查詢日期（YYYY-MM-DD） | 當日 |

#### Request Body
無

#### Response Body (200 OK)

```typescript
interface GetProjectProgressResponseDTO {
  /** 專案 ID */
  projectId: string;
  /** 專案名稱 */
  projectName: string;
  /** 查詢基準日 */
  asOfDate: string;
  /** 整體進度百分比 */
  overallProgress: {
    /** 計畫進度百分比 */
    planned: number;
    /** 實際進度百分比 */
    actual: number;
    /** 進度差異（actual - planned） */
    variance: number;
  };
  /** 契約總額 */
  contractAmount: number;
  /** 累計請款金額 */
  cumulativeBilledAmount: number;
  /** 已執行金額百分比 */
  billedPercentage: number;
  /** 各階段進度 */
  phases: Array<{
    phaseId: string;
    phaseName: string;
    plannedProgress: number;
    actualProgress: number;
    weight: number;
  }>;
  /** 最近更新時間 */
  lastUpdatedAt: string;
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 403 | FORBIDDEN | 無權限存取此專案 |
| 404 | PROJECT_NOT_FOUND | 找不到指定的專案 |
| 400 | INVALID_DATE_FORMAT | 日期格式錯誤，請使用 YYYY-MM-DD 格式 |

#### 依賴 DB Tables

- `project.projects` - 專案基本資訊
- `project.progress_measurement_baselines` - 進度量測基線
- `valuation.valuation_headers` - 估驗單總覽
- `finance.advance_payments` - 預付款資訊

---

### GET /api/v1/projects/:projectId/work-items

取得專案的工作項目（WBS）清單。

**Permission**: `admin`, `supervisor`, `vendor`（需為該專案成員）

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| projectId | string (UUID) | 專案唯一識別碼 |

#### Query Parameters

| 參數 | 型別 | 說明 | 預設值 |
|------|------|------|--------|
| parentId | string | 父項目 ID（查詢子項目） | - |
| level | number | 層級深度（1-5） | - |
| status | string | 狀態過濾：active, completed, all | active |
| page | number | 頁碼 | 1 |
| limit | number | 每頁筆數（最大 100） | 20 |

#### Request Body
無

#### Response Body (200 OK)

```typescript
interface GetWorkItemsResponseDTO {
  /** 專案 ID */
  projectId: string;
  /** 資料列表 */
  items: Array<{
    /** 項目 ID */
    id: string;
    /** 項目代碼 */
    code: string;
    /** 項目名稱 */
    name: string;
    /** 父項目 ID */
    parentId: string | null;
    /** 層級 */
    level: number;
    /** 計量單位 */
    unit: string;
    /** 契約數量 */
    contractQuantity: number;
    /** 契約單價 */
    contractUnitPrice: number;
    /** 累計完成數量 */
    cumulativeCompletedQuantity: number;
    /** 完成百分比 */
    completionPercentage: number;
    /** 狀態 */
    status: 'pending' | 'in_progress' | 'completed';
    /** 是否有子項目 */
    hasChildren: boolean;
  }>;
  /** 分頁資訊 */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 403 | FORBIDDEN | 無權限存取此專案 |
| 404 | PROJECT_NOT_FOUND | 找不到指定的專案 |
| 400 | INVALID_PARAMETER | 無效的查詢參數 |

#### 依賴 DB Tables

- `project.projects` - 專案基本資訊
- `contract.contract_items` - 契約項目清單
- `contract.contract_item_measurement_rules` - 項目計量規則

---

### GET /api/v1/projects/:projectId/subcontractors

取得專案的協力廠商（次承攬商）清單。

**Permission**: `admin`, `supervisor`, `vendor`（需為該專案成員）

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| projectId | string (UUID) | 專案唯一識別碼 |

#### Query Parameters

| 參數 | 型別 | 說明 | 預設值 |
|------|------|------|--------|
| status | string | 狀態過濾：active, inactive, all | active |
| search | string | 搜尋關鍵字（廠商名稱或統編） | - |
| page | number | 頁碼 | 1 |
| limit | number | 每頁筆數（最大 50） | 20 |

#### Request Body
無

#### Response Body (200 OK)

```typescript
interface GetSubcontractorsResponseDTO {
  /** 專案 ID */
  projectId: string;
  /** 協力廠商列表 */
  subcontractors: Array<{
    /** 廠商 ID */
    id: string;
    /** 廠商名稱 */
    name: string;
    /** 統一編號 */
    taxId: string;
    /** 聯絡人 */
    contactPerson: string;
    /** 聯絡電話 */
    contactPhone: string;
    /** 電子郵件 */
    email: string;
    /** 廠商類型 */
    type: 'general' | 'specialized' | 'labor_only';
    /** 承攬項目數 */
    contractedItemsCount: number;
    /** 累計請款金額 */
    cumulativeBilledAmount: number;
    /** 合約狀態 */
    contractStatus: 'active' | 'suspended' | 'terminated';
    /** 合約開始日期 */
    contractStartDate: string;
    /** 合約結束日期 */
    contractEndDate: string | null;
  }>;
  /** 分頁資訊 */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 403 | FORBIDDEN | 無權限存取此專案 |
| 404 | PROJECT_NOT_FOUND | 找不到指定的專案 |

#### 依賴 DB Tables

- `project.projects` - 專案基本資訊
- `vendor.vendors` - 廠商主檔
- `contract.contract_headers` - 契約總表
- `valuation.valuation_headers` - 估驗單資訊

---

## Billing 估驗計價模組

### GET /api/v1/projects/:projectId/valuations

取得專案的估驗單清單。

**Permission**: `admin`, `supervisor`, `vendor`（需為該專案成員，vendor 僅能查看自己的估驗單）

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| projectId | string (UUID) | 專案唯一識別碼 |

#### Query Parameters

| 參數 | 型別 | 說明 | 預設值 |
|------|------|------|--------|
| status | string | 狀態過濾：draft, pending_review, approved, rejected, paid | - |
| period | string | 估驗期別（格式：YYYY-MM） | - |
| vendorId | string | 廠商 ID 過濾 | - |
| page | number | 頁碼 | 1 |
| limit | number | 每頁筆數（最大 50） | 20 |
| sortBy | string | 排序欄位：createdAt, period, status | createdAt |
| sortOrder | string | 排序方向：asc, desc | desc |

#### Request Body
無

#### Response Body (200 OK)

```typescript
interface GetValuationsResponseDTO {
  /** 專案 ID */
  projectId: string;
  /** 估驗單列表 */
  valuations: Array<{
    /** 估驗單 ID */
    id: string;
    /** 估驗單號 */
    valuationNo: string;
    /** 估驗期別 */
    period: string;
    /** 廠商 ID */
    vendorId: string;
    /** 廠商名稱 */
    vendorName: string;
    /** 估驗狀態 */
    status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'paid';
    /** 估驗日期 */
    valuationDate: string;
    /** 本期金額（含稅） */
    currentPeriodAmount: number;
    /** 累計金額（含稅） */
    cumulativeAmount: number;
    /** 預付款扣回金額 */
    advancePaymentRecovery: number;
    /** 保留款金額 */
    retentionAmount: number;
    /** 實付金額 */
    netPayableAmount: number;
    /** 建立時間 */
    createdAt: string;
    /** 最後更新時間 */
    updatedAt: string;
  }>;
  /** 分頁資訊 */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** 統計摘要 */
  summary: {
    /** 估驗單總數 */
    totalCount: number;
    /** 本期總金額 */
    totalCurrentPeriodAmount: number;
    /** 累計總金額 */
    totalCumulativeAmount: number;
  };
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 403 | FORBIDDEN | 無權限存取此專案的估驗資料 |
| 404 | PROJECT_NOT_FOUND | 找不到指定的專案 |
| 400 | INVALID_PARAMETER | 無效的查詢參數 |

#### 依賴 DB Tables

- `project.projects` - 專案基本資訊
- `valuation.valuation_headers` - 估驗單總表
- `valuation.valuation_details` - 估驗單明細
- `vendor.vendors` - 廠商主檔

---

### GET /api/v1/valuations/:id

取得單一估驗單的詳細資訊。

**Permission**: `admin`, `supervisor`, `vendor`（需為該估驗單相關專案成員，vendor 僅能查看自己的估驗單）

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| id | string (UUID) | 估驗單 ID |

#### Query Parameters
無

#### Request Body
無

#### Response Body (200 OK)

```typescript
interface GetValuationDetailResponseDTO {
  /** 估驗單 ID */
  id: string;
  /** 估驗單號 */
  valuationNo: string;
  /** 專案資訊 */
  project: {
    id: string;
    name: string;
  };
  /** 廠商資訊 */
  vendor: {
    id: string;
    name: string;
    taxId: string;
  };
  /** 估驗期別 */
  period: string;
  /** 估驗日期 */
  valuationDate: string;
  /** 狀態 */
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'paid';
  /** 估驗明細 */
  items: Array<{
    /** 明細 ID */
    id: string;
    /** 項目代碼 */
    itemCode: string;
    /** 項目名稱 */
    itemName: string;
    /** 單位 */
    unit: string;
    /** 契約單價 */
    contractUnitPrice: number;
    /** 本期完成數量 */
    currentQuantity: number;
    /** 本期完成金額 */
    currentAmount: number;
    /** 累計完成數量 */
    cumulativeQuantity: number;
    /** 累計完成金額 */
    cumulativeAmount: number;
  }>;
  /** 金額摘要 */
  amountSummary: {
    /** 本期金額（未稅） */
    currentPeriodAmount: number;
    /** 營業稅 */
    vatAmount: number;
    /** 本期金額（含稅） */
    currentPeriodAmountWithTax: number;
    /** 預付款扣回 */
    advancePaymentRecovery: number;
    /** 保留款 */
    retentionAmount: number;
    /** 代扣款項 */
    deductions: number;
    /** 實付金額 */
    netPayableAmount: number;
  };
  /** 審核記錄 */
  reviews: Array<{
    /** 審核 ID */
    id: string;
    /** 審核人 */
    reviewer: string;
    /** 審核結果 */
    decision: 'approved' | 'rejected' | 'pending';
    /** 審核意見 */
    comments: string | null;
    /** 審核時間 */
    reviewedAt: string;
  }>;
  /** 建立時間 */
  createdAt: string;
  /** 最後更新時間 */
  updatedAt: string;
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 403 | FORBIDDEN | 無權限查看此估驗單 |
| 404 | VALUATION_NOT_FOUND | 找不到指定的估驗單 |

#### 依賴 DB Tables

- `valuation.valuation_headers` - 估驗單總表
- `valuation.valuation_details` - 估驗單明細
- `valuation.valuation_reviews` - 估驗審核記錄
- `contract.contract_items` - 契約項目
- `vendor.vendors` - 廠商主檔

---

### GET /api/v1/projects/:projectId/advance-payments

取得專案的預付款資訊。

**Permission**: `admin`, `supervisor`（vendor 僅限查看自己的預付款）

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| projectId | string (UUID) | 專案唯一識別碼 |

#### Query Parameters

| 參數 | 型別 | 說明 | 預設值 |
|------|------|------|--------|
| vendorId | string | 廠商 ID 過濾 | - |
| status | string | 狀態：active, fully_recovered, cancelled | - |
| page | number | 頁碼 | 1 |
| limit | number | 每頁筆數 | 20 |

#### Request Body
無

#### Response Body (200 OK)

```typescript
interface GetAdvancePaymentsResponseDTO {
  /** 專案 ID */
  projectId: string;
  /** 預付款列表 */
  advancePayments: Array<{
    /** 預付款 ID */
    id: string;
    /** 預付款編號 */
    paymentNo: string;
    /** 廠商 ID */
    vendorId: string;
    /** 廠商名稱 */
    vendorName: string;
    /** 預付款類型 */
    type: 'material' | 'equipment' | 'other';
    /** 預付款金額 */
    amount: number;
    /** 已扣回金額 */
    recoveredAmount: number;
    /** 剩餘未扣回金額 */
    remainingAmount: number;
    /** 扣回比例 */
    recoveryRate: number;
    /** 狀態 */
    status: 'active' | 'fully_recovered' | 'cancelled';
    /** 預付款日期 */
    paymentDate: string;
    /** 預計扣回完成日期 */
    estimatedRecoveryCompletionDate: string | null;
    /** 備註 */
    notes: string | null;
  }>;
  /** 分頁資訊 */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** 統計摘要 */
  summary: {
    /** 預付款總數 */
    totalCount: number;
    /** 預付款總額 */
    totalAmount: number;
    /** 已扣回總額 */
    totalRecoveredAmount: number;
    /** 剩餘未扣回總額 */
    totalRemainingAmount: number;
  };
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 403 | FORBIDDEN | 無權限存取預付款資料 |
| 404 | PROJECT_NOT_FOUND | 找不到指定的專案 |

#### 依賴 DB Tables

- `project.projects` - 專案基本資訊
- `finance.advance_payments` - 預付款主檔
- `finance.advance_payment_recoveries` - 預付款扣回記錄
- `finance.vw_advance_payment_balance` - 預付款餘額檢視表
- `vendor.vendors` - 廠商主檔

---

### GET /api/v1/projects/:projectId/price-adjustments

取得專案的物價調整資訊。

**Permission**: `admin`, `supervisor`（vendor 僅限查看自己的調整）

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| projectId | string (UUID) | 專案唯一識別碼 |

#### Query Parameters

| 參數 | 型別 | 說明 | 預設值 |
|------|------|------|--------|
| adjustmentType | string | 調整類型：cpi_based, formula_based, negotiated | - |
| effectiveYear | number | 生效年份 | - |
| page | number | 頁碼 | 1 |
| limit | number | 每頁筆數 | 20 |

#### Request Body
無

#### Response Body (200 OK)

```typescript
interface GetPriceAdjustmentsResponseDTO {
  /** 專案 ID */
  projectId: string;
  /** 物價調整列表 */
  adjustments: Array<{
    /** 調整 ID */
    id: string;
    /** 調整編號 */
    adjustmentNo: string;
    /** 調整類型 */
    type: 'cpi_based' | 'formula_based' | 'negotiated';
    /** 調整項目 */
    itemName: string;
    /** 基期價格 */
    basePrice: number;
    /** 當期價格 */
    currentPrice: number;
    /** 調整係數 */
    adjustmentFactor: number;
    /** 調整金額 */
    adjustmentAmount: number;
    /** 生效日期 */
    effectiveDate: string;
    /** 調整原因說明 */
    description: string;
    /** 審核狀態 */
    approvalStatus: 'pending' | 'approved' | 'rejected';
  }>;
  /** 分頁資訊 */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** 統計摘要 */
  summary: {
    /** 調整項目總數 */
    totalCount: number;
    /** 調整金額總計 */
    totalAdjustmentAmount: number;
  };
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 403 | FORBIDDEN | 無權限存取物價調整資料 |
| 404 | PROJECT_NOT_FOUND | 找不到指定的專案 |

#### 依賴 DB Tables

- `project.projects` - 專案基本資訊
- `valuation.price_adjustment_*`（8 tables）- 物價調整相關表格

---

## Safety 安全管理模組

### POST /api/v1/safety-inspections

建立新的安全檢查紀錄。

**Permission**: `admin`, `supervisor`

#### Path Parameters
無

#### Query Parameters
無

#### Request Body

```typescript
interface CreateSafetyInspectionRequestDTO {
  /** 專案 ID */
  projectId: string;
  /** 檢查日期 */
  inspectionDate: string;
  /** 檢查類型 */
  type: 'daily' | 'weekly' | 'monthly' | 'special' | 'incident';
  /** 檢查位置/區域 */
  location: string;
  /** 檢查項目列表 */
  checkItems: Array<{
    /** 檢查項目 ID */
    itemId: string;
    /** 項目名稱 */
    itemName: string;
    /** 檢查結果：pass, fail, na */
    result: 'pass' | 'fail' | 'na';
    /** 備註 */
    notes?: string;
    /** 缺失照片 URL 列表 */
    photoUrls?: string[];
  }>;
  /** 整體評估 */
  overallAssessment: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  /** 發現的缺失數量 */
  violationsFound: number;
  /** 需立即改善項目數量 */
  immediateActionsRequired: number;
  /** 檢查人員 */
  inspectorName: string;
  /** 檢查人員職稱 */
  inspectorTitle: string;
  /** 陪同人員 */
  accompaniedBy?: string;
  /** 天氣狀況 */
  weatherCondition?: string;
  /** 備註 */
  notes?: string;
}
```

#### Response Body (201 Created)

```typescript
interface CreateSafetyInspectionResponseDTO {
  /** 檢查紀錄 ID */
  id: string;
  /** 檢查編號 */
  inspectionNo: string;
  /** 專案 ID */
  projectId: string;
  /** 建立狀態 */
  status: 'created';
  /** 建立時間 */
  createdAt: string;
  /** 檢查項目摘要 */
  summary: {
    /** 總檢查項目數 */
    totalItems: number;
    /** 合格項目數 */
    passedItems: number;
    /** 不合格項目數 */
    failedItems: number;
    /** 不適用項目數 */
    naItems: number;
  };
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 403 | FORBIDDEN | 無權限建立安全檢查紀錄 |
| 400 | INVALID_PROJECT | 無效的專案 ID 或專案不存在 |
| 400 | VALIDATION_ERROR | 請求資料驗證失敗 |
| 409 | DUPLICATE_INSPECTION | 該日期已存在相同類型的檢查紀錄 |

#### 依賴 DB Tables

- `safety.safety_headers` - 安全檢查總表
- `safety.safety_details` - 安全檢查明細
- `project.projects` - 專案基本資訊
- **待 database role 設計**: `safety.inspection_checklist_templates` - 檢查項目範本

---

### GET /api/v1/safety-inspections

取得安全檢查紀錄清單。

**Permission**: `admin`, `supervisor`, `vendor`（vendor 僅限查看自己承攬區域的檢查）

#### Path Parameters
無

#### Query Parameters

| 參數 | 型別 | 說明 | 預設值 |
|------|------|------|--------|
| projectId | string | 專案 ID 過濾（必填） | - |
| type | string | 檢查類型：daily, weekly, monthly, special, incident | - |
| startDate | string | 開始日期（YYYY-MM-DD） | - |
| endDate | string | 結束日期（YYYY-MM-DD） | - |
| status | string | 狀態：open, closed, pending_action | - |
| severity | string | 嚴重程度：low, medium, high, critical | - |
| page | number | 頁碼 | 1 |
| limit | number | 每頁筆數（最大 50） | 20 |
| sortBy | string | 排序欄位：inspectionDate, createdAt | inspectionDate |
| sortOrder | string | 排序方向：asc, desc | desc |

#### Request Body
無

#### Response Body (200 OK)

```typescript
interface GetSafetyInspectionsResponseDTO {
  /** 檢查紀錄列表 */
  inspections: Array<{
    /** 檢查紀錄 ID */
    id: string;
    /** 檢查編號 */
    inspectionNo: string;
    /** 專案 ID */
    projectId: string;
    /** 專案名稱 */
    projectName: string;
    /** 檢查日期 */
    inspectionDate: string;
    /** 檢查類型 */
    type: 'daily' | 'weekly' | 'monthly' | 'special' | 'incident';
    /** 檢查位置 */
    location: string;
    /** 整體評估 */
    overallAssessment: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    /** 缺失數量 */
    violationsFound: number;
    /** 待改善項目數量 */
    pendingActions: number;
    /** 狀態 */
    status: 'open' | 'closed' | 'pending_action';
    /** 檢查人員 */
    inspectorName: string;
    /** 建立時間 */
    createdAt: string;
  }>;
  /** 分頁資訊 */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** 統計摘要 */
  summary: {
    /** 總檢查次數 */
    totalInspections: number;
    /** 待改善項目總數 */
    totalPendingActions: number;
    /** 高風險檢查數 */
    highRiskCount: number;
  };
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 400 | MISSING_REQUIRED_PARAM | 缺少必填參數：projectId |
| 403 | FORBIDDEN | 無權限查看此專案的安全檢查紀錄 |
| 400 | INVALID_DATE_RANGE | 日期範圍無效 |

#### 依賴 DB Tables

- `safety.safety_headers` - 安全檢查總表
- `safety.violation_records` - 缺失記錄
- `project.projects` - 專案基本資訊

---

### GET /api/v1/safety-inspections/:id

取得單一安全檢查紀錄的詳細資訊。

**Permission**: `admin`, `supervisor`, `vendor`（vendor 僅限查看自己承攬區域的檢查）

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| id | string (UUID) | 安全檢查紀錄 ID |

#### Query Parameters
無

#### Request Body
無

#### Response Body (200 OK)

```typescript
interface GetSafetyInspectionDetailResponseDTO {
  /** 檢查紀錄 ID */
  id: string;
  /** 檢查編號 */
  inspectionNo: string;
  /** 專案資訊 */
  project: {
    id: string;
    name: string;
  };
  /** 檢查日期 */
  inspectionDate: string;
  /** 檢查類型 */
  type: 'daily' | 'weekly' | 'monthly' | 'special' | 'incident';
  /** 檢查位置 */
  location: string;
  /** 檢查項目詳細結果 */
  checkItems: Array<{
    /** 項目 ID */
    id: string;
    /** 檢查項目名稱 */
    itemName: string;
    /** 檢查類別 */
    category: string;
    /** 檢查結果 */
    result: 'pass' | 'fail' | 'na';
    /** 法規依據 */
    regulationReference?: string;
    /** 備註 */
    notes?: string;
    /** 照片 URL 列表 */
    photos: string[];
  }>;
  /** 缺失記錄 */
  violations: Array<{
    /** 缺失 ID */
    id: string;
    /** 關聯檢查項目 */
    checkItemId: string;
    /** 缺失描述 */
    description: string;
    /** 嚴重程度 */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** 法規條文 */
    violatedRegulation?: string;
    /** 改善期限 */
    correctionDeadline?: string;
    /** 改善狀態 */
    correctionStatus: 'pending' | 'in_progress' | 'completed' | 'verified';
    /** 負責廠商 */
    responsibleVendorId?: string;
    /** 負責廠商名稱 */
    responsibleVendorName?: string;
    /** 照片 URL */
    photos: string[];
  }>;
  /** 整體評估 */
  overallAssessment: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  /** 整體評估說明 */
  overallAssessmentNotes?: string;
  /** 檢查人員資訊 */
  inspector: {
    name: string;
    title: string;
    signatureUrl?: string;
  };
  /** 陪同人員 */
  accompaniedBy?: string;
  /** 天氣狀況 */
  weatherCondition?: string;
  /** 狀態 */
  status: 'open' | 'closed' | 'pending_action';
  /** 附件列表 */
  attachments: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  /** 建立時間 */
  createdAt: string;
  /** 最後更新時間 */
  updatedAt: string;
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 403 | FORBIDDEN | 無權限查看此安全檢查紀錄 |
| 404 | INSPECTION_NOT_FOUND | 找不到指定的安全檢查紀錄 |

#### 依賴 DB Tables

- `safety.safety_headers` - 安全檢查總表
- `safety.safety_details` - 安全檢查明細
- `safety.violation_records` - 缺失記錄
- `safety.attachments` - 附件
- `project.projects` - 專案基本資訊
- `vendor.vendors` - 廠商主檔

---

### PATCH /api/v1/safety-inspections/:id

更新安全檢查紀錄（部分更新）。

**Permission**: `admin`, `supervisor`

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| id | string (UUID) | 安全檢查紀錄 ID |

#### Query Parameters
無

#### Request Body

```typescript
interface UpdateSafetyInspectionRequestDTO {
  /** 檢查日期 */
  inspectionDate?: string;
  /** 檢查位置 */
  location?: string;
  /** 檢查項目更新 */
  checkItems?: Array<{
    itemId: string;
    result?: 'pass' | 'fail' | 'na';
    notes?: string;
  }>;
  /** 整體評估 */
  overallAssessment?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  /** 檢查人員 */
  inspectorName?: string;
  /** 檢查人員職稱 */
  inspectorTitle?: string;
  /** 陪同人員 */
  accompaniedBy?: string;
  /** 天氣狀況 */
  weatherCondition?: string;
  /** 備註 */
  notes?: string;
  /** 缺失改善狀態更新 */
  violationsUpdate?: Array<{
    violationId: string;
    correctionStatus?: 'pending' | 'in_progress' | 'completed' | 'verified';
    correctionDeadline?: string;
    correctionDescription?: string;
  }>;
}
```

#### Response Body (200 OK)

```typescript
interface UpdateSafetyInspectionResponseDTO {
  /** 檢查紀錄 ID */
  id: string;
  /** 更新狀態 */
  status: 'updated';
  /** 更新時間 */
  updatedAt: string;
  /** 更新的欄位 */
  updatedFields: string[];
  /** 當前狀態 */
  currentState: {
    inspectionDate: string;
    location: string;
    overallAssessment: string;
    violationsFound: number;
    pendingActions: number;
  };
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 403 | FORBIDDEN | 無權限更新此安全檢查紀錄 |
| 404 | INSPECTION_NOT_FOUND | 找不到指定的安全檢查紀錄 |
| 400 | VALIDATION_ERROR | 請求資料驗證失敗 |
| 409 | CONCURRENT_MODIFICATION | 資料已被其他使用者修改，請重新載入 |

#### 依賴 DB Tables

- `safety.safety_headers` - 安全檢查總表
- `safety.safety_details` - 安全檢查明細
- `safety.violation_records` - 缺失記錄
- `audit.audit_logs` - 稽核記錄（追蹤變更）

---

### POST /api/v1/safety-inspections/:id/attachments

上傳安全檢查相關附件。

**Permission**: `admin`, `supervisor`

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| id | string (UUID) | 安全檢查紀錄 ID |

#### Query Parameters
無

#### Request Body

**Content-Type**: `multipart/form-data`

```typescript
interface UploadAttachmentRequestDTO {
  /** 附件檔案（可上傳多個，總大小限制 50MB） */
  files: File[];
  /** 附件類型 */
  type: 'photo' | 'document' | 'drawing';
  /** 附件說明 */
  description?: string;
  /** 關聯的檢查項目 ID（選填） */
  relatedCheckItemId?: string;
  /** 關聯的缺失記錄 ID（選填） */
  relatedViolationId?: string;
}
```

#### Response Body (201 Created)

```typescript
interface UploadAttachmentResponseDTO {
  /** 上傳結果 */
  uploadedFiles: Array<{
    /** 附件 ID */
    id: string;
    /** 檔案名稱 */
    fileName: string;
    /** 檔案類型 */
    fileType: string;
    /** 檔案大小（bytes） */
    fileSize: number;
    /** 檔案 URL */
    fileUrl: string;
    /** 上傳狀態 */
    status: 'success' | 'failed';
    /** 錯誤訊息（如果失敗） */
    error?: string;
  }>;
  /** 成功上傳數量 */
  successCount: number;
  /** 失敗數量 */
  failedCount: number;
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 403 | FORBIDDEN | 無權限上傳附件至此檢查紀錄 |
| 404 | INSPECTION_NOT_FOUND | 找不到指定的安全檢查紀錄 |
| 400 | FILE_TOO_LARGE | 檔案大小超過限制（單檔 10MB，總計 50MB） |
| 400 | INVALID_FILE_TYPE | 不支援的檔案類型 |
| 413 | PAYLOAD_TOO_LARGE | 上傳內容過大 |

#### 依賴 DB Tables

- `safety.safety_headers` - 安全檢查總表
- `safety.attachments` - 附件記錄
- `document.document_attachments` - 文件附件統一管理

---

### GET /api/v1/safety-inspections/summary

取得安全檢查月報摘要。

**Permission**: `admin`, `supervisor`

#### Path Parameters
無

#### Query Parameters

| 參數 | 型別 | 說明 | 預設值 |
|------|------|------|--------|
| projectId | string | 專案 ID（必填） | - |
| year | number | 年份 | 當前年份 |
| month | number | 月份（1-12） | 當前月份 |

#### Request Body
無

#### Response Body (200 OK)

```typescript
interface GetSafetySummaryResponseDTO {
  /** 報表期間 */
  period: {
    year: number;
    month: number;
    monthName: string;
  };
  /** 專案資訊 */
  project: {
    id: string;
    name: string;
  };
  /** 檢查統計 */
  inspectionStats: {
    /** 總檢查次數 */
    totalInspections: number;
    /** 日檢查次數 */
    dailyInspections: number;
    /** 週檢查次數 */
    weeklyInspections: number;
    /** 月檢查次數 */
    monthlyInspections: number;
    /** 專項檢查次數 */
    specialInspections: number;
  };
  /** 缺失統計 */
  violationStats: {
    /** 發現缺失總數 */
    totalViolationsFound: number;
    /** 已改善數量 */
    correctedViolations: number;
    /** 改善中數量 */
    inProgressViolations: number;
    /** 待改善數量 */
    pendingViolations: number;
    /** 依嚴重程度分類 */
    bySeverity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  /** 依檢查類別統計 */
  categoryStats: Array<{
    /** 類別名稱 */
    category: string;
    /** 檢查項目總數 */
    totalItems: number;
    /** 合格項目數 */
    passedItems: number;
    /** 不合格項目數 */
    failedItems: number;
    /** 合格率 */
    passRate: number;
  }>;
  /** 趨勢資料（近 6 個月） */
  trends: Array<{
    year: number;
    month: number;
    inspections: number;
    violations: number;
    correctionRate: number;
  }>;
  /** 前五大缺失類型 */
  topViolationTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  /** 生成時間 */
  generatedAt: string;
}
```

#### Error Cases

| HTTP Status | Error Code | Message |
|------------|------------|---------|
| 401 | UNAUTHORIZED | 未提供有效的認證資訊 |
| 400 | MISSING_REQUIRED_PARAM | 缺少必填參數：projectId |
| 403 | FORBIDDEN | 無權限查看此專案的安全月報 |
| 404 | PROJECT_NOT_FOUND | 找不到指定的專案 |
| 400 | INVALID_PERIOD | 無效的月份（必須為 1-12） |

#### 依賴 DB Tables

- `safety.safety_headers` - 安全檢查總表
- `safety.safety_details` - 安全檢查明細
- `safety.violation_records` - 缺失記錄
- `safety.vw_monthly_safety_summary` - 安全月報檢視表
- `project.projects` - 專案基本資訊

---

## 附錄

### 通用錯誤代碼

| Error Code | HTTP Status | 說明 |
|------------|-------------|------|
| UNAUTHORIZED | 401 | 未提供有效的認證資訊 |
| FORBIDDEN | 403 | 無權限執行此操作 |
| NOT_FOUND | 404 | 找不到指定的資源 |
| VALIDATION_ERROR | 400 | 請求資料驗證失敗 |
| RATE_LIMIT_EXCEEDED | 429 | 請求頻率超過限制 |
| INTERNAL_SERVER_ERROR | 500 | 伺服器內部錯誤 |
| SERVICE_UNAVAILABLE | 503 | 服務暫時無法使用 |

### 通用 HTTP Headers

| Header | 說明 |
|--------|------|
| `Authorization` | Bearer token 格式：`Bearer <accessToken>` |
| `Content-Type` | 請求內容類型，通常為 `application/json` |
| `X-Request-ID` | 請求追蹤 ID，用於日誌追蹤 |
| `X-API-Version` | API 版本，目前為 `v1` |

### 分頁參數說明

所有列表查詢 API 均支援以下分頁參數：

- `page`: 頁碼（從 1 開始）
- `limit`: 每頁筆數

回應中的 `pagination` 物件包含：
- `page`: 當前頁碼
- `limit`: 每頁筆數
- `total`: 總筆數
- `totalPages`: 總頁數

### 日期時間格式

- **日期**: `YYYY-MM-DD` (ISO 8601)
- **日期時間**: `YYYY-MM-DDTHH:mm:ssZ` (ISO 8601 UTC)

### 金額格式

所有金額欄位均為數字型別，單位為新台幣（TWD），精確到分（小數點後兩位）。
