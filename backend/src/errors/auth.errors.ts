/**
 * Auth Error Models — BE-002 (updated BE-307: contract-aligned error codes)
 *
 * Defines a typed error hierarchy for auth domain failures.
 * Each error maps to a specific HTTP status code and machine-readable code.
 * Used by AuthService and caught in route handlers to produce consistent error responses.
 *
 * BE-307 changes:
 *   - AccountDisabledError: statusCode 400 → 400, code "ACCOUNT_LOCKED" (was ACCOUNT_DISABLED/403)
 *   - Added RefreshTokenInvalidError (REFRESH_TOKEN_INVALID / 401)
 *   - Added RefreshTokenReusedError  (REFRESH_TOKEN_REUSED / 403)
 *   - Added RateLimitExceededError   (RATE_LIMIT_EXCEEDED / 429) — placeholder
 */

// ─── Base Error ───────────────────────────────────────────────────────────────

export class AuthError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;

    // Fix prototype chain for instanceof checks in transpiled ES5
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Specific Errors ──────────────────────────────────────────────────────────

/** Generic unauthorized — fallback when no more specific code applies */
export class UnauthorizedError extends AuthError {
  constructor(message = '未授權，請重新登入') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

/** User record not found in auth.users */
export class UserNotFoundError extends AuthError {
  constructor(message = '帳號或密碼錯誤') {
    // Use generic message to prevent user enumeration
    super('INVALID_CREDENTIALS', message, 400);
    this.name = 'UserNotFoundError';
  }
}

/** Credentials mismatch (wrong password) */
export class InvalidCredentialsError extends AuthError {
  constructor(message = '帳號或密碼錯誤') {
    // BE-307: aligned to contract — 400 INVALID_CREDENTIALS
    super('INVALID_CREDENTIALS', message, 400);
    this.name = 'InvalidCredentialsError';
  }
}

/** Session has expired (expiresAt in the past) */
export class SessionExpiredError extends AuthError {
  constructor(message = 'Session 已過期，請重新登入') {
    super('SESSION_EXPIRED', message, 401);
    this.name = 'SessionExpiredError';
  }
}

/** Session has been revoked (revokedAt is set) */
export class SessionRevokedError extends AuthError {
  constructor(message = 'Session 已被撤銷，請重新登入') {
    // BE-307: code SESSION_REVOKED aligned to contract /refresh error table
    super('SESSION_REVOKED', message, 401);
    this.name = 'SessionRevokedError';
  }
}

/** JWT access token has expired */
export class TokenExpiredError extends AuthError {
  constructor(message = 'Token 已過期，請重新整理') {
    super('TOKEN_EXPIRED', message, 401);
    this.name = 'TokenExpiredError';
  }
}

/**
 * Account is locked/disabled.
 * BE-307: statusCode changed to 400, code changed to ACCOUNT_LOCKED
 * (was: ACCOUNT_DISABLED / 403)
 */
export class AccountDisabledError extends AuthError {
  constructor(message = '帳號已鎖定，請聯繫管理員') {
    super('ACCOUNT_LOCKED', message, 400);
    this.name = 'AccountDisabledError';
  }
}

/**
 * Refresh token is invalid or expired.
 * BE-307: new error — replaces generic UNAUTHORIZED for /refresh endpoint
 */
export class RefreshTokenInvalidError extends AuthError {
  constructor(message = 'Refresh token 無效或已過期，請重新登入') {
    super('REFRESH_TOKEN_INVALID', message, 401);
    this.name = 'RefreshTokenInvalidError';
  }
}

/**
 * Refresh token reuse detected — all sessions have been revoked.
 * BE-307: new error — 403 REFRESH_TOKEN_REUSED per contract
 */
export class RefreshTokenReusedError extends AuthError {
  constructor(message = '偵測到 refresh token 重複使用，所有 session 已撤銷') {
    super('REFRESH_TOKEN_REUSED', message, 403);
    this.name = 'RefreshTokenReusedError';
  }
}

/**
 * Rate limit exceeded for login attempts.
 * BE-307: placeholder — DB_PENDING: enforce via auth.audit_login_attempts count
 */
export class RateLimitExceededError extends AuthError {
  constructor(message = '登入嘗試次數過多，請 30 分鐘後再試') {
    // DB_PENDING: enforce rate limiting logic once audit_login_attempts table is live
    super('RATE_LIMIT_EXCEEDED', message, 429);
    this.name = 'RateLimitExceededError';
  }
}
