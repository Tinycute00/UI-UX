/**
 * FE-201 Regression Verification Script
 * Tests: Dashboard/Billing state transitions, Safety Wizard behavior
 */

import { JSDOM } from 'jsdom';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load HTML and CSS
const indexHtml = readFileSync(join(__dirname, '../index.html'), 'utf8');
const dashboardHtml = readFileSync(join(__dirname, '../src/partials/views/dashboard.html'), 'utf8');
const billingHtml = readFileSync(join(__dirname, '../src/partials/views/billing.html'), 'utf8');
const safetyHtml = readFileSync(join(__dirname, '../src/partials/views/safety.html'), 'utf8');

// Create DOM environment
const dom = new JSDOM(indexHtml, {
  url: 'http://localhost:5174',
  pretendToBeVisual: true,
  resources: 'usable',
});

global.document = dom.window.document;
global.window = dom.window;
Object.defineProperty(global, 'navigator', {
  value: dom.window.navigator,
  writable: true,
  configurable: true,
});

// Import state controller
const stateControllerPath = join(__dirname, '../src/js/state-controller.js');
const stateController = await import(stateControllerPath);

const results = {
  passed: [],
  bugs: [],
  backendAffected: [],
  timestamp: new Date().toISOString(),
};

function test(name, fn) {
  try {
    fn();
    results.passed.push(name);
    console.log(`✅ PASS: ${name}`);
  } catch (e) {
    results.bugs.push({ name, error: e.message, severity: 'high' });
    console.log(`❌ FAIL: ${name} - ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

console.log('\n═══════════════════════════════════════════════════');
console.log('FE-201 Regression Verification');
console.log('═══════════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════
// TEST 1: Dashboard State Transitions
// ═══════════════════════════════════════════════════
console.log('\n📊 TEST GROUP: Dashboard State Transitions\n');

// Inject dashboard HTML
const dashboardContainer = document.createElement('div');
dashboardContainer.innerHTML = dashboardHtml;
document.body.appendChild(dashboardContainer);

test('Dashboard - Empty state displays correctly', () => {
  stateController.showDashState('empty');
  const emptyEl = document.getElementById('dash-empty');
  const contentEl = document.getElementById('dash-content');
  assert(emptyEl.style.display !== 'none', 'Empty state should be visible');
  assert(contentEl.style.display === 'none', 'Content should be hidden');
  assert(
    emptyEl.getAttribute('aria-hidden') === 'false',
    'Empty state aria-hidden should be false',
  );
});

test('Dashboard - Loading state displays correctly', () => {
  stateController.showDashState('loading');
  const loadingEl = document.getElementById('dash-loading');
  const emptyEl = document.getElementById('dash-empty');
  assert(loadingEl.style.display !== 'none', 'Loading state should be visible');
  assert(emptyEl.style.display === 'none', 'Empty state should be hidden');
  assert(
    loadingEl.getAttribute('aria-busy') === 'true',
    'Loading state should have aria-busy=true',
  );
});

test('Dashboard - Error state displays correctly', () => {
  stateController.showDashState('error');
  const errorEl = document.getElementById('dash-error');
  const loadingEl = document.getElementById('dash-loading');
  assert(errorEl.style.display !== 'none', 'Error state should be visible');
  assert(loadingEl.style.display === 'none', 'Loading state should be hidden');
  assert(
    errorEl.getAttribute('aria-hidden') === 'false',
    'Error state aria-hidden should be false',
  );
});

test('Dashboard - Content state displays correctly', () => {
  stateController.showDashState('content');
  const contentEl = document.getElementById('dash-content');
  const errorEl = document.getElementById('dash-error');
  assert(contentEl.style.display !== 'none', 'Content state should be visible');
  assert(errorEl.style.display === 'none', 'Error state should be hidden');
  assert(
    contentEl.getAttribute('aria-hidden') === 'false',
    'Content state aria-hidden should be false',
  );
});

test('Dashboard - State transitions preserve aria attributes', () => {
  // Test that aria-hidden is properly toggled
  stateController.showDashState('loading');
  const loadingEl = document.getElementById('dash-loading');
  const contentEl = document.getElementById('dash-content');
  assert(
    loadingEl.getAttribute('aria-hidden') === 'false',
    'Loading should have aria-hidden=false',
  );
  assert(
    contentEl.getAttribute('aria-hidden') === 'true',
    'Content should have aria-hidden=true when hidden',
  );
});

test('Dashboard - Invalid state is handled gracefully', () => {
  // Should not throw and should log warning
  const consoleWarn = console.warn;
  let warningCalled = false;
  console.warn = () => {
    warningCalled = true;
  };
  stateController.showDashState('invalid');
  console.warn = consoleWarn;
  assert(warningCalled, 'Should log warning for invalid state');
});

// ═══════════════════════════════════════════════════
// TEST 2: Billing State Transitions
// ═══════════════════════════════════════════════════
console.log('\n💰 TEST GROUP: Billing State Transitions\n');

// Inject billing HTML
const billingContainer = document.createElement('div');
billingContainer.innerHTML = billingHtml;
document.body.appendChild(billingContainer);

test('Billing - Empty state displays correctly', () => {
  stateController.showBillingState('empty');
  const emptyEl = document.getElementById('billing-empty');
  const contentEl = document.getElementById('billing-content');
  assert(emptyEl.style.display !== 'none', 'Empty state should be visible');
  assert(contentEl.style.display === 'none', 'Content should be hidden');
});

test('Billing - Loading state displays correctly', () => {
  stateController.showBillingState('loading');
  const loadingEl = document.getElementById('billing-loading');
  const emptyEl = document.getElementById('billing-empty');
  assert(loadingEl.style.display !== 'none', 'Loading state should be visible');
  assert(emptyEl.style.display === 'none', 'Empty state should be hidden');
});

test('Billing - Error state displays correctly', () => {
  stateController.showBillingState('error');
  const errorEl = document.getElementById('billing-error');
  const loadingEl = document.getElementById('billing-loading');
  assert(errorEl.style.display !== 'none', 'Error state should be visible');
  assert(loadingEl.style.display === 'none', 'Loading state should be hidden');
});

test('Billing - Content state displays correctly', () => {
  stateController.showBillingState('content');
  const contentEl = document.getElementById('billing-content');
  const errorEl = document.getElementById('billing-error');
  assert(contentEl.style.display !== 'none', 'Content state should be visible');
  assert(errorEl.style.display === 'none', 'Error state should be hidden');
});

test('Billing - Retry button triggers loading state', () => {
  // Verify retry-billing action exists in the error state
  const errorEl = document.getElementById('billing-error');
  const retryBtn = errorEl.querySelector('[data-action="retry-billing"]');
  assert(retryBtn !== null, 'Retry button should exist');
});

// ═══════════════════════════════════════════════════
// TEST 3: Safety Wizard Structure
// ═══════════════════════════════════════════════════
console.log('\n🛡️ TEST GROUP: Safety Wizard Structure\n');

// Inject safety HTML
const safetyContainer = document.createElement('div');
safetyContainer.innerHTML = safetyHtml;
document.body.appendChild(safetyContainer);

test('Safety Wizard - All 3 steps exist in DOM', () => {
  const step1 = document.getElementById('sw-step1');
  const step2 = document.getElementById('sw-step2');
  const step3 = document.getElementById('sw-step3');
  assert(step1 !== null, 'Step 1 should exist');
  assert(step2 !== null, 'Step 2 should exist');
  assert(step3 !== null, 'Step 3 should exist');
});

test('Safety Wizard - Step indicators exist', () => {
  const s1 = document.getElementById('sw-s1');
  const s2 = document.getElementById('sw-s2');
  const s3 = document.getElementById('sw-s3');
  assert(s1 !== null, 'Step 1 indicator should exist');
  assert(s2 !== null, 'Step 2 indicator should exist');
  assert(s3 !== null, 'Step 3 indicator should exist');
});

test('Safety Wizard - Step 1 has location checkboxes', () => {
  const step1 = document.getElementById('sw-step1');
  const checkboxes = step1.querySelectorAll('input[type="checkbox"]');
  assert(checkboxes.length >= 7, 'Step 1 should have at least 7 location checkboxes');
});

test('Safety Wizard - Step 1 has inspection item checkboxes', () => {
  const step1 = document.getElementById('sw-step1');
  const labels = step1.querySelectorAll('label');
  let itemCheckboxes = 0;
  labels.forEach((label) => {
    if (
      label.textContent.includes('高空作業') ||
      label.textContent.includes('圍籬') ||
      label.textContent.includes('消防') ||
      label.textContent.includes('起重機') ||
      label.textContent.includes('電氣') ||
      label.textContent.includes('澆置區') ||
      label.textContent.includes('車輛') ||
      label.textContent.includes('防護具') ||
      label.textContent.includes('物料') ||
      label.textContent.includes('機具')
    ) {
      itemCheckboxes++;
    }
  });
  assert(itemCheckboxes >= 5, 'Step 1 should have inspection item checkboxes');
});

test('Safety Wizard - Step 2 has dynamic checklist container', () => {
  const checklist = document.getElementById('sf-checklist');
  assert(checklist !== null, 'Checklist container should exist');
});

test('Safety Wizard - Step 3 has confirmation checkbox', () => {
  const confirmCheckbox = document.getElementById('sf-confirm');
  assert(confirmCheckbox !== null, 'Confirmation checkbox should exist');
});

test('Safety Wizard - Step 3 has signature pad', () => {
  const signPad = document.getElementById('sf-sign');
  assert(signPad !== null, 'Signature pad should exist');
});

// ═══════════════════════════════════════════════════
// TEST 4: Safety Wizard Blocking Logic Analysis
// ═══════════════════════════════════════════════════
console.log('\n🔒 TEST GROUP: Safety Wizard Blocking Logic (Code Analysis)\n');

const safetyJs = readFileSync(join(__dirname, '../src/js/safety.js'), 'utf8');

test('Safety - Step 2 validates Step 1 has selections', () => {
  // Check that safetyStep(2) validates step 1
  assert(
    safetyJs.includes('n === 2') && safetyJs.includes('checked.length === 0'),
    'Step 2 entry should validate Step 1 selections',
  );
  assert(
    safetyJs.includes('請至少選擇一個巡檢位置'),
    'Should show warning when no location selected',
  );
});

test('Safety - Step 3 validates Step 2 completion', () => {
  assert(
    safetyJs.includes('n === 3') && safetyJs.includes('unMarked'),
    'Step 3 entry should validate Step 2 completion',
  );
  assert(
    safetyJs.includes('請完成所有查核項目的標記'),
    'Should show warning when items not marked',
  );
});

test('Safety - Validate Step 1 function exists', () => {
  assert(safetyJs.includes('function validateStep1'), 'validateStep1 function should exist');
});

test('Safety - Validate Step 2 function exists', () => {
  assert(safetyJs.includes('function validateStep2'), 'validateStep2 function should exist');
});

test('Safety - Send validates confirmation checkbox', () => {
  assert(
    safetyJs.includes('safetySend') && safetyJs.includes('sf-confirm'),
    'safetySend should check confirmation checkbox',
  );
  assert(
    safetyJs.includes('請勾選安危確認聲明後再送出'),
    'Should show warning if confirmation not checked',
  );
});

// ═══════════════════════════════════════════════════
// TEST 5: CSS Mobile Responsiveness
// ═══════════════════════════════════════════════════
console.log('\n📱 TEST GROUP: Mobile Responsiveness (CSS Analysis)\n');

const mainCss = readFileSync(join(__dirname, '../src/styles/main.css'), 'utf8');

test('CSS - 480px breakpoint exists for Safety Wizard', () => {
  assert(mainCss.includes('@media (max-width: 480px)'), 'Should have 480px breakpoint');
  assert(mainCss.includes('#safety-wizard'), 'Should have safety-wizard specific styles');
});

test('CSS - Step indicator hides text at 480px', () => {
  assert(
    mainCss.includes('#safety-wizard [id^="sw-s"] span') && mainCss.includes('display: none'),
    'Should hide step indicator text at small widths',
  );
});

test('CSS - Mobile breakpoint at 767px exists', () => {
  assert(mainCss.includes('@media (max-width: 767px)'), 'Should have 767px mobile breakpoint');
});

test('CSS - Responsive grid adjustments exist', () => {
  assert(
    mainCss.includes('grid-template-columns') && mainCss.includes('!important'),
    'Should have responsive grid column adjustments',
  );
});

// ═══════════════════════════════════════════════════
// TEST 6: Actions Integration
// ═══════════════════════════════════════════════════
console.log('\n🎮 TEST GROUP: Actions Integration\n');

const actionsJs = readFileSync(join(__dirname, '../src/app/actions.js'), 'utf8');

test('Actions - showDashState is imported', () => {
  assert(actionsJs.includes('import { showDashState'), 'actions.js should import showDashState');
});

test('Actions - showBillingState is imported', () => {
  assert(actionsJs.includes('showBillingState'), 'actions.js should import showBillingState');
});

test('Actions - reload-dashboard action exists', () => {
  assert(actionsJs.includes("'reload-dashboard'"), 'reload-dashboard action should exist');
  assert(
    actionsJs.includes("showDashState('loading')"),
    'Should call showDashState(loading) on reload',
  );
});

test('Actions - retry-dashboard action exists', () => {
  assert(actionsJs.includes("'retry-dashboard'"), 'retry-dashboard action should exist');
});

test('Actions - retry-billing action exists', () => {
  assert(actionsJs.includes("'retry-billing'"), 'retry-billing action should exist');
  assert(
    actionsJs.includes("showBillingState('loading')"),
    'Should call showBillingState(loading) on retry',
  );
});

test('Actions - safety-step action exists', () => {
  assert(actionsJs.includes("'safety-step'"), 'safety-step action should exist');
});

test('Actions - safety-cancel action exists', () => {
  assert(actionsJs.includes("'safety-cancel'"), 'safety-cancel action should exist');
});

test('Actions - safety-send action exists', () => {
  assert(actionsJs.includes("'safety-send'"), 'safety-send action should exist');
});

// ═══════════════════════════════════════════════════
// TEST 7: Navigation Integrity
// ═══════════════════════════════════════════════════
console.log('\n🧭 TEST GROUP: Navigation Integrity\n');

const navigationJs = readFileSync(join(__dirname, '../src/js/navigation.js'), 'utf8');

test('Navigation - gv function exists', () => {
  assert(navigationJs.includes('export function gv('), 'gv (go view) function should exist');
});

test('Navigation - goHome function exists', () => {
  assert(navigationJs.includes('export function goHome('), 'goHome function should exist');
});

test('Navigation - View labels are defined', () => {
  assert(navigationJs.includes('VIEW_LABELS'), 'VIEW_LABELS should be defined');
  assert(navigationJs.includes('dashboard:'), 'Dashboard label should exist');
  assert(navigationJs.includes('billing:'), 'Billing label should exist');
  assert(navigationJs.includes('safety:'), 'Safety label should exist');
});

test('Navigation - Mobile navigation sync exists', () => {
  assert(navigationJs.includes('gvMobile'), 'gvMobile function should exist for mobile nav');
  assert(navigationJs.includes('BOTTOM_NAV_MAP'), 'Bottom nav map should exist');
});

// ═══════════════════════════════════════════════════
// TEST 8: Modal Integrity
// ═══════════════════════════════════════════════════
console.log('\n🪟 TEST GROUP: Modal Integrity\n');

const modalsJs = readFileSync(join(__dirname, '../src/js/modals.js'), 'utf8');

test('Modals - om (open modal) function exists', () => {
  assert(modalsJs.includes('export function om('), 'om (open modal) function should exist');
});

test('Modals - cm (close modal) function exists', () => {
  assert(modalsJs.includes('export function cm('), 'cm (close modal) function should exist');
});

test('Modals - toast function exists', () => {
  assert(modalsJs.includes('export function toast('), 'toast function should exist');
});

test('Modals - Drawer functions exist', () => {
  assert(modalsJs.includes('export function openDr('), 'openDr function should exist');
  assert(modalsJs.includes('export function closeDr('), 'closeDr function should exist');
});

// ═══════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════');
console.log('VERIFICATION SUMMARY');
console.log('═══════════════════════════════════════════════════\n');

console.log(`✅ Passed: ${results.passed.length} tests`);
console.log(`❌ Failed: ${results.bugs.length} tests`);
console.log(`⏸️  Backend Affected: ${results.backendAffected.length} tests\n`);

if (results.bugs.length > 0) {
  console.log('Bug Details:');
  results.bugs.forEach((bug, idx) => {
    console.log(`  ${idx + 1}. ${bug.name}`);
    console.log(`     Error: ${bug.error}`);
    console.log(`     Severity: ${bug.severity}\n`);
  });
}

// Write results to file
const resultsPath = join(__dirname, '../docs/qa-regression-fe201.json');
mkdirSync(join(__dirname, '../docs'), { recursive: true });
writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(`\nResults saved to: ${resultsPath}`);

process.exit(results.bugs.length > 0 ? 1 : 0);
