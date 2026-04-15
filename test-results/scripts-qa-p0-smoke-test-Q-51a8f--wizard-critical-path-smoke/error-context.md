# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scripts/qa-p0-smoke-test.spec.js >> QA-P0-04: Safety wizard critical path smoke
- Location: scripts/qa-p0-smoke-test.spec.js:222:1

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('#v-safety') to be visible
    25 × locator resolved to hidden <div id="v-safety" class="view active">…</div>

```

# Test source

```ts
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
  207 |     path: path.join(EVIDENCE_DIR, 'p0-03-new-estimate-modal.png'),
  208 |     fullPage: true 
  209 |   });
  210 |   
  211 |   saveConsoleLog('p0-03-console.json', logs);
  212 |   
  213 |   console.log('✅ QA-P0-03: Billing critical path smoke');
  214 |   console.log(`   📸 Screenshots: 3 captured`);
  215 |   console.log(`   📋 Console: p0-03-console.json`);
  216 |   console.log(`   Errors: ${logs.errors.length}`);
  217 |   
  218 |   expect(logs.errors.length).toBeLessThan(5);
  219 | });
  220 | 
  221 | // ============ QA-P0-04: Safety Wizard Critical Path ============
  222 | test('QA-P0-04: Safety wizard critical path smoke', async ({ page }) => {
  223 |   const logs = setupConsoleCollector(page);
  224 |   
  225 |   await loginAndGotoApp(page);
  226 |   
  227 |   // Navigate to safety view
  228 |   await page.click('[data-view="safety"]');
> 229 |   await page.waitForSelector('#v-safety', { timeout: 10000 });
      |              ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  230 |   
  231 |   // Screenshot 1: Safety view initial
  232 |   await page.screenshot({ 
  233 |     path: path.join(EVIDENCE_DIR, 'p0-04-safety-initial.png'),
  234 |     fullPage: true 
  235 |   });
  236 |   
  237 |   // Start wizard: Click "新增巡檢日誌"
  238 |   await page.click('[data-action="safety-step"][data-step="1"]');
  239 |   await page.waitForTimeout(500);
  240 |   
  241 |   // Screenshot 2: Step 1 visible
  242 |   await page.screenshot({ 
  243 |     path: path.join(EVIDENCE_DIR, 'p0-04-safety-step1.png'),
  244 |     fullPage: true 
  245 |   });
  246 |   
  247 |   // Check at least one location checkbox
  248 |   await page.locator('#sw-step1 input[type="checkbox"]').first().check();
  249 |   
  250 |   // Check at least one inspection item
  251 |   await page.locator('#sw-step1 input[type="checkbox"]').nth(6).check();
  252 |   
  253 |   // Click Next to Step 2
  254 |   await page.click('[data-action="safety-step"][data-step="2"]');
  255 |   await page.waitForTimeout(500);
  256 |   
  257 |   // Screenshot 3: Step 2 visible (checklist generated)
  258 |   await page.screenshot({ 
  259 |     path: path.join(EVIDENCE_DIR, 'p0-04-safety-step2.png'),
  260 |     fullPage: true 
  261 |   });
  262 |   
  263 |   // Mark first item as pass
  264 |   const passButton = await page.locator('#sf-checklist button[data-mark="pass"]').first();
  265 |   if (await passButton.isVisible().catch(() => false)) {
  266 |     await passButton.click();
  267 |     await page.waitForTimeout(300);
  268 |   }
  269 |   
  270 |   // Screenshot 4: After marking pass
  271 |   await page.screenshot({ 
  272 |     path: path.join(EVIDENCE_DIR, 'p0-04-safety-step2-marked.png'),
  273 |     fullPage: true 
  274 |   });
  275 |   
  276 |   // Click Next to Step 3
  277 |   await page.click('[data-action="safety-step"][data-step="3"]');
  278 |   await page.waitForTimeout(500);
  279 |   
  280 |   // Screenshot 5: Step 3 visible
  281 |   await page.screenshot({ 
  282 |     path: path.join(EVIDENCE_DIR, 'p0-04-safety-step3.png'),
  283 |     fullPage: true 
  284 |   });
  285 |   
  286 |   // Test reset/cancel
  287 |   await page.click('[data-action="safety-cancel"]');
  288 |   await page.waitForTimeout(300);
  289 |   
  290 |   // Screenshot 6: After cancel (wizard hidden)
  291 |   await page.screenshot({ 
  292 |     path: path.join(EVIDENCE_DIR, 'p0-04-safety-cancelled.png'),
  293 |     fullPage: true 
  294 |   });
  295 |   
  296 |   saveConsoleLog('p0-04-console.json', logs);
  297 |   
  298 |   console.log('✅ QA-P0-04: Safety wizard critical path smoke');
  299 |   console.log(`   📸 Screenshots: 6 captured`);
  300 |   console.log(`   📋 Console: p0-04-console.json`);
  301 |   console.log(`   Wizard steps: 1→2→3→cancel verified`);
  302 |   
  303 |   expect(logs.errors.length).toBeLessThan(5);
  304 | });
  305 | 
  306 | // ============ QA-P0-05: Auth Gap Verification (Source Only) ============
  307 | test('QA-P0-05: Auth gap verification', async () => {
  308 |   console.log('✅ QA-P0-05: Auth gap verification');
  309 |   console.log('   📋 Source review: sidebar.html, login.html, auth-adapter.js');
  310 |   console.log('   Finding: Auth UI is static only, no session/RBAC implemented');
  311 | });
  312 | 
  313 | test.afterAll(async () => {
  314 |   console.log('\n🏁 P0 Smoke Test Complete');
  315 |   console.log(`📁 Evidence directory: ${EVIDENCE_DIR}`);
  316 | });
```