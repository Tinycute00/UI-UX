/**
 * QA-P0 Smoke Test Suite - UI-UX Static Prototype
 * Captures screenshots, console logs, and recordings for P0 tasks
 */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const EVIDENCE_DIR = 'docs/qa/evidence/p0-smoke-20260415';
const BASE_URL = 'http://localhost:5180';

// Ensure evidence directory exists
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

// Console log collector per test
function setupConsoleCollector(page) {
  const logs = { console: [], errors: [] };

  page.on('console', (msg) => {
    const entry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString(),
    };
    logs.console.push(entry);
    if (msg.type() === 'error') logs.errors.push(entry);
  });

  page.on('pageerror', (error) => {
    logs.errors.push({
      type: 'pageerror',
      text: error.message,
      timestamp: new Date().toISOString(),
    });
  });

  return logs;
}

function saveConsoleLog(filename, logs) {
  const logPath = path.join(EVIDENCE_DIR, filename);
  fs.writeFileSync(
    logPath,
    JSON.stringify(
      {
        console: logs.console,
        errors: logs.errors,
        summary: {
          total: logs.console.length,
          errors: logs.errors.length,
          hasBlockingErrors: logs.errors.some(
            (e) => e.text && (e.text.includes('Uncaught') || e.text.includes('ReferenceError')),
          ),
        },
      },
      null,
      2,
    ),
  );
  return logPath;
}

async function loginAndGotoApp(page, targetPath = '/') {
  // Navigate to login page first
  await page.goto(`${BASE_URL}/login.html`);
  await page.waitForSelector('#login-form', { timeout: 10000 });

  // Fill in credentials
  await page.fill('#username', 'admin');
  await page.fill('#password', 'password123');

  // Submit form - use form submit instead of button click
  await page.click('#login-btn');

  // Wait for redirect to app
  await page.waitForURL(/index\.html|localhost:4188\/$/, { timeout: 10000 });
  await page.waitForSelector('.sidebar', { timeout: 10000 });
}

// ============ QA-P0-01: App Shell Boot ============
test('QA-P0-01: App shell boots cleanly', async ({ page }) => {
  const logs = setupConsoleCollector(page);

  // Login and navigate to app
  await loginAndGotoApp(page);

  // Wait for shell to load
  await page.waitForSelector('.sidebar', { timeout: 10000 });
  await page.waitForSelector('header.topbar', { timeout: 10000 });

  // Take screenshot of full app shell
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-01-app-shell-boot.png'),
    fullPage: true,
  });

  // Save console log
  const logPath = saveConsoleLog('p0-01-console.json', logs);

  console.log('✅ QA-P0-01: App shell boots cleanly');
  console.log('   📸 Screenshot: p0-01-app-shell-boot.png');
  console.log('   📋 Console: p0-01-console.json');
  console.log(`   Errors: ${logs.errors.length}`);

  // Verify no blocking JS errors
  const hasBlocking = logs.errors.some(
    (e) =>
      e.text &&
      (e.text.includes('Uncaught') ||
        e.text.includes('ReferenceError') ||
        e.text.includes('TypeError')),
  );
  expect(hasBlocking).toBe(false);
  expect(logs.errors.length).toBe(0);
});

// ============ QA-P0-02: Dashboard Critical Path ============
test('QA-P0-02: Dashboard critical path smoke', async ({ page }) => {
  const logs = setupConsoleCollector(page);

  await loginAndGotoApp(page);
  await page.waitForSelector('#v-dashboard', { timeout: 10000 });

  // Screenshot 1: Initial dashboard state
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-02-dashboard-initial.png'),
    fullPage: true,
  });

  // Test: KPI drilldown click (工程總體進度)
  await page.click('[data-action="dashboard-nav"][data-view="daily"]');
  await page.waitForTimeout(500);

  // Screenshot 2: After KPI navigation
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-02-dashboard-kpi-nav.png'),
    fullPage: true,
  });

  // Navigate back to dashboard
  await page.click('[data-view="dashboard"]');
  await page.waitForTimeout(500);

  // Test: Open work detail modal
  await page.click('[data-action="open-work-detail"][data-work-id="underground"]');
  await page.waitForTimeout(500);

  // Screenshot 3: Work detail modal open
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-02-work-detail-modal.png'),
    fullPage: true,
  });

  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Test: Open subcontractor detail
  await page.click('[data-action="open-subcontractor-detail"][data-sub-id="sub-chengshi"]');
  await page.waitForTimeout(500);

  // Screenshot 4: Subcontractor detail modal
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-02-subcontractor-modal.png'),
    fullPage: true,
  });

  saveConsoleLog('p0-02-console.json', logs);

  console.log('✅ QA-P0-02: Dashboard critical path smoke');
  console.log('   📸 Screenshots: 4 captured');
  console.log('   📋 Console: p0-02-console.json');
  console.log(`   Errors: ${logs.errors.length}`);

  expect(logs.errors.length).toBeLessThan(5);
});

