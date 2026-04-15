import { test, expect } from '@playwright/test';

test.describe('UIUX-201 Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4176');
    await page.waitForSelector('.sidebar', { timeout: 10000 });
  });

  test('docs.html has 6 filter buttons with data-action="filter-docs" and correct data-filter values', async ({
    page,
  }) => {
    await page.click('[data-action="navigate-view"][data-view="docs"]');
    await page.waitForSelector('#v-docs', { state: 'visible' });

    const expectedFilters = [
      { filter: 'all', label: '全部' },
      { filter: 'plan', label: '施工計畫書' },
      { filter: 'design', label: '設計圖說' },
      { filter: 'quality', label: '品管文件' },
      { filter: 'safety', label: '工安文件' },
      { filter: 'contract', label: '合約文件' },
    ];

    // Verify 6 filter buttons exist
    const filterButtons = await page.locator('#v-docs [data-action="filter-docs"]').count();
    expect(filterButtons).toBe(6);

    // Verify each filter button has correct data-filter value
    for (const expected of expectedFilters) {
      const button = page.locator(
        `#v-docs [data-action="filter-docs"][data-filter="${expected.filter}"]`,
      );
      await expect(button).toBeVisible();
      const text = await button.textContent();
      expect(text).toContain(expected.label);
    }
  });

  test('docs filter active-state only affects #v-docs/#docs-tbl and does not touch IR filter state', async ({
    page,
  }) => {
    await page.click('[data-action="navigate-view"][data-view="docs"]');
    await page.waitForSelector('#v-docs', { state: 'visible' });

    await page.click('#v-docs [data-action="filter-docs"][data-filter="plan"]');

    const planButton = page.locator('#v-docs [data-action="filter-docs"][data-filter="plan"]');
    await expect(planButton).toHaveClass(/act/);

    const allButton = page.locator('#v-docs [data-action="filter-docs"][data-filter="all"]');
    await expect(allButton).not.toHaveClass(/act/);

    const visibleRows = await page.locator('#docs-tbl tbody tr:visible').count();
    const allRows = await page.locator('#docs-tbl tbody tr').count();
    expect(visibleRows).toBeLessThan(allRows);

    await page.click('[data-action="navigate-view"][data-view="ir"]');
    await page.waitForSelector('#v-ir', { state: 'visible' });

    const irAllButton = page.locator('#v-ir [data-action="filter-ir"][data-filter="all"]');
    await expect(irAllButton).toHaveClass(/act/);
  });

  test('IR page filter-ir remains isolated to #ir-tbl', async ({ page }) => {
    await page.click('[data-action="navigate-view"][data-view="ir"]');
    await page.waitForSelector('#v-ir', { state: 'visible' });

    await page.click('#v-ir [data-action="filter-ir"][data-filter="wait"]');

    const waitButton = page.locator('#v-ir [data-action="filter-ir"][data-filter="wait"]');
    await expect(waitButton).toHaveClass(/act/);

    const allButton = page.locator('#v-ir [data-action="filter-ir"][data-filter="all"]');
    await expect(allButton).not.toHaveClass(/act/);

    const visibleRows = await page.locator('#ir-tbl tbody tr:visible').count();
    const allRows = await page.locator('#ir-tbl tbody tr').count();
    expect(visibleRows).toBeLessThan(allRows);

    await page.click('[data-action="navigate-view"][data-view="docs"]');
    await page.waitForSelector('#v-docs', { state: 'visible' });

    const docsAllButton = page.locator('#v-docs [data-action="filter-docs"][data-filter="all"]');
    await expect(docsAllButton).toHaveClass(/act/);
  });

  test('main project contract "申請調閱" toast triggers with exact user-facing message', async ({
    page,
  }) => {
    await page.click('[data-action="navigate-view"][data-view="docs"]');
    await page.waitForSelector('#v-docs', { state: 'visible' });

    const requestButton = page.locator('#docs-tbl button:has-text("申請調閱")').first();
    await requestButton.click();

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();

    const toastText = await toast.textContent();
    expect(toastText).toBe('申請調閱申請已送出，請等待管理員審核');
  });

  test('v-morning "預覽 PDF" button exists and is clickable', async ({ page }) => {
    await page.click('[data-action="navigate-view"][data-view="morning"]');
    await page.waitForSelector('#v-morning', { state: 'visible' });

    const pdfButton = page.locator('#v-morning button:has-text("預覽 PDF")');
    await expect(pdfButton).toBeVisible();

    await pdfButton.click();

    const toast = page.locator('.toast');
    const toastExists = await toast.isVisible().catch(() => false);

    if (toastExists) {
      const toastText = await toast.textContent();
      console.log('Toast message:', toastText);
    } else {
      console.log('No toast triggered - button may not have data-action toast-msg');
    }
  });
});
