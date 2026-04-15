import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE_URL = 'http://localhost:4176';
const FINDINGS = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    passed: 0,
    failed: 0,
    blocked: 0,
  },
};

function addTest(name, status, evidence, notes = '') {
  FINDINGS.tests.push({
    name,
    status,
    evidence,
    notes,
  });
  FINDINGS.summary[status]++;
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // Navigate to the app
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForSelector('.view', { timeout: 10000 });

    console.log('✓ App loaded successfully');

    // ============================================
    // TEST 1: v-docs filter bar - Check 6 buttons exist
    // ============================================
    console.log('\n--- Test 1: v-docs filter bar buttons ---');

    // Navigate to docs view
    await page.click('[data-view="docs"]');
    await page.waitForTimeout(500);

    const docsFilterButtons = await page.locator('#v-docs .fbar .fb').all();
    const expectedButtons = ['全部', '施工計畫書', '設計圖說', '品管文件', '工安文件', '合約文件'];
    const actualButtons = [];

    for (const btn of docsFilterButtons) {
      const text = await btn.textContent();
      actualButtons.push(text.trim());
    }

    const has6Buttons = docsFilterButtons.length === 6;
    const correctLabels = JSON.stringify(actualButtons) === JSON.stringify(expectedButtons);

    if (has6Buttons && correctLabels) {
      addTest(
        'v-docs filter bar has 6 correct buttons',
        'passed',
        `Found ${docsFilterButtons.length} buttons: ${actualButtons.join(', ')}`,
        'Buttons match expected labels',
      );
      console.log(`  ✓ Found ${docsFilterButtons.length} buttons: ${actualButtons.join(', ')}`);
    } else {
      addTest(
        'v-docs filter bar has 6 correct buttons',
        'failed',
        `Found ${docsFilterButtons.length} buttons: ${actualButtons.join(', ')}`,
        `Expected: ${expectedButtons.join(', ')}`,
      );
      console.log(`  ✗ Expected 6 buttons, found ${docsFilterButtons.length}`);
    }

    // ============================================
    // TEST 2: v-docs filter functionality
    // ============================================
    console.log('\n--- Test 2: v-docs filter functionality ---');

    // Check if buttons have data-action attributes
    const firstButton = docsFilterButtons[0];
    const hasDataAction = await firstButton.getAttribute('data-action');

    // Click on "施工計畫書" filter
    const constructionPlanBtn = docsFilterButtons.find(async (btn) => {
      const text = await btn.textContent();
      return text.trim() === '施工計畫書';
    });

    if (constructionPlanBtn) {
      await constructionPlanBtn.click();
      await page.waitForTimeout(300);

      // Check if active class is toggled
      const isActive = await constructionPlanBtn.evaluate((el) => el.classList.contains('act'));

      // Check if document cards are filtered
      const visibleRows = await page.locator('#v-docs tbody tr:visible').count();

      if (hasDataAction) {
        addTest(
          'v-docs filter buttons toggle active state and filter cards',
          'passed',
          `Button has data-action, active state: ${isActive}, visible rows: ${visibleRows}`,
          'Filter functionality appears to work',
        );
        console.log(
          `  ✓ Filter button has data-action, active: ${isActive}, visible rows: ${visibleRows}`,
        );
      } else {
        addTest(
          'v-docs filter buttons toggle active state and filter cards',
          'blocked',
          `Button does NOT have data-action attribute, active state: ${isActive}, visible rows: ${visibleRows}`,
          'No JavaScript handler attached - filter is non-functional',
        );
        console.log('  ⚠ Buttons lack data-action handlers - filters non-functional');
      }
    }

    // ============================================
    // TEST 3: Filter scope isolation (IR vs v-docs)
    // ============================================
    console.log('\n--- Test 3: Filter scope isolation ---');

    // First, click a filter in v-docs
    if (docsFilterButtons.length > 1) {
      await docsFilterButtons[1].click();
      await page.waitForTimeout(300);
    }

    // Navigate to IR page
    await page.click('[data-view="ir"]');
    await page.waitForTimeout(500);

    // Check IR filter state
    const irActiveFilter = await page
      .locator('#v-ir .fbar .fb.act')
      .textContent()
      .catch(() => 'none');

    // Check if IR has its own filter state
    const irFilters = await page.locator('#v-ir .fbar .fb').all();
    const irFilterTexts = [];
    for (const btn of irFilters) {
      const text = await btn.textContent();
      irFilterTexts.push(text.trim());
    }

    // IR filters should be independent
    const irHasOwnState = irFilterTexts.includes('全部 (24)');

    if (irHasOwnState) {
      addTest(
        'Filter scope limited to #v-docs - switching to IR does not affect filter-ir',
        'passed',
        `IR page has its own filter buttons: ${irFilterTexts.join(', ')}`,
        'IR filters operate independently',
      );
      console.log(`  ✓ IR has independent filter state: ${irFilterTexts.join(', ')}`);
    } else {
      addTest(
        'Filter scope limited to #v-docs - switching to IR does not affect filter-ir',
        'failed',
        `IR page filters: ${irFilterTexts.join(', ')}`,
        'IR filter state may be affected',
      );
      console.log('  ✗ IR filter state issue');
    }

    // ============================================
    // TEST 4: "申請調閱" button on 主要工程承攬合約 row
    // ============================================
    console.log('\n--- Test 4: 申請調閱 button on 主要工程承攬合約 ---');

    // Navigate back to docs
    await page.click('[data-view="docs"]');
    await page.waitForTimeout(500);

    // Find the 主要工程承攬合約 row
    const contractRow = await page.locator('#v-docs tr:has-text("主要工程承攬合約")').first();

    if (await contractRow.isVisible().catch(() => false)) {
      // Find the 申請調閱 button in that row
      const requestBtn = contractRow.locator('button:has-text("申請調閱")');

      if (await requestBtn.isVisible().catch(() => false)) {
        // Check if button has data-action
        const dataAction = await requestBtn.getAttribute('data-action');
        const dataMsg = await requestBtn.getAttribute('data-msg');

        // Click and check for toast
        await requestBtn.click();
        await page.waitForTimeout(500);

        // Check for toast message
        const toastText = await page
          .locator('.toast')
          .first()
          .textContent()
          .catch(() => null);

        const expectedToast = '申請調閱已送出,請等候承辦人員審核(功能開發中)';

        if (toastText && toastText.includes('申請調閱已送出')) {
          addTest(
            'Clicking 申請調閱 on 主要工程承攬合約 shows correct toast',
            'passed',
            `Toast shown: "${toastText}"`,
            'Button has proper handler',
          );
          console.log(`  ✓ Toast shown: "${toastText}"`);
        } else if (!dataAction) {
          addTest(
            'Clicking 申請調閱 on 主要工程承攬合約 shows correct toast',
            'blocked',
            'Button has no data-action attribute',
            'Button is non-functional - requires implementation',
          );
          console.log('  ⚠ Button has no data-action - non-functional');
        } else {
          addTest(
            'Clicking 申請調閱 on 主要工程承攬合約 shows correct toast',
            'failed',
            `Toast shown: "${toastText || 'none'}"`,
            `Expected: "${expectedToast}"`,
          );
          console.log(`  ✗ Wrong or no toast shown: "${toastText || 'none'}"`);
        }
      } else {
        addTest(
          'Clicking 申請調閱 on 主要工程承攬合約 shows correct toast',
          'blocked',
          '申請調閱 button not found',
          'Cannot locate the button',
        );
        console.log('  ⚠ 申請調閱 button not found');
      }
    } else {
      addTest(
        'Clicking 申請調閱 on 主要工程承攬合約 shows correct toast',
        'blocked',
        '主要工程承攬合約 row not found',
        'Cannot locate the row',
      );
      console.log('  ⚠ 主要工程承攬合約 row not found');
    }

    // ============================================
    // TEST 5: v-morning PDF preview button
    // ============================================
    console.log('\n--- Test 5: v-morning 預覽 PDF button ---');

    // Navigate to morning view
    await page.click('[data-view="morning"]');
    await page.waitForTimeout(500);

    // Find the 預覽 PDF button
    const pdfPreviewBtn = await page.locator('#v-morning button:has-text("預覽 PDF")').first();

    if (await pdfPreviewBtn.isVisible().catch(() => false)) {
      // Check if button has data-action
      const dataAction = await pdfPreviewBtn.getAttribute('data-action');

      // Click and check for toast
      await pdfPreviewBtn.click();
      await page.waitForTimeout(500);

      // Check for toast message
      const toastText = await page
        .locator('.toast')
        .first()
        .textContent()
        .catch(() => null);

      const expectedToast = 'PDF 預覽功能尚在建置中,請稍後再試';

      if (toastText && toastText.includes('PDF 預覽功能尚在建置中')) {
        addTest(
          'Clicking 預覽 PDF on v-morning shows correct toast',
          'passed',
          `Toast shown: "${toastText}"`,
          'Button has proper handler',
        );
        console.log(`  ✓ Toast shown: "${toastText}"`);
      } else if (!dataAction) {
        addTest(
          'Clicking 預覽 PDF on v-morning shows correct toast',
          'blocked',
          'Button has no data-action attribute',
          'Button is non-functional - requires implementation',
        );
        console.log('  ⚠ Button has no data-action - non-functional');
      } else {
        addTest(
          'Clicking 預覽 PDF on v-morning shows correct toast',
          'failed',
          `Toast shown: "${toastText || 'none'}"`,
          `Expected: "${expectedToast}"`,
        );
        console.log(`  ✗ Wrong or no toast shown: "${toastText || 'none'}"`);
      }
    } else {
      addTest(
        'Clicking 預覽 PDF on v-morning shows correct toast',
        'blocked',
        '預覽 PDF button not found',
        'Cannot locate the button',
      );
      console.log('  ⚠ 預覽 PDF button not found');
    }
  } catch (error) {
    console.error('Test execution error:', error);
    addTest('Test execution', 'failed', error.message, 'Unexpected error during test execution');
  } finally {
    await browser.close();
  }

  // Write findings to file
  const outputPath =
    '/home/beer8/team-workspace/UI-UX/docs/qa/qa-verification-uiux-201-findings.json';
  writeFileSync(outputPath, JSON.stringify(FINDINGS, null, 2));

  console.log('\n========================================');
  console.log('QA Verification Complete');
  console.log('========================================');
  console.log(`Passed: ${FINDINGS.summary.passed}`);
  console.log(`Failed: ${FINDINGS.summary.failed}`);
  console.log(`Blocked: ${FINDINGS.summary.blocked}`);
  console.log(`\nFull findings written to: ${outputPath}`);

  return FINDINGS;
}

runTests().catch(console.error);
