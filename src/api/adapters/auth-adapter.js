/* ═══ Auth API Adapter — FE-002 ═══
 * Live integration with /api/v1/auth/* endpoints.
 * Demo mode uses sessionStorage-backed fake auth for static hosting.
 * Contract: BE-307 (username-based login, expiresAt Unix timestamp, httpOnly refresh cookie)
 */

import { API_MODE, TOKEN_KEY } from '../config.js';
import { apiGet, apiPost } from '../client.js';

var EXPIRES_AT_KEY = 'pmis_expires_at';
var USER_KEY = 'pmis_user';
var DEMO_SESSION_SECONDS = 8 * 60 * 60;
var DEMO_CREDENTIALS = [
  {
    username: 'admin',
    password: 'password123',
    user: {
      id: 'demo-admin',
      username: 'admin',
      displayName: '王建明',
      role: 'site_manager',
      roleLabel: 'Site Manager',
      projectId: 101,
      projectCode: 'TC-2024-018',
      projectName: '台北 W Hotel 改建工程',
      email: 'demo-admin@tacheng.example',
    },
  },
  {
    username: 'demo.pm',
    password: 'demo1234',
    user: {
      id: 'demo-pm',
      username: 'demo.pm',
      displayName: '陳品妤',
      role: 'project_manager',
      roleLabel: 'Project Manager',
      projectId: 101,
      projectCode: 'TC-2024-018',
      projectName: '台北 W Hotel 改建工程',
      email: 'demo.pm@tacheng.example',
    },
  },
];

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function createDemoToken(user) {
  return 'demo-token-' + user.username + '-' + String(Date.now());
}

function storeAuthSession(data) {
  try {
    sessionStorage.setItem(TOKEN_KEY, data.accessToken);
    sessionStorage.setItem(EXPIRES_AT_KEY, String(data.expiresAt));
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
  } catch (e) {
    // sessionStorage not available (private mode / SSR) — non-fatal
  }
}

function buildDemoSession(credential) {
  return {
    accessToken: createDemoToken(credential.user),
    expiresAt: nowInSeconds() + DEMO_SESSION_SECONDS,
    user: credential.user,
  };
}

function findDemoCredential(username, password) {
  return DEMO_CREDENTIALS.find(function (credential) {
    return credential.username === username && credential.password === password;
  }) || null;
}

function getDemoSession() {
  var token = null;
  var expiresAt = null;
  var user = null;

  try {
    token = sessionStorage.getItem(TOKEN_KEY);
    expiresAt = sessionStorage.getItem(EXPIRES_AT_KEY);
    user = sessionStorage.getItem(USER_KEY);
  } catch (e) {
    return null;
  }

  if (!token || !expiresAt || !user) {
    return null;
  }

  try {
    return {
      accessToken: token,
      expiresAt: Number(expiresAt),
      user: JSON.parse(user),
    };
  } catch (e) {
    clearAuthStorage();
    return null;
  }
}

function isDemoMode() {
  return API_MODE === 'mock';
}

/**
 * login — POST /api/v1/auth/login
 * Stores accessToken, expiresAt, and user info in sessionStorage.
 * In demo mode, accepts known demo credentials only.
 * @param {string} username
 * @param {string} password
 * @param {boolean} [rememberMe]
 * @returns {Promise<object>} user object on success, rejects on error
 */
export function login(username, password, rememberMe) {
  var body = { username: username, password: password };
  var demoCredential = null;
  var demoSession = null;

  if (rememberMe) {
    body.rememberMe = true;
  }

  if (isDemoMode()) {
    demoCredential = findDemoCredential(username, password);

    if (!demoCredential) {
      return Promise.reject(new Error('INVALID_CREDENTIALS'));
    }

    demoSession = buildDemoSession(demoCredential);
    storeAuthSession(demoSession);
    return Promise.resolve(demoSession.user);
  }

  return apiPost('/auth/login', body).then(function (result) {
    if (result.error) {
      return Promise.reject(result.error);
    }
    storeAuthSession(result.data);
    return result.data.user;
  });
}

/**
 * logout — POST /api/v1/auth/logout
 * Clears all sessionStorage auth data and redirects to ./login.html.
 * @param {boolean} [logoutAllDevices]
 */
export function logout(logoutAllDevices) {
  var body = {};

  if (isDemoMode()) {
    clearAuthStorage();
    window.location.href = './login.html';
    return Promise.resolve();
  }

  if (logoutAllDevices) {
    body.logoutAllDevices = true;
  }
  return apiPost('/auth/logout', body).then(function () {
    clearAuthStorage();
    window.location.href = './login.html';
  }).catch(function () {
    // Even on network error, clear local auth and redirect
    clearAuthStorage();
    window.location.href = './login.html';
  });
}

/**
 * refreshToken — POST /api/v1/auth/refresh
 * Depends on httpOnly refresh_token cookie set by backend.
 * Updates accessToken + expiresAt in sessionStorage.
 * In demo mode, extends the local fake session.
 * @returns {Promise<void>}
 */
export function refreshToken() {
  var session = null;
  var refreshedSession = null;

  if (isDemoMode()) {
    session = getDemoSession();

    if (!session || !session.user) {
      clearAuthStorage();
      return Promise.reject(new Error('SESSION_EXPIRED'));
    }

    refreshedSession = {
      accessToken: createDemoToken(session.user),
      expiresAt: nowInSeconds() + DEMO_SESSION_SECONDS,
      user: session.user,
    };
    storeAuthSession(refreshedSession);
    return Promise.resolve();
  }

  return apiPost('/auth/refresh', {}).then(function (result) {
    if (result.error) {
      return Promise.reject(result.error);
    }
    try {
      sessionStorage.setItem(TOKEN_KEY, result.data.accessToken);
      sessionStorage.setItem(EXPIRES_AT_KEY, String(result.data.expiresAt));
    } catch (e) {
      // sessionStorage not available — non-fatal
    }
  });
}

/**
 * getMe — GET /api/v1/auth/me
 * Returns the current user profile from the backend.
 * In demo mode, returns the locally stored demo user.
 * @returns {Promise<object>}
 */
export function getMe() {
  var session = null;

  if (isDemoMode()) {
    session = getDemoSession();
    if (!session || !session.user || Number(session.expiresAt) <= nowInSeconds()) {
      clearAuthStorage();
      return Promise.reject(new Error('UNAUTHORIZED'));
    }
    return Promise.resolve(session.user);
  }

  return apiGet('/auth/me').then(function (result) {
    if (result.error) {
      return Promise.reject(result.error);
    }
    return result.data;
  });
}

/**
 * isAuthenticated — check if user has a valid (non-expired) access token.
 * @returns {boolean}
 */
export function isAuthenticated() {
  var token = null;
  var expiresAt = null;
  var now = null;

  try {
    token = sessionStorage.getItem(TOKEN_KEY);
    expiresAt = sessionStorage.getItem(EXPIRES_AT_KEY);
  } catch (e) {
    return false;
  }

  if (!token || !expiresAt) {
    return false;
  }

  now = nowInSeconds();
  if (Number(expiresAt) <= now) {
    clearAuthStorage();
    return false;
  }

  return true;
}

/**
 * getStoredUser — retrieve user info from sessionStorage.
 * @returns {object|null}
 */
export function getStoredUser() {
  var raw = null;
  try {
    raw = sessionStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * clearAuthStorage — remove all auth-related sessionStorage keys.
 * Internal helper; also exported for test / logout use.
 */
export function clearAuthStorage() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXPIRES_AT_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch (e) {
    // sessionStorage not available — non-fatal
  }
}
