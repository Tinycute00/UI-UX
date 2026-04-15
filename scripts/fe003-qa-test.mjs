import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:5180';
const EVIDENCE_DIR = './docs/qa/evidence/fe003-rerun-20260415';

// Ensure evidence directory exists
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const evidence = {
  timestamp: new Date().toISOString(),
  url: BASE_URL,
  console: [],
  network: [],
  errors: [],
  screenshots: [],
  summary: {
    workItemsApi: null,
    subcontractorsApi: null,
    dashboardStatus: null,
    blockers: [],
  },
};

async function runTest() {
  console.log('🚀 Starting FE-003 Dashboard QA Rerun');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📁 Evidence Dir: ${EVIDENCE_DIR}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: EVIDENCE_DIR },
  });

  const page = await context.newPage();

  // Capture console logs
  page.on('console', (msg) => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      time: new Date().toISOString(),
    };
    evidence.console.push(logEntry);
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    const errorEntry = {
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString(),
    };
    evidence.errors.push(errorEntry);
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  // Capture network requests
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/')) {
      evidence.network.push({
        type: 'request',
        method: request.method(),
        url: url,
        time: new Date().toISOString(),
      });
      console.log(`[REQUEST] ${request.method()} ${url}`);
    }
  });

  // Capture network responses
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      let body = null;

      try {
        // Try to get response body for successful responses
        if (status >= 200 && status < 300) {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            body = await response.json().catch(() => null);
          }
        }
      } catch (e) {
        // Ignore body parsing errors
      }

      const responseEntry = {
        type: 'response',
        status: status,
        url: url,
        time: new Date().toISOString(),
        body: body,
      };

      evidence.network.push(responseEntry);
      console.log(`[RESPONSE] ${status} ${url}`);

      // Track specific API results
      if (url.includes('/work-items')) {
        evidence.summary.workItemsApi = { status, url, body };
      }
      if (url.includes('/subcontractors')) {
        evidence.summary.subcontractorsApi = { status, url, body };
      }
    }
  });

  try {
    // Step 1: Navigate to login page
    console.log('\n📋 Step 1: Navigate to login page');
    await page.goto(`${BASE_URL}/login.html`);
    await page.waitForLoadState('networkidle');

    // Screenshot: Login page
    const loginScreenshot = path.join(EVIDENCE_DIR, '01-login-page.png');
    await page.screenshot({ path: loginScreenshot, fullPage: true });
    evidence.screenshots.push({ name: '01-login-page', path: loginScreenshot });
    console.log('✅ Login page screenshot saved');

    // Step 2: Perform login
    console.log('\n📋 Step 2: Perform login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'password123');

    // Click login and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('#login-btn'),
    ]);

    // Screenshot: After login (should be dashboard)
    const dashboardScreenshot = path.join(EVIDENCE_DIR, '02-dashboard-loaded.png');
    await page.screenshot({ path: dashboardScreenshot, fullPage: true });
    evidence.screenshots.push({ name: '02-dashboard-loaded', path: dashboardScreenshot });
    console.log('✅ Dashboard screenshot saved');

    // Step 3: Wait for dashboard data to load
    console.log('\n📋 Step 3: Wait for dashboard data');
    await page.waitForTimeout(3000); // Give time for API calls to complete

    // Check dashboard state
    const dashContent = await page
      .$eval('#dash-content', (el) => el.style.display)
      .catch(() => 'not-found');
    const dashError = await page
      .$eval('#dash-error', (el) => el.style.display)
      .catch(() => 'not-found');
    const dashLoading = await page
      .$eval('#dash-loading', (el) => el.style.display)
      .catch(() => 'not-found');

    console.log(
      `Dashboard states: content=${dashContent}, error=${dashError}, loading=${dashLoading}`,
    );

    // Screenshot: Dashboard with data
    const dashboardDataScreenshot = path.join(EVIDENCE_DIR, '03-dashboard-data.png');
    await page.screenshot({ path: dashboardDataScreenshot, fullPage: true });
    evidence.screenshots.push({ name: '03-dashboard-data', path: dashboardDataScreenshot });
    console.log('✅ Dashboard data screenshot saved');

    // Step 4: Check for work-items data in the DOM
    console.log('\n📋 Step 4: Verify work-items rendering');
    const workItemsPresent = await page.$$eval('[data-work-id]', (items) => items.length);
    console.log(`Work items found in DOM: ${workItemsPresent}`);

    // Step 5: Check subcontractors table
    console.log('\n📋 Step 5: Verify subcontractors rendering');
    const subcontractorRows = await page.$$eval('#subcontractors-tbody tr', (rows) => rows.length);
    console.log(`Subcontractor rows found: ${subcontractorRows}`);

    // Determine dashboard status
    if (dashError !== 'none' && dashError !== 'not-found') {
      evidence.summary.dashboardStatus = 'error';
    } else if (dashContent !== 'none') {
      evidence.summary.dashboardStatus = 'loaded';
    } else {
      evidence.summary.dashboardStatus = 'loading';
    }

    // Step 6: Analyze API results
    console.log('\n📋 Step 6: Analyze API results');

    if (!evidence.summary.workItemsApi) {
      evidence.summary.blockers.push({
        type: 'frontend',
        message: 'work-items API call not captured - may not have been triggered',
      });
    } else if (evidence.summary.workItemsApi.status !== 200) {
      evidence.summary.blockers.push({
        type: evidence.summary.workItemsApi.status === 404 ? 'backend' : 'runtime',
        message: `work-items API returned ${evidence.summary.workItemsApi.status}`,
        details: evidence.summary.workItemsApi,
      });
    }

    if (!evidence.summary.subcontractorsApi) {
      evidence.summary.blockers.push({
        type: 'frontend',
        message: 'subcontractors API call not captured - may not have been triggered',
      });
    } else if (evidence.summary.subcontractorsApi.status !== 200) {
      evidence.summary.blockers.push({
        type: evidence.summary.subcontractorsApi.status === 404 ? 'backend' : 'runtime',
        message: `subcontractors API returned ${evidence.summary.subcontractorsApi.status}`,
        details: evidence.summary.subcontractorsApi,
      });
    }

    console.log('\n📊 Test Results Summary:');
    console.log(`- Dashboard Status: ${evidence.summary.dashboardStatus}`);
    console.log(
      `- Work Items API: ${evidence.summary.workItemsApi ? evidence.summary.workItemsApi.status : 'Not captured'}`,
    );
    console.log(
      `- Subcontractors API: ${evidence.summary.subcontractorsApi ? evidence.summary.subcontractorsApi.status : 'Not captured'}`,
    );
    console.log(`- Blockers: ${evidence.summary.blockers.length}`);
  } catch (error) {
    console.error('❌ Test error:', error.message);
    evidence.errors.push({
      type: 'test-error',
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString(),
    });

    // Screenshot on error
    const errorScreenshot = path.join(EVIDENCE_DIR, 'error-state.png');
    await page.screenshot({ path: errorScreenshot, fullPage: true });
    evidence.screenshots.push({ name: 'error-state', path: errorScreenshot });
  }

  await browser.close();

  // Save evidence JSON
  const evidencePath = path.join(EVIDENCE_DIR, 'evidence.json');
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  console.log(`\n💾 Evidence saved to: ${evidencePath}`);

  return evidence;
}

runTest().catch(console.error);
