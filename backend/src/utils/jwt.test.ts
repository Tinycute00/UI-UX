import { describe, it, expect, beforeAll } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt.js';

// Ensure a valid JWT_SECRET is set for tests
beforeAll(() => {
  process.env['JWT_SECRET'] = 'test-secret-key-at-least-32-characters!!';
  process.env['JWT_ACCESS_EXPIRES_MINUTES'] = '15';
  process.env['JWT_REFRESH_EXPIRES_DAYS'] = '7';
});

describe('JWT utils', () => {
  describe('signAccessToken', () => {
    it('should return a string', () => {
      const token = signAccessToken({ userId: 'user-1', role: 'admin' });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyAccessToken', () => {
    it('should return payload for a valid token', () => {
      const token = signAccessToken({ userId: 'user-1', role: 'admin' });
      const payload = verifyAccessToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe('user-1');
      expect(payload?.role).toBe('admin');
      expect(typeof payload?.iat).toBe('number');
      expect(typeof payload?.exp).toBe('number');
    });

    it('should return null for an invalid token', () => {
      const result = verifyAccessToken('invalid.token.string');
      expect(result).toBeNull();
    });

    it('should return null for a tampered token', () => {
      const token = signAccessToken({ userId: 'user-1', role: 'admin' });
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(verifyAccessToken(tampered)).toBeNull();
    });
  });

  describe('signRefreshToken', () => {
    it('should return a string', () => {
      const token = signRefreshToken({ userId: 'user-1' });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return payload for a valid refresh token', () => {
      const token = signRefreshToken({ userId: 'user-1' });
      const payload = verifyRefreshToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe('user-1');
    });

    it('should return null for an invalid refresh token', () => {
      expect(verifyRefreshToken('bad.token.here')).toBeNull();
    });
  });
});
