/**
 * Auth Error Models — BE-002
 *
 * Defines a typed error hierarchy for auth domain failures.
 * Each error maps to a specific HTTP status code and machine-readable code.
 * Used by AuthService and caught in route handlers to produce consistent error responses.
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
    super('INVALID_CREDENTIALS', message, 401);
    this.name = 'UserNotFoundError';
  }
}

/** Credentials mismatch (wrong password) */
export class InvalidCredentialsError extends AuthError {
  constructor(message = '帳號或密碼錯誤') {
    super('INVALID_CREDENTIALS', message, 401);
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

/** Account is disabled (isActive = false) */
export class AccountDisabledError extends AuthError {
  constructor(message = '帳號已停用，請聯絡管理員') {
    super('ACCOUNT_DISABLED', message, 403);
    this.name = 'AccountDisabledError';
  }
}
