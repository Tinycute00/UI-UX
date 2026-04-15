const { chromium } = require('playwright');

(async () => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      url: 'http://localhost:4173',
      port: 4173,
    },
    tests: [],
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // Navigate to dashboard
    await page.goto('http://localhost:4173');
    await page.waitForLoadState('networkidle');

    // Test 1: Verify window.showDashState exists
    const showDashStateExists = await page.evaluate(
      () => typeof window.showDashState === 'function',
    );
    results.tests.push({
      id: 'W1-001',
      name: 'window.showDashState exists',
      status: showDashStateExists ? 'PASS' : 'FAIL',
      details: showDashStateExists
        ? 'Function is exposed on window object'
        : 'Function NOT found on window object',
    });

    // Test 2: Dashboard Empty State
    await page.evaluate(() => window.showDashState('empty'));
    await page.waitForTimeout(500);
    const dashEmpty = await page.locator('#dash-empty').isVisible();
    const emptyText = await page.locator('#dash-empty .state-title').textContent();
    const emptyIcon = await page.locator('#dash-empty .state-icon').textContent();
    const emptyDesc = await page.locator('#dash-empty .state-desc').textContent();
    const reloadBtn = await page
      .locator('#dash-empty button[data-action="reload-dashboard"]')
      .count();

    results.tests.push({
      id: 'W1-001',
      name: 'Dashboard Empty State',
      status: dashEmpty && emptyText.includes('尚無工程資料') ? 'PASS' : 'FAIL',
      details: {
        visible: dashEmpty,
        title: emptyText?.trim(),
        icon: emptyIcon?.trim(),
        description: emptyDesc?.trim(),
        reloadButton: reloadBtn > 0,
      },
    });

    // Test 3: Dashboard Loading State
    await page.evaluate(() => window.showDashState('loading'));
    await page.waitForTimeout(500);
    const dashLoading = await page.locator('#dash-loading').isVisible();
    const kpiSkeletons = await page.locator('#dash-loading .kpi-skel').count();
    const cardSkeletons = await page.locator('#dash-loading .skel-card').count();
    const ariaBusy = await page.locator('#dash-loading').getAttribute('aria-busy');

    results.tests.push({
      id: 'W1-002',
      name: 'Dashboard Loading State',
      status: dashLoading && kpiSkeletons === 5 && cardSkeletons === 2 ? 'PASS' : 'FAIL',
      details: {
        visible: dashLoading,
        kpiSkeletons: kpiSkeletons,
        cardSkeletons: cardSkeletons,
        ariaBusy: ariaBusy,
      },
    });

    // Test 4: Dashboard Error State
    await page.evaluate(() => window.showDashState('error'));
    await page.waitForTimeout(500);
    const dashError = await page.locator('#dash-error').isVisible();
    const errorText = await page.locator('#dash-error .state-title').textContent();
    const errorMsg = await page.locator('#dash-error-msg').textContent();
    const retryBtn = await page
      .locator('#dash-error button[data-action="retry-dashboard"]')
      .count();

    results.tests.push({
      id: 'W1-003',
      name: 'Dashboard Error State',
      status: dashError && errorText.includes('資料載入失敗') ? 'PASS' : 'FAIL',
      details: {
        visible: dashError,
        title: errorText?.trim(),
        message: errorMsg?.trim(),
        retryButton: retryBtn > 0,
      },
    });

    // Navigate to v-morning page
    await page.click('[data-action="dashboard-nav"][data-view="morning"]');
    await page.waitForTimeout(500);

    // Test 5: PDF Preview Button
    const pdfButton = await page.locator('button:has-text("預覽 PDF")');
    const pdfBtnVisible = await pdfButton.isVisible();
    const pdfBtnDataAction = await pdfButton.getAttribute('data-action');
    const pdfBtnDataMsg = await pdfButton.getAttribute('data-msg');

    // Click PDF button and check for toast
    await pdfButton.click();
    await page.waitForTimeout(500);

    // Look for toast message
    const toastVisible = await page
      .locator('.toast:has-text("PDF 預覽功能")')
      .isVisible()
      .catch(() => false);
    const toastText = await page
      .locator('.toast')
      .textContent()
      .catch(() => '');

    results.tests.push({
      id: 'UIUX-201',
      name: 'v-morning PDF Preview Toast',
      status:
        pdfBtnVisible && pdfBtnDataMsg === 'PDF 預覽功能尚在建置中，請稍後再試' ? 'PASS' : 'FAIL',
      details: {
        buttonVisible: pdfBtnVisible,
        dataAction: pdfBtnDataAction,
        dataMsg: pdfBtnDataMsg,
        toastVisible: toastVisible,
        toastText: toastText?.trim(),
      },
    });
  } catch (error) {
    results.error = error.message;
  }

  await browser.close();

  console.log(JSON.stringify(results, null, 2));
})();
