import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './password.js';

describe('password utils', () => {
  describe('hashPassword', () => {
    it('should return a bcrypt hash string starting with $2b$', async () => {
      const hash = await hashPassword('mySecretPassword123');
      expect(hash).toMatch(/^\$2b\$/);
    });

    it('should produce different hashes for the same input (salt)', async () => {
      const hash1 = await hashPassword('password');
      const hash2 = await hashPassword('password');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const hash = await hashPassword('correctPassword123');
      const result = await comparePassword('correctPassword123', hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const hash = await hashPassword('correctPassword123');
      const result = await comparePassword('wrongPassword999', hash);
      expect(result).toBe(false);
    });
  });
});
