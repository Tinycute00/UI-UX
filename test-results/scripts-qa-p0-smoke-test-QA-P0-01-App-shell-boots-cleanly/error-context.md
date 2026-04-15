# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scripts/qa-p0-smoke-test.spec.js >> QA-P0-01: App shell boots cleanly
- Location: scripts/qa-p0-smoke-test.spec.js:77:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 3
```

# Test source

```ts
  6   | import { test, expect } from '@playwright/test';
  7   | import fs from 'fs';
  8   | import path from 'path';
  9   | 
  10  | const EVIDENCE_DIR = 'docs/qa/evidence/p0-smoke-20260415';
  11  | const BASE_URL = 'http://localhost:5180';
  12  | 
  13  | // Ensure evidence directory exists
  14  | if (!fs.existsSync(EVIDENCE_DIR)) {
  15  |   fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  16  | }
  17  | 
  18  | // Console log collector per test
  19  | function setupConsoleCollector(page) {
  20  |   const logs = { console: [], errors: [] };
  21  |   
  22  |   page.on('console', msg => {
  23  |     const entry = {
  24  |       type: msg.type(),
  25  |       text: msg.text(),
  26  |       timestamp: new Date().toISOString()
  27  |     };
  28  |     logs.console.push(entry);
  29  |     if (msg.type() === 'error') logs.errors.push(entry);
  30  |   });
  31  |   
  32  |   page.on('pageerror', error => {
  33  |     logs.errors.push({
  34  |       type: 'pageerror',
  35  |       text: error.message,
  36  |       timestamp: new Date().toISOString()
  37  |     });
  38  |   });
  39  |   
  40  |   return logs;
  41  | }
  42  | 
  43  | function saveConsoleLog(filename, logs) {
  44  |   const logPath = path.join(EVIDENCE_DIR, filename);
  45  |   fs.writeFileSync(logPath, JSON.stringify({
  46  |     console: logs.console,
  47  |     errors: logs.errors,
  48  |     summary: {
  49  |       total: logs.console.length,
  50  |       errors: logs.errors.length,
  51  |       hasBlockingErrors: logs.errors.some(e => 
  52  |         e.text && (e.text.includes('Uncaught') || e.text.includes('ReferenceError'))
  53  |       )
  54  |     }
  55  |   }, null, 2));
  56  |   return logPath;
  57  | }
  58  | 
  59  | async function loginAndGotoApp(page, targetPath = '/') {
  60  |   // Navigate to login page first
  61  |   await page.goto(`${BASE_URL}/login.html`);
  62  |   await page.waitForSelector('#login-form', { timeout: 10000 });
  63  |   
  64  |   // Fill in credentials
  65  |   await page.fill('#username', 'admin');
  66  |   await page.fill('#password', 'password123');
  67  |   
  68  |   // Submit form - use form submit instead of button click
  69  |   await page.click('#login-btn');
  70  |   
  71  |   // Wait for redirect to app
  72  |   await page.waitForURL(/index\.html|localhost:4188\/$/, { timeout: 10000 });
  73  |   await page.waitForSelector('.sidebar', { timeout: 10000 });
  74  | }
  75  | 
  76  | // ============ QA-P0-01: App Shell Boot ============
  77  | test('QA-P0-01: App shell boots cleanly', async ({ page }) => {
  78  |   const logs = setupConsoleCollector(page);
  79  |   
  80  |   // Login and navigate to app
  81  |   await loginAndGotoApp(page);
  82  |   
  83  |   // Wait for shell to load
  84  |   await page.waitForSelector('.sidebar', { timeout: 10000 });
  85  |   await page.waitForSelector('header.topbar', { timeout: 10000 });
  86  |   
  87  |   // Take screenshot of full app shell
  88  |   await page.screenshot({ 
  89  |     path: path.join(EVIDENCE_DIR, 'p0-01-app-shell-boot.png'),
  90  |     fullPage: true 
  91  |   });
  92  |   
  93  |   // Save console log
  94  |   const logPath = saveConsoleLog('p0-01-console.json', logs);
  95  |   
  96  |   console.log('✅ QA-P0-01: App shell boots cleanly');
  97  |   console.log(`   📸 Screenshot: p0-01-app-shell-boot.png`);
  98  |   console.log(`   📋 Console: p0-01-console.json`);
  99  |   console.log(`   Errors: ${logs.errors.length}`);
  100 |   
  101 |   // Verify no blocking JS errors
  102 |   const hasBlocking = logs.errors.some(e => 
  103 |     e.text && (e.text.includes('Uncaught') || e.text.includes('ReferenceError') || e.text.includes('TypeError'))
  104 |   );
  105 |   expect(hasBlocking).toBe(false);
> 106 |   expect(logs.errors.length).toBe(0);
      |                              ^ Error: expect(received).toBe(expected) // Object.is equality
  107 | });
  108 | 
  109 | // ============ QA-P0-02: Dashboard Critical Path ============
  110 | test('QA-P0-02: Dashboard critical path smoke', async ({ page }) => {
  111 |   const logs = setupConsoleCollector(page);
  112 |   
  113 |   await loginAndGotoApp(page);
  114 |   await page.waitForSelector('#v-dashboard', { timeout: 10000 });
  115 |   
  116 |   // Screenshot 1: Initial dashboard state
  117 |   await page.screenshot({ 
  118 |     path: path.join(EVIDENCE_DIR, 'p0-02-dashboard-initial.png'),
  119 |     fullPage: true 
  120 |   });
  121 |   
  122 |   // Test: KPI drilldown click (工程總體進度)
  123 |   await page.click('[data-action="dashboard-nav"][data-view="daily"]');
  124 |   await page.waitForTimeout(500);
  125 |   
  126 |   // Screenshot 2: After KPI navigation
  127 |   await page.screenshot({ 
  128 |     path: path.join(EVIDENCE_DIR, 'p0-02-dashboard-kpi-nav.png'),
  129 |     fullPage: true 
  130 |   });
  131 |   
  132 |   // Navigate back to dashboard
  133 |   await page.click('[data-view="dashboard"]');
  134 |   await page.waitForTimeout(500);
  135 |   
  136 |   // Test: Open work detail modal
  137 |   await page.click('[data-action="open-work-detail"][data-work-id="underground"]');
  138 |   await page.waitForTimeout(500);
  139 |   
  140 |   // Screenshot 3: Work detail modal open
  141 |   await page.screenshot({ 
  142 |     path: path.join(EVIDENCE_DIR, 'p0-02-work-detail-modal.png'),
  143 |     fullPage: true 
  144 |   });
  145 |   
  146 |   // Close modal
  147 |   await page.keyboard.press('Escape');
  148 |   await page.waitForTimeout(300);
  149 |   
  150 |   // Test: Open subcontractor detail
  151 |   await page.click('[data-action="open-subcontractor-detail"][data-sub-id="sub-chengshi"]');
  152 |   await page.waitForTimeout(500);
  153 |   
  154 |   // Screenshot 4: Subcontractor detail modal
  155 |   await page.screenshot({ 
  156 |     path: path.join(EVIDENCE_DIR, 'p0-02-subcontractor-modal.png'),
  157 |     fullPage: true 
  158 |   });
  159 |   
  160 |   saveConsoleLog('p0-02-console.json', logs);
  161 |   
  162 |   console.log('✅ QA-P0-02: Dashboard critical path smoke');
  163 |   console.log(`   📸 Screenshots: 4 captured`);
  164 |   console.log(`   📋 Console: p0-02-console.json`);
  165 |   console.log(`   Errors: ${logs.errors.length}`);
  166 |   
  167 |   expect(logs.errors.length).toBeLessThan(5);
  168 | });
  169 | 
  170 | // ============ QA-P0-03: Billing Critical Path ============
  171 | test('QA-P0-03: Billing critical path smoke', async ({ page }) => {
  172 |   const logs = setupConsoleCollector(page);
  173 |   
  174 |   await loginAndGotoApp(page);
  175 |   
  176 |   // Navigate to billing view
  177 |   await page.click('[data-view="billing"]');
  178 |   await page.waitForSelector('#v-billing', { timeout: 10000 });
  179 |   await page.waitForTimeout(500);
  180 |   
  181 |   // Screenshot 1: Billing view rendered
  182 |   await page.screenshot({ 
  183 |     path: path.join(EVIDENCE_DIR, 'p0-03-billing-view.png'),
  184 |     fullPage: true 
  185 |   });
  186 |   
  187 |   // Test: Open billing detail modal (Period 4)
  188 |   await page.click('[data-action="open-billing-detail"][data-billing-id="billing-4"]');
  189 |   await page.waitForTimeout(500);
  190 |   
  191 |   // Screenshot 2: Billing detail modal open
  192 |   await page.screenshot({ 
  193 |     path: path.join(EVIDENCE_DIR, 'p0-03-billing-detail-modal.png'),
  194 |     fullPage: true 
  195 |   });
  196 |   
  197 |   // Close modal
  198 |   await page.keyboard.press('Escape');
  199 |   await page.waitForTimeout(300);
  200 |   
  201 |   // Test: Open "新增估驗" modal
  202 |   await page.click('[data-action="open-modal"][data-modal-id="mo-billing"]');
  203 |   await page.waitForTimeout(500);
  204 |   
  205 |   // Screenshot 3: New estimate modal
  206 |   await page.screenshot({ 
```