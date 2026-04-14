/**
 * Tests for AuthService — BE-002 (updated BE-307: contract-aligned)
 *
 * Uses vitest vi.mock to isolate from real DB and JWT utilities.
 * IAuthRepository is mocked via vi.fn() objects — no real DB calls.
 *
 * BE-307 changes:
 *   - login() uses username not email; mock repo must have findUserByUsername
 *   - login() result has expiresAt (Unix timestamp) + user object, not expiresIn
 *   - logout() returns { clearedSessions: number }; mock returns { count: 1 }
 *   - refresh() throws RefreshTokenInvalidError (not UnauthorizedError) on bad JWT
 *   - getMe() returns id/username/displayName/createdAt/lastLoginAt (not userId/name)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';

// ─── Mock dependencies before importing AuthService ──────────────────────────

vi.mock('../utils/password.js', () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock('../utils/jwt.js', () => ({
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

// ─── Imports (after mocks are set up) ────────────────────────────────────────

import { AuthService } from '../services/auth.service.js';
import type { IAuthRepository } from '../repositories/auth.repository.js';
import type { AuthUser, AuthSession, UserProjectRole } from '../types/auth.js';
import {
  InvalidCredentialsError,
  AccountDisabledError,
  SessionExpiredError,
  SessionRevokedError,
  UnauthorizedError,
  RefreshTokenInvalidError,
  RefreshTokenReusedError,
} from '../errors/auth.errors.js';
import { comparePassword } from '../utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

// ─── Typed mocks ─────────────────────────────────────────────────────────────

const mockedComparePassword = comparePassword as MockedFunction<typeof comparePassword>;
const mockedSignAccessToken = signAccessToken as MockedFunction<typeof signAccessToken>;
const mockedSignRefreshToken = signRefreshToken as MockedFunction<typeof signRefreshToken>;
const mockedVerifyRefreshToken = verifyRefreshToken as MockedFunction<typeof verifyRefreshToken>;

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeStubUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: BigInt(1),
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    passwordHash: '$2b$12$hashedpassword',
    role: 'admin',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeStubSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    id: BigInt(1),
    userId: BigInt(1),
    refreshTokenHash: 'hashed-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    deviceInfo: null,
    ipAddress: null,
    userAgent: null,
    createdAt: new Date(),
    lastUsedAt: new Date(),
    ...overrides,
  };
}

function makeStubProjectRole(overrides: Partial<UserProjectRole> = {}): UserProjectRole {
  return {
    id: BigInt(1),
    userId: BigInt(1),
    projectId: BigInt(101),
    role: 'admin',
    assignedAt: new Date(),
    assignedBy: null,
    ...overrides,
  };
}

// ─── Mock repo factory ────────────────────────────────────────────────────────

function makeMockRepo(overrides: Partial<IAuthRepository> = {}): IAuthRepository {
  return {
    // BE-307: findUserByUsername is now the primary lookup method
    findUserByUsername: vi.fn(),
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    updateUserLastLogin: vi.fn().mockResolvedValue(undefined),
    createSession: vi.fn().mockResolvedValue(makeStubSession()),
    findSessionByTokenHash: vi.fn(),
    revokeSession: vi.fn().mockResolvedValue(undefined),
    // BE-307: revokeAllUserSessions returns { count: number }
    revokeAllUserSessions: vi.fn().mockResolvedValue({ count: 1 }),
    cleanExpiredSessions: vi.fn().mockResolvedValue(0),
    createAuditAttempt: vi.fn().mockResolvedValue(undefined),
    findUserProjectRoles: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSignAccessToken.mockReturnValue('mock-access-token');
    mockedSignRefreshToken.mockReturnValue('mock-refresh-token');
  });

  // ─── login() ───────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('returns accessToken, refreshToken, expiresAt and user on success', async () => {
      const repo = makeMockRepo({
        // BE-307: uses findUserByUsername
        findUserByUsername: vi.fn().mockResolvedValue(makeStubUser()),
        findUserProjectRoles: vi.fn().mockResolvedValue([makeStubProjectRole()]),
      });
      mockedComparePassword.mockResolvedValue(true);

      const service = new AuthService(repo);
      const result = await service.login('testuser', 'password123', {});

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.tokenType).toBe('Bearer');
      // BE-307: expiresAt is Unix timestamp (number), not expiresIn
      expect(typeof result.expiresAt).toBe('number');
      expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
      // BE-307: user object in response
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('1');
      expect(result.user.username).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('admin');
      expect(Array.isArray(result.user.projectIds)).toBe(true);
      expect(repo.createSession).toHaveBeenCalledOnce();
      expect(repo.updateUserLastLogin).toHaveBeenCalledOnce();
    });

    it('throws InvalidCredentialsError when user not found', async () => {
      const repo = makeMockRepo({
        findUserByUsername: vi.fn().mockResolvedValue(null),
      });

      const service = new AuthService(repo);
      await expect(
        service.login('unknownuser', 'password123', {}),
      ).rejects.toThrow(InvalidCredentialsError);

      expect(repo.createAuditAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });

    it('throws InvalidCredentialsError when password is wrong', async () => {
      const repo = makeMockRepo({
        findUserByUsername: vi.fn().mockResolvedValue(makeStubUser()),
      });
      mockedComparePassword.mockResolvedValue(false);

      const service = new AuthService(repo);
      await expect(
        service.login('testuser', 'wrongpassword', {}),
      ).rejects.toThrow(InvalidCredentialsError);

      expect(repo.createAuditAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, failureReason: 'wrong_password' }),
      );
    });

    it('throws AccountDisabledError when account is inactive', async () => {
      const repo = makeMockRepo({
        findUserByUsername: vi.fn().mockResolvedValue(makeStubUser({ isActive: false })),
      });

      const service = new AuthService(repo);
      await expect(
        service.login('testuser', 'password123', {}),
      ).rejects.toThrow(AccountDisabledError);

      expect(repo.createAuditAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, failureReason: 'account_locked' }),
      );
    });
  });

  // ─── logout() ──────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('calls revokeAllUserSessions with the correct userId and returns clearedSessions', async () => {
      const repo = makeMockRepo();
      const service = new AuthService(repo);

      // BE-307: logout returns { clearedSessions: number }
      const result = await service.logout(BigInt(42));

      expect(repo.revokeAllUserSessions).toHaveBeenCalledOnce();
      expect(repo.revokeAllUserSessions).toHaveBeenCalledWith(BigInt(42));
      expect(result).toHaveProperty('clearedSessions');
      expect(typeof result.clearedSessions).toBe('number');
    });
  });

  // ─── refresh() ─────────────────────────────────────────────────────────────

  describe('refresh()', () => {
    it('returns new accessToken and expiresAt for a valid token with active session', async () => {
      mockedVerifyRefreshToken.mockReturnValue({
        userId: '1',
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const repo = makeMockRepo({
        findSessionByTokenHash: vi.fn().mockResolvedValue(makeStubSession()),
      });
      const service = new AuthService(repo);

      const result = await service.refresh('valid-refresh-token');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.tokenType).toBe('Bearer');
      // BE-307: expiresAt is Unix timestamp
      expect(typeof result.expiresAt).toBe('number');
      expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('throws RefreshTokenInvalidError when JWT is invalid', async () => {
      // BE-307: throws RefreshTokenInvalidError (not UnauthorizedError)
      mockedVerifyRefreshToken.mockReturnValue(null);

      const repo = makeMockRepo();
      const service = new AuthService(repo);

      await expect(service.refresh('bad-token')).rejects.toThrow(RefreshTokenInvalidError);
    });

    it('throws SessionRevokedError when session is revoked', async () => {
      mockedVerifyRefreshToken.mockReturnValue({
        userId: '1',
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const repo = makeMockRepo({
        findSessionByTokenHash: vi.fn().mockResolvedValue(
          makeStubSession({ revokedAt: new Date('2026-01-01') }),
        ),
      });
      const service = new AuthService(repo);

      await expect(service.refresh('revoked-token')).rejects.toThrow(SessionRevokedError);
    });

    it('throws SessionExpiredError when session is expired', async () => {
      mockedVerifyRefreshToken.mockReturnValue({
        userId: '1',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const repo = makeMockRepo({
        findSessionByTokenHash: vi.fn().mockResolvedValue(
          makeStubSession({ expiresAt: new Date('2025-01-01') }),
        ),
      });
      const service = new AuthService(repo);

      await expect(service.refresh('expired-token')).rejects.toThrow(SessionExpiredError);
    });

    it('throws RefreshTokenReusedError when refresh is attempted after logout (BE-312)', async () => {
      // Simulate: login → logout with rawToken → refresh with same rawToken
      // logout() must be called with the raw token so it gets added to _revokedRefreshJtis
      mockedVerifyRefreshToken.mockReturnValue({
        userId: '1',
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const repo = makeMockRepo({
        findSessionByTokenHash: vi.fn().mockResolvedValue(makeStubSession()),
      });
      const service = new AuthService(repo);

      // Use a unique token per test to avoid cross-test Set contamination
      const rawToken = `reuse-test-token-${Date.now()}-${Math.random()}`;

      // Step 1: logout with the token — this should add the hash to _revokedRefreshJtis
      await service.logout(BigInt(1), rawToken);

      // Step 2: attempt to refresh with the same token — should throw REFRESH_TOKEN_REUSED
      await expect(service.refresh(rawToken)).rejects.toThrow(RefreshTokenReusedError);

      // Verify the repo's revokeAllUserSessions was called (reuse security response)
      expect(repo.revokeAllUserSessions).toHaveBeenCalledTimes(2); // once for logout, once for reuse
    });
  });

  // ─── getMe() ───────────────────────────────────────────────────────────────

  describe('getMe()', () => {
    it('returns full user profile with correct BE-307 field names', async () => {
      const repo = makeMockRepo({
        findUserById: vi.fn().mockResolvedValue(makeStubUser()),
        findUserProjectRoles: vi.fn().mockResolvedValue([makeStubProjectRole()]),
      });
      const service = new AuthService(repo);

      const result = await service.getMe(BigInt(1));

      // BE-307: id (not userId), displayName (not name), username added
      expect(result.id).toBe('1');
      expect(result.username).toBe('testuser');
      expect(result.displayName).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('admin');
      expect(Array.isArray(result.projects)).toBe(true);
      expect(result.projects).toHaveLength(1);
      expect(Array.isArray(result.permissions)).toBe(true);
      // BE-307: createdAt and lastLoginAt
      expect(typeof result.createdAt).toBe('string');
      // BE-312: lastLoginAt is string (non-null per contract); stub fallback = epoch ISO string
      expect(typeof result.lastLoginAt).toBe('string');
    });

    it('throws UnauthorizedError when user is not found', async () => {
      const repo = makeMockRepo({
        findUserById: vi.fn().mockResolvedValue(null),
      });
      const service = new AuthService(repo);

      await expect(service.getMe(BigInt(999))).rejects.toThrow(UnauthorizedError);
    });

    it('returns admin permissions including users:write', async () => {
      const repo = makeMockRepo({
        findUserById: vi.fn().mockResolvedValue(makeStubUser({ role: 'admin' })),
        findUserProjectRoles: vi.fn().mockResolvedValue([]),
      });
      const service = new AuthService(repo);

      const result = await service.getMe(BigInt(1));
      expect(result.permissions).toContain('users:write');
      expect(result.permissions).toContain('projects:read');
    });

    it('returns vendor permissions containing only projects:read', async () => {
      const repo = makeMockRepo({
        findUserById: vi.fn().mockResolvedValue(makeStubUser({ role: 'vendor' })),
        findUserProjectRoles: vi.fn().mockResolvedValue([]),
      });
      const service = new AuthService(repo);

      const result = await service.getMe(BigInt(1));
      expect(result.permissions).toEqual(['projects:read']);
    });
  });
});
