import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:4176';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(BASE_URL);
  await page.waitForTimeout(2000);

  // Check v-docs
  await page.click('[data-view="docs"]');
  await page.waitForTimeout(500);

  console.log('=== v-docs table rows ===');
  const rows = await page.locator('#v-docs tbody tr').all();
  console.log(`Total rows: ${rows.length}`);

  for (let i = 0; i < rows.length; i++) {
    const text = await rows[i].textContent();
    console.log(`Row ${i}: ${text.substring(0, 60)}...`);
  }

  console.log('\n=== Looking for 主要工程承攬合約 ===');
  const contractRow = await page.locator('#v-docs tr:has-text("主要工程承攬合約")').first();
  console.log('Contract row visible:', await contractRow.isVisible().catch(() => false));

  console.log('\n=== All buttons in v-docs ===');
  const buttons = await page.locator('#v-docs button').all();
  for (const btn of buttons) {
    const text = await btn.textContent();
    const action = await btn.getAttribute('data-action');
    console.log(`Button: "${text.trim()}" | data-action: ${action}`);
  }

  // Check v-morning
  await page.click('[data-view="morning"]');
  await page.waitForTimeout(500);

  console.log('\n=== v-morning buttons ===');
  const morningBtns = await page.locator('#v-morning button').all();
  for (const btn of morningBtns) {
    const text = await btn.textContent();
    const action = await btn.getAttribute('data-action');
    console.log(`Button: "${text.trim()}" | data-action: ${action}`);
  }

  await browser.close();
}

debug();
