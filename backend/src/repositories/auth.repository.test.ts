/**
 * Tests for AuthRepositoryStub
 *
 * Verifies that the stub implementation returns expected fixture data
 * and correctly reflects DB_PENDING behaviour (no real DB calls).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuthRepositoryStub } from '../../src/repositories/auth.repository.js';

describe('AuthRepositoryStub', () => {
  let repo: AuthRepositoryStub;

  beforeEach(() => {
    repo = new AuthRepositoryStub();
  });

  // ─── findUserByEmail ──────────────────────────────────────────────────────

  describe('findUserByEmail', () => {
    it('returns stub user for known email', async () => {
      const user = await repo.findUserByEmail('stub@example.com');
      expect(user).not.toBeNull();
      expect(user!.email).toBe('stub@example.com');
      expect(user!.username).toBe('stub_user');
      expect(user!.role).toBe('admin');
      expect(user!.isActive).toBe(true);
    });

    it('returns null for unknown email', async () => {
      const user = await repo.findUserByEmail('unknown@example.com');
      expect(user).toBeNull();
    });
  });

  // ─── findUserById ─────────────────────────────────────────────────────────

  describe('findUserById', () => {
    it('returns stub user for id=1', async () => {
      const user = await repo.findUserById(BigInt(1));
      expect(user).not.toBeNull();
      expect(user!.id).toBe(BigInt(1));
    });

    it('returns null for unknown id', async () => {
      const user = await repo.findUserById(BigInt(999));
      expect(user).toBeNull();
    });
  });

  // ─── updateUserLastLogin ──────────────────────────────────────────────────

  describe('updateUserLastLogin', () => {
    it('resolves without error (DB_PENDING stub)', async () => {
      await expect(
        repo.updateUserLastLogin(BigInt(1), new Date()),
      ).resolves.toBeUndefined();
    });
  });

  // ─── createSession ────────────────────────────────────────────────────────

  describe('createSession', () => {
    it('returns a session with matching input fields', async () => {
      const expiresAt = new Date(Date.now() + 86400_000);
      const session = await repo.createSession({
        userId: BigInt(1),
        refreshTokenHash: 'test-hash-abc',
        expiresAt,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      });

      expect(session.userId).toBe(BigInt(1));
      expect(session.refreshTokenHash).toBe('test-hash-abc');
      expect(session.expiresAt).toEqual(expiresAt);
      expect(session.revokedAt).toBeNull();
      expect(session.ipAddress).toBe('127.0.0.1');
    });
  });

  // ─── findSessionByTokenHash ───────────────────────────────────────────────

  describe('findSessionByTokenHash', () => {
    it('returns a session for the known stub hash', async () => {
      const session = await repo.findSessionByTokenHash('stub-token-hash');
      expect(session).not.toBeNull();
      expect(session!.refreshTokenHash).toBe('stub-token-hash');
      expect(session!.revokedAt).toBeNull();
      expect(session!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('returns null for unknown hash', async () => {
      const session = await repo.findSessionByTokenHash('unknown-hash');
      expect(session).toBeNull();
    });
  });

  // ─── revokeSession ────────────────────────────────────────────────────────

  describe('revokeSession', () => {
    it('resolves without error (DB_PENDING stub)', async () => {
      await expect(
        repo.revokeSession(BigInt(1), new Date()),
      ).resolves.toBeUndefined();
    });
  });

  // ─── revokeAllUserSessions ────────────────────────────────────────────────

  describe('revokeAllUserSessions', () => {
    it('resolves without error (DB_PENDING stub)', async () => {
      await expect(
        repo.revokeAllUserSessions(BigInt(1)),
      ).resolves.toBeUndefined();
    });
  });

  // ─── cleanExpiredSessions ────────────────────────────────────────────────

  describe('cleanExpiredSessions', () => {
    it('returns 0 (DB_PENDING stub)', async () => {
      const count = await repo.cleanExpiredSessions(new Date());
      expect(count).toBe(0);
    });
  });

  // ─── createAuditAttempt ───────────────────────────────────────────────────

  describe('createAuditAttempt', () => {
    it('resolves without error for success attempt', async () => {
      await expect(
        repo.createAuditAttempt({
          username: 'testuser',
          email: 'test@example.com',
          success: true,
        }),
      ).resolves.toBeUndefined();
    });

    it('resolves without error for failed attempt', async () => {
      await expect(
        repo.createAuditAttempt({
          username: 'baduser',
          success: false,
          failureReason: 'wrong_password',
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ─── findUserProjectRoles ─────────────────────────────────────────────────

  describe('findUserProjectRoles', () => {
    it('returns stub project roles for userId=1', async () => {
      const roles = await repo.findUserProjectRoles(BigInt(1));
      expect(roles.length).toBeGreaterThan(0);
      expect(roles[0].userId).toBe(BigInt(1));
      expect(roles[0].role).toBe('admin');
    });

    it('returns empty array for unknown userId', async () => {
      const roles = await repo.findUserProjectRoles(BigInt(999));
      expect(roles).toHaveLength(0);
    });
  });
});
