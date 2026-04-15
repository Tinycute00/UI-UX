/* ═══ Auth API Adapter — FE-002 ═══
 * Live integration with /api/v1/auth/* endpoints.
 * Contract: BE-307 (username-based login, expiresAt Unix timestamp, httpOnly refresh cookie)
 */

import { TOKEN_KEY } from '../config.js';
import { apiGet, apiPost } from '../client.js';

var EXPIRES_AT_KEY = 'pmis_expires_at';
var USER_KEY = 'pmis_user';

/**
 * login — POST /api/v1/auth/login
 * Stores accessToken, expiresAt, and user info in sessionStorage.
 * @param {string} username
 * @param {string} password
 * @param {boolean} [rememberMe]
 * @returns {Promise<object>} user object on success, rejects on error
 */
export function login(username, password, rememberMe) {
  var body = { username: username, password: password };
  if (rememberMe) {
    body.rememberMe = true;
  }
  return apiPost('/auth/login', body).then(function (result) {
    if (result.error) {
      return Promise.reject(result.error);
    }
    var data = result.data;
    try {
      sessionStorage.setItem(TOKEN_KEY, data.accessToken);
      sessionStorage.setItem(EXPIRES_AT_KEY, String(data.expiresAt));
      sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } catch (e) {
      // sessionStorage not available (private mode / SSR) — non-fatal
    }
    return data.user;
  });
}

/**
 * logout — POST /api/v1/auth/logout
 * Clears all sessionStorage auth data and redirects to /login.html.
 * @param {boolean} [logoutAllDevices]
 */
export function logout(logoutAllDevices) {
  var body = {};
  if (logoutAllDevices) {
    body.logoutAllDevices = true;
  }
  return apiPost('/auth/logout', body).then(function () {
    clearAuthStorage();
    window.location.href = '/login.html';
  }).catch(function () {
    // Even on network error, clear local auth and redirect
    clearAuthStorage();
    window.location.href = '/login.html';
  });
}

/**
 * refreshToken — POST /api/v1/auth/refresh
 * Depends on httpOnly refresh_token cookie set by backend.
 * Updates accessToken + expiresAt in sessionStorage.
 * @returns {Promise<void>}
 */
export function refreshToken() {
  return apiPost('/auth/refresh', {}).then(function (result) {
    if (result.error) {
      return Promise.reject(result.error);
    }
    var data = result.data;
    try {
      sessionStorage.setItem(TOKEN_KEY, data.accessToken);
      sessionStorage.setItem(EXPIRES_AT_KEY, String(data.expiresAt));
    } catch (e) {
      // sessionStorage not available — non-fatal
    }
  });
}

/**
 * getMe — GET /api/v1/auth/me
 * Returns the current user profile from the backend.
 * @returns {Promise<object>}
 */
export function getMe() {
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

  now = Math.floor(Date.now() / 1000);
  return Number(expiresAt) > now;
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