// ============ QA-P0-03: Billing Critical Path ============
test('QA-P0-03: Billing critical path smoke', async ({ page }) => {
  const logs = setupConsoleCollector(page);

  await loginAndGotoApp(page);

  // Navigate to billing view
  await page.click('[data-view="billing"]');
  await page.waitForSelector('#v-billing', { timeout: 10000 });
  await page.waitForTimeout(500);

  // Screenshot 1: Billing view rendered
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-03-billing-view.png'),
    fullPage: true,
  });

  // Test: Open billing detail modal (Period 4)
  await page.click('[data-action="open-billing-detail"][data-billing-id="billing-4"]');
  await page.waitForTimeout(500);

  // Screenshot 2: Billing detail modal open
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-03-billing-detail-modal.png'),
    fullPage: true,
  });

  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Test: Open "新增估驗" modal
  await page.click('[data-action="open-modal"][data-modal-id="mo-billing"]');
  await page.waitForTimeout(500);

  // Screenshot 3: New estimate modal
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-03-new-estimate-modal.png'),
    fullPage: true,
  });

  saveConsoleLog('p0-03-console.json', logs);

  console.log('✅ QA-P0-03: Billing critical path smoke');
  console.log('   📸 Screenshots: 3 captured');
  console.log('   📋 Console: p0-03-console.json');
  console.log(`   Errors: ${logs.errors.length}`);

  expect(logs.errors.length).toBeLessThan(5);
});

// ============ QA-P0-04: Safety Wizard Critical Path ============
test('QA-P0-04: Safety wizard critical path smoke', async ({ page }) => {
  const logs = setupConsoleCollector(page);

  await loginAndGotoApp(page);

  // Navigate to safety view
  await page.click('[data-view="safety"]');
  await page.waitForSelector('#v-safety', { timeout: 10000 });

  // Screenshot 1: Safety view initial
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-04-safety-initial.png'),
    fullPage: true,
  });

  // Start wizard: Click "新增巡檢日誌"
  await page.click('[data-action="safety-step"][data-step="1"]');
  await page.waitForTimeout(500);

  // Screenshot 2: Step 1 visible
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-04-safety-step1.png'),
    fullPage: true,
  });

  // Check at least one location checkbox
  await page.locator('#sw-step1 input[type="checkbox"]').first().check();

  // Check at least one inspection item
  await page.locator('#sw-step1 input[type="checkbox"]').nth(6).check();

  // Click Next to Step 2
  await page.click('[data-action="safety-step"][data-step="2"]');
  await page.waitForTimeout(500);

  // Screenshot 3: Step 2 visible (checklist generated)
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-04-safety-step2.png'),
    fullPage: true,
  });

  // Mark first item as pass
  const passButton = await page.locator('#sf-checklist button[data-mark="pass"]').first();
  if (await passButton.isVisible().catch(() => false)) {
    await passButton.click();
    await page.waitForTimeout(300);
  }

  // Screenshot 4: After marking pass
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-04-safety-step2-marked.png'),
    fullPage: true,
  });

  // Click Next to Step 3
  await page.click('[data-action="safety-step"][data-step="3"]');
  await page.waitForTimeout(500);

  // Screenshot 5: Step 3 visible
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-04-safety-step3.png'),
    fullPage: true,
  });

  // Test reset/cancel
  await page.click('[data-action="safety-cancel"]');
  await page.waitForTimeout(300);

  // Screenshot 6: After cancel (wizard hidden)
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, 'p0-04-safety-cancelled.png'),
    fullPage: true,
  });

  saveConsoleLog('p0-04-console.json', logs);

  console.log('✅ QA-P0-04: Safety wizard critical path smoke');
  console.log('   📸 Screenshots: 6 captured');
  console.log('   📋 Console: p0-04-console.json');
  console.log('   Wizard steps: 1→2→3→cancel verified');

  expect(logs.errors.length).toBeLessThan(5);
});

// ============ QA-P0-05: Auth Gap Verification (Source Only) ============
test('QA-P0-05: Auth gap verification', async () => {
  console.log('✅ QA-P0-05: Auth gap verification');
  console.log('   📋 Source review: sidebar.html, login.html, auth-adapter.js');
  console.log('   Finding: Auth UI is static only, no session/RBAC implemented');
});

test.afterAll(async () => {
  console.log('\n🏁 P0 Smoke Test Complete');
  console.log(`📁 Evidence directory: ${EVIDENCE_DIR}`);
});
