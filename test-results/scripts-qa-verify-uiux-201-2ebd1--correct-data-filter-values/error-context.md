# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scripts/qa-verify-uiux-201-playwright.spec.js >> UIUX-201 Verification >> docs.html has 6 filter buttons with data-action="filter-docs" and correct data-filter values
- Location: scripts/qa-verify-uiux-201-playwright.spec.js:9:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#v-docs') to be visible
    63 × locator resolved to hidden <div id="v-docs" class="view active">…</div>

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]: 大
        - generic [ref=e7]:
          - generic [ref=e8]: 大成工程
          - generic [ref=e9]: Project Mgmt IS · v2.1
      - generic "收折側欄" [ref=e10] [cursor=pointer]:
        - img [ref=e11]
    - generic [ref=e13] [cursor=pointer]:
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: 當前工地
          - generic [ref=e17]: ▾
        - generic [ref=e18]: 台北 W Hotel 改建工程
        - generic [ref=e19]: TC-2024-018
      - img [ref=e21]
    - generic [ref=e25]: SITE ONLINE · 今日正常施工
    - navigation [ref=e26]:
      - generic [ref=e27]: 管理核心
      - generic [ref=e28] [cursor=pointer]:
        - img [ref=e30]
        - generic [ref=e32]: 工地總覽
      - generic [ref=e33] [cursor=pointer]:
        - img [ref=e35]
        - generic [ref=e37]: 晨會記錄
        - generic [ref=e38]: 今
      - generic [ref=e39] [cursor=pointer]:
        - img [ref=e41]
        - generic [ref=e43]: 施工日報
      - generic [ref=e44]: 品質管理
      - generic [ref=e45] [cursor=pointer]:
        - img [ref=e47]
        - generic [ref=e49]: 查驗資料 (IR)
        - generic [ref=e50]: "3"
      - generic [ref=e51] [cursor=pointer]:
        - img [ref=e53]
        - generic [ref=e55]: 缺失追蹤 (NCR)
        - generic [ref=e56]: "7"
      - generic [ref=e57] [cursor=pointer]:
        - img [ref=e59]
        - generic [ref=e61]: 材料進場驗收
      - generic [ref=e62]: 職業安全
      - generic [ref=e63] [cursor=pointer]:
        - img [ref=e65]
        - generic [ref=e67]: 工安巡檢
      - generic [ref=e68]: 工務財務
      - generic [ref=e69] [cursor=pointer]:
        - img [ref=e71]
        - generic [ref=e73]: 分包商管理
      - generic [ref=e74] [cursor=pointer]:
        - img [ref=e76]
        - generic [ref=e78]: 估驗請款
      - generic [ref=e79] [cursor=pointer]:
        - img [ref=e81]
        - generic [ref=e83]: 文件管理
    - generic [ref=e84]:
      - generic [ref=e85]: 王
      - generic [ref=e86]:
        - generic [ref=e87]: 王建明
        - generic [ref=e88]: Site Manager
  - banner [ref=e90]:
    - generic [ref=e91]:
      - generic [ref=e92]: 文件管理
      - generic [ref=e93]: TC-2024-018 › 文件管理
    - generic [ref=e94]:
      - generic [ref=e95]: 2026年4月14日 週二
      - generic [ref=e96] [cursor=pointer]:
        - img [ref=e98]
        - generic [ref=e100]: "5"
      - img [ref=e103] [cursor=pointer]
      - button "新增" [ref=e105] [cursor=pointer]:
        - img [ref=e107]
        - text: 新增
  - generic [ref=e110]:
    - generic [ref=e112]: 所有功能
    - generic [ref=e113]:
      - generic [ref=e114] [cursor=pointer]:
        - img [ref=e117]
        - generic [ref=e119]: 工地總覽
      - generic [ref=e120] [cursor=pointer]:
        - img [ref=e123]
        - generic [ref=e125]: 晨會記錄
      - generic [ref=e126] [cursor=pointer]:
        - img [ref=e129]
        - generic [ref=e131]: 施工日報
      - generic [ref=e132] [cursor=pointer]:
        - img [ref=e135]
        - generic [ref=e137]: 查驗資料
      - generic [ref=e138] [cursor=pointer]:
        - img [ref=e141]
        - generic [ref=e143]: 缺失追蹤
      - generic [ref=e144] [cursor=pointer]:
        - img [ref=e147]
        - generic [ref=e149]: 材料驗收
      - generic [ref=e150] [cursor=pointer]:
        - img [ref=e153]
        - generic [ref=e155]: 工安巡檢
      - generic [ref=e156] [cursor=pointer]:
        - img [ref=e159]
        - generic [ref=e161]: 分包商
      - generic [ref=e162] [cursor=pointer]:
        - img [ref=e165]
        - generic [ref=e167]: 估驗請款
      - generic [ref=e168] [cursor=pointer]:
        - img [ref=e171]
        - generic [ref=e173]: 文件管理
      - generic [ref=e174] [cursor=pointer]:
        - img [ref=e177]
        - generic [ref=e179]: 系統設定
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('UIUX-201 Verification', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('http://localhost:4176');
  6   |     await page.waitForSelector('.sidebar', { timeout: 10000 });
  7   |   });
  8   | 
  9   |   test('docs.html has 6 filter buttons with data-action="filter-docs" and correct data-filter values', async ({ page }) => {
  10  |     await page.click('[data-action="navigate-view"][data-view="docs"]');
> 11  |     await page.waitForSelector('#v-docs', { state: 'visible' });
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  12  | 
  13  |     const expectedFilters = [
  14  |       { filter: 'all', label: '全部' },
  15  |       { filter: 'plan', label: '施工計畫書' },
  16  |       { filter: 'design', label: '設計圖說' },
  17  |       { filter: 'quality', label: '品管文件' },
  18  |       { filter: 'safety', label: '工安文件' },
  19  |       { filter: 'contract', label: '合約文件' }
  20  |     ];
  21  | 
  22  |     // Verify 6 filter buttons exist
  23  |     const filterButtons = await page.locator('#v-docs [data-action="filter-docs"]').count();
  24  |     expect(filterButtons).toBe(6);
  25  | 
  26  |     // Verify each filter button has correct data-filter value
  27  |     for (const expected of expectedFilters) {
  28  |       const button = page.locator(`#v-docs [data-action="filter-docs"][data-filter="${expected.filter}"]`);
  29  |       await expect(button).toBeVisible();
  30  |       const text = await button.textContent();
  31  |       expect(text).toContain(expected.label);
  32  |     }
  33  |   });
  34  | 
  35  |   test('docs filter active-state only affects #v-docs/#docs-tbl and does not touch IR filter state', async ({ page }) => {
  36  |     await page.click('[data-action="navigate-view"][data-view="docs"]');
  37  |     await page.waitForSelector('#v-docs', { state: 'visible' });
  38  | 
  39  |     await page.click('#v-docs [data-action="filter-docs"][data-filter="plan"]');
  40  | 
  41  |     const planButton = page.locator('#v-docs [data-action="filter-docs"][data-filter="plan"]');
  42  |     await expect(planButton).toHaveClass(/act/);
  43  | 
  44  |     const allButton = page.locator('#v-docs [data-action="filter-docs"][data-filter="all"]');
  45  |     await expect(allButton).not.toHaveClass(/act/);
  46  | 
  47  |     const visibleRows = await page.locator('#docs-tbl tbody tr:visible').count();
  48  |     const allRows = await page.locator('#docs-tbl tbody tr').count();
  49  |     expect(visibleRows).toBeLessThan(allRows);
  50  | 
  51  |     await page.click('[data-action="navigate-view"][data-view="ir"]');
  52  |     await page.waitForSelector('#v-ir', { state: 'visible' });
  53  | 
  54  |     const irAllButton = page.locator('#v-ir [data-action="filter-ir"][data-filter="all"]');
  55  |     await expect(irAllButton).toHaveClass(/act/);
  56  |   });
  57  | 
  58  |   test('IR page filter-ir remains isolated to #ir-tbl', async ({ page }) => {
  59  |     await page.click('[data-action="navigate-view"][data-view="ir"]');
  60  |     await page.waitForSelector('#v-ir', { state: 'visible' });
  61  | 
  62  |     await page.click('#v-ir [data-action="filter-ir"][data-filter="wait"]');
  63  | 
  64  |     const waitButton = page.locator('#v-ir [data-action="filter-ir"][data-filter="wait"]');
  65  |     await expect(waitButton).toHaveClass(/act/);
  66  | 
  67  |     const allButton = page.locator('#v-ir [data-action="filter-ir"][data-filter="all"]');
  68  |     await expect(allButton).not.toHaveClass(/act/);
  69  | 
  70  |     const visibleRows = await page.locator('#ir-tbl tbody tr:visible').count();
  71  |     const allRows = await page.locator('#ir-tbl tbody tr').count();
  72  |     expect(visibleRows).toBeLessThan(allRows);
  73  | 
  74  |     await page.click('[data-action="navigate-view"][data-view="docs"]');
  75  |     await page.waitForSelector('#v-docs', { state: 'visible' });
  76  | 
  77  |     const docsAllButton = page.locator('#v-docs [data-action="filter-docs"][data-filter="all"]');
  78  |     await expect(docsAllButton).toHaveClass(/act/);
  79  |   });
  80  | 
  81  |   test('main project contract "申請調閱" toast triggers with exact user-facing message', async ({ page }) => {
  82  |     await page.click('[data-action="navigate-view"][data-view="docs"]');
  83  |     await page.waitForSelector('#v-docs', { state: 'visible' });
  84  | 
  85  |     const requestButton = page.locator('#docs-tbl button:has-text("申請調閱")').first();
  86  |     await requestButton.click();
  87  | 
  88  |     const toast = page.locator('.toast');
  89  |     await expect(toast).toBeVisible();
  90  | 
  91  |     const toastText = await toast.textContent();
  92  |     expect(toastText).toBe('申請調閱申請已送出，請等待管理員審核');
  93  |   });
  94  | 
  95  |   test('v-morning "預覽 PDF" button exists and is clickable', async ({ page }) => {
  96  |     await page.click('[data-action="navigate-view"][data-view="morning"]');
  97  |     await page.waitForSelector('#v-morning', { state: 'visible' });
  98  | 
  99  |     const pdfButton = page.locator('#v-morning button:has-text("預覽 PDF")');
  100 |     await expect(pdfButton).toBeVisible();
  101 | 
  102 |     await pdfButton.click();
  103 | 
  104 |     const toast = page.locator('.toast');
  105 |     const toastExists = await toast.isVisible().catch(() => false);
  106 |     
  107 |     if (toastExists) {
  108 |       const toastText = await toast.textContent();
  109 |       console.log('Toast message:', toastText);
  110 |     } else {
  111 |       console.log('No toast triggered - button may not have data-action toast-msg');
```