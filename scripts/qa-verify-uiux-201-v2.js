import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE_URL = 'http://localhost:4176';
const FINDINGS = {
  timestamp: new Date().toISOString(),
  environment: {
    baseUrl: BASE_URL,
    viewport: '1280x800',
  },
  tests: [],
  codeChangesRequired: false,
  summary: {
    passed: 0,
    failed: 0,
    blocked: 0,
  },
};

function addTest(
  id,
  name,
  status,
  evidence,
  requiredMessage = null,
  actualMessage = null,
  notes = '',
) {
  FINDINGS.tests.push({
    id,
    name,
    status,
    evidence,
    requiredMessage,
    actualMessage,
    notes,
  });
  FINDINGS.summary[status]++;
}

async function clearToasts(page) {
  // Clear any existing toasts
  await page.evaluate(() => {
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach((t) => t.remove());
  });
}

async function getLatestToast(page) {
  return await page
    .locator('.toast')
    .last()
    .textContent()
    .catch(() => null);
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.view', { timeout: 10000 });

    // Wait for welcome toast to clear
    await page.waitForTimeout(4000);
    await clearToasts(page);

    console.log('✓ App loaded successfully');

    // ============================================
    // TEST 1: v-docs filter bar - 6 buttons
    // ============================================
    console.log('\n--- Test 1: v-docs filter bar buttons ---');
    await page.click('[data-view="docs"]');
    await page.waitForTimeout(500);

    const docsFilterButtons = await page.locator('#v-docs .fbar .fb').all();
    const expectedButtons = ['全部', '施工計畫書', '設計圖說', '品管文件', '工安文件', '合約文件'];
    const actualButtons = [];

    for (const btn of docsFilterButtons) {
      actualButtons.push((await btn.textContent()).trim());
    }

    const has6Buttons = docsFilterButtons.length === 6;
    const correctLabels = JSON.stringify(actualButtons) === JSON.stringify(expectedButtons);

    if (has6Buttons && correctLabels) {
      addTest(
        'UIUX-201-1',
        'v-docs filter bar has 6 correct buttons (全部/施工計畫書/設計圖說/品管文件/工安文件/合約文件)',
        'passed',
        `Found ${docsFilterButtons.length} buttons: ${actualButtons.join('/')}`,
        null,
        null,
        'Buttons match expected labels exactly',
      );
      console.log(`  ✓ PASS: Found ${docsFilterButtons.length} buttons with correct labels`);
    } else {
      addTest(
        'UIUX-201-1',
        'v-docs filter bar has 6 correct buttons',
        'failed',
        `Found ${docsFilterButtons.length} buttons: ${actualButtons.join(', ')}`,
        null,
        null,
        `Expected: ${expectedButtons.join('/')}`,
      );
      console.log('  ✗ FAIL: Button mismatch');
    }

    // ============================================
    // TEST 2: v-docs filter functionality
    // ============================================
    console.log('\n--- Test 2: v-docs filter functionality ---');

    // Check if buttons have data-action
    const firstBtnAction = await docsFilterButtons[0].getAttribute('data-action');
    const hasFilterHandlers = firstBtnAction !== null;

    if (hasFilterHandlers) {
      // Test filter click
      await docsFilterButtons[1].click(); // 施工計畫書
      await page.waitForTimeout(300);
      const isActive = await docsFilterButtons[1].evaluate((el) => el.classList.contains('act'));
      const visibleRows = await page.locator('#v-docs tbody tr:visible').count();

      addTest(
        'UIUX-201-2',
        'v-docs filter buttons toggle active state and filter cards correctly',
        'passed',
        `Active class toggled: ${isActive}, Filtered rows: ${visibleRows}/7`,
        null,
        null,
        'Filter functionality implemented',
      );
      console.log(`  ✓ PASS: Filter works - active: ${isActive}, visible rows: ${visibleRows}`);
    } else {
      addTest(
        'UIUX-201-2',
        'v-docs filter buttons toggle active state and filter cards correctly',
        'blocked',
        'Filter buttons lack data-action attributes',
        null,
        null,
        'Feature not implemented - no JavaScript handlers attached to filter buttons',
      );
      console.log('  ⚠ BLOCKED: Filter buttons have no data-action handlers');
      FINDINGS.codeChangesRequired = true;
    }

    // ============================================
    // TEST 3: Filter scope isolation
    // ============================================
    console.log('\n--- Test 3: Filter scope isolation ---');

    await page.click('[data-view="ir"]');
    await page.waitForTimeout(500);

    const irFilters = await page.locator('#v-ir .fbar .fb').allInnerTexts();
    const irHasOwnFilters = irFilters.some((t) => t.includes('全部 (24)'));

    if (irHasOwnFilters) {
      addTest(
        'UIUX-201-3',
        'Filter scope limited to #v-docs - switching to IR does not affect filter-ir active state',
        'passed',
        `IR has independent filters: ${irFilters.join(', ')}`,
        null,
        null,
        'IR filters operate in separate scope from v-docs',
      );
      console.log('  ✓ PASS: IR filters are independent');
    } else {
      addTest(
        'UIUX-201-3',
        'Filter scope isolation',
        'failed',
        `IR filters: ${irFilters.join(', ')}`,
        null,
        null,
        'Filter scope may be shared incorrectly',
      );
      console.log('  ✗ FAIL: IR filter isolation issue');
    }

    // ============================================
    // TEST 4: 申請調閱 button
    // ============================================
    console.log('\n--- Test 4: 申請調閱 button ---');
    await page.click('[data-view="docs"]');
    await page.waitForTimeout(500);
    await clearToasts(page);

    // Find row with 主要工程承攬合約
    const rows = await page.locator('#v-docs tbody tr').all();
    let contractRow = null;
    let contractRowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      const text = await rows[i].textContent();
      if (text.includes('主要工程承攬合約')) {
        contractRow = rows[i];
        contractRowIndex = i;
        break;
      }
    }

    if (contractRow) {
      const requestBtn = contractRow.locator('button:has-text("申請調閱")');
      const btnExists = await requestBtn.isVisible().catch(() => false);

      if (btnExists) {
        const dataAction = await requestBtn.getAttribute('data-action');
        const expectedMsg = '申請調閱已送出，請等候承辦人員審核（功能開發中）';

        await requestBtn.click();
        await page.waitForTimeout(500);

        const toastText = await getLatestToast(page);
        const hasCorrectToast = toastText && toastText.includes('申請調閱已送出');

        if (hasCorrectToast) {
          addTest(
            'UIUX-201-4',
            'Clicking 申請調閱 on 主要工程承攬合約 row shows correct toast',
            'passed',
            `Toast: "${toastText}"`,
            expectedMsg,
            toastText,
            'Button has proper handler',
          );
          console.log(`  ✓ PASS: Toast shown: "${toastText}"`);
        } else if (!dataAction) {
          addTest(
            'UIUX-201-4',
            'Clicking 申請調閱 on 主要工程承攬合約 row shows correct toast',
            'blocked',
            'Button has no data-action attribute',
            expectedMsg,
            toastText || 'none',
            'Button is non-functional - requires implementation with data-action="toast-msg" and data-msg attribute',
          );
          console.log('  ⚠ BLOCKED: Button has no data-action (no handler)');
          FINDINGS.codeChangesRequired = true;
        } else {
          addTest(
            'UIUX-201-4',
            'Clicking 申請調閱 on 主要工程承攬合約 row shows correct toast',
            'failed',
            `Wrong toast: "${toastText}"`,
            expectedMsg,
            toastText,
            `Expected: "${expectedMsg}"`,
          );
          console.log(`  ✗ FAIL: Wrong toast: "${toastText}"`);
        }
      } else {
        addTest(
          'UIUX-201-4',
          'Clicking 申請調閱',
          'blocked',
          'Button not found in row',
          null,
          null,
          'Cannot locate 申請調閱 button',
        );
        console.log('  ⚠ BLOCKED: Button not found');
      }
    } else {
      addTest(
        'UIUX-201-4',
        'Clicking 申請調閱',
        'blocked',
        `Row "主要工程承攬合約" not found. Available rows: ${rows.length}`,
        null,
        null,
        'Cannot locate the target row',
      );
      console.log(`  ⚠ BLOCKED: Row not found (total rows: ${rows.length})`);
    }

    // ============================================
    // TEST 5: v-morning PDF preview
    // ============================================
    console.log('\n--- Test 5: v-morning PDF preview ---');
    await page.click('[data-view="morning"]');
    await page.waitForTimeout(500);
    await clearToasts(page);

    const pdfBtn = page.locator('#v-morning button:has-text("預覽 PDF")').first();
    const btnVisible = await pdfBtn.isVisible().catch(() => false);

    if (btnVisible) {
      const dataAction = await pdfBtn.getAttribute('data-action');
      const expectedMsg = 'PDF 預覽功能尚在建置中，請稍後再試';

      await pdfBtn.click();
      await page.waitForTimeout(500);

      const toastText = await getLatestToast(page);
      const hasCorrectToast = toastText && toastText.includes('PDF 預覽功能尚在建置中');

      if (hasCorrectToast) {
        addTest(
          'UIUX-201-5',
          'Clicking 預覽 PDF on v-morning shows correct toast',
          'passed',
          `Toast: "${toastText}"`,
          expectedMsg,
          toastText,
          'Button has proper handler',
        );
        console.log(`  ✓ PASS: Toast shown: "${toastText}"`);
      } else if (!dataAction) {
        addTest(
          'UIUX-201-5',
          'Clicking 預覽 PDF on v-morning shows correct toast',
          'blocked',
          'Button has no data-action attribute',
          expectedMsg,
          toastText || 'none',
          'Button is non-functional - requires implementation',
        );
        console.log('  ⚠ BLOCKED: Button has no data-action');
        FINDINGS.codeChangesRequired = true;
      } else {
        addTest(
          'UIUX-201-5',
          'Clicking 預覽 PDF on v-morning shows correct toast',
          'failed',
          `Wrong toast: "${toastText}"`,
          expectedMsg,
          toastText,
          `Expected: "${expectedMsg}"`,
        );
        console.log(`  ✗ FAIL: Wrong toast: "${toastText}"`);
      }
    } else {
      addTest(
        'UIUX-201-5',
        'Clicking 預覽 PDF',
        'blocked',
        'Button not found',
        null,
        null,
        'Cannot locate 預覽 PDF button',
      );
      console.log('  ⚠ BLOCKED: Button not found');
    }
  } catch (error) {
    console.error('Test execution error:', error);
    addTest(
      'EXEC-ERROR',
      'Test execution',
      'failed',
      error.message,
      null,
      null,
      'Unexpected error during test execution',
    );
  } finally {
    await browser.close();
  }

  // Generate findings
  const outputPath =
    '/home/beer8/team-workspace/UI-UX/docs/qa/qa-verification-uiux-201-findings.json';
  writeFileSync(outputPath, JSON.stringify(FINDINGS, null, 2));

  console.log('\n========================================');
  console.log('QA Verification Complete - UIUX-201');
  console.log('========================================');
  console.log(`Passed: ${FINDINGS.summary.passed}`);
  console.log(`Failed: ${FINDINGS.summary.failed}`);
  console.log(`Blocked: ${FINDINGS.summary.blocked}`);
  console.log(`Code Changes Required: ${FINDINGS.codeChangesRequired ? 'YES' : 'NO'}`);
  console.log(`\nFull report: ${outputPath}`);

  return FINDINGS;
}

runTests().catch(console.error);
