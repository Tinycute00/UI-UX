// jsonwebtoken is a CommonJS module; in ESM we access it via the default export
import * as _jwt from 'jsonwebtoken';
import { config } from '../config.js';

// Safely resolve the jsonwebtoken API regardless of whether we get the default
// interop wrapper or the raw CJS namespace.
const jwtLib = (_jwt as { default?: typeof _jwt } & typeof _jwt).default ?? _jwt;
const { sign, verify } = jwtLib;

/**
 * Access Token payload shape
 */
export interface JwtAccessPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Refresh Token payload shape
 */
export interface JwtRefreshPayload {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * Sign a short-lived Access Token (default: 15 min)
 */
export function signAccessToken(payload: { userId: string; role: string }): string {
  return sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_MINUTES * 60,
  });
}

/**
 * Sign a long-lived Refresh Token (default: 7 days)
 */
export function signRefreshToken(payload: { userId: string }): string {
  return sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60,
  });
}

/**
 * Verify an Access Token.
 * Returns the decoded payload or null if invalid/expired.
 */
export function verifyAccessToken(token: string): JwtAccessPayload | null {
  try {
    return verify(token, config.JWT_SECRET) as JwtAccessPayload;
  } catch {
    return null;
  }
}

/**
 * Verify a Refresh Token.
 * Returns the decoded payload or null if invalid/expired.
 */
export function verifyRefreshToken(token: string): JwtRefreshPayload | null {
  try {
    return verify(token, config.JWT_SECRET) as JwtRefreshPayload;
  } catch {
    return null;
  }
}
