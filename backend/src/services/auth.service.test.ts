/**
 * Tests for AuthService — BE-002
 *
 * Uses vitest vi.mock to isolate from real DB and JWT utilities.
 * IAuthRepository is mocked via vi.fn() objects — no real DB calls.
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
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    updateUserLastLogin: vi.fn().mockResolvedValue(undefined),
    createSession: vi.fn().mockResolvedValue(makeStubSession()),
    findSessionByTokenHash: vi.fn(),
    revokeSession: vi.fn().mockResolvedValue(undefined),
    revokeAllUserSessions: vi.fn().mockResolvedValue(undefined),
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
    it('returns accessToken and refreshToken on success', async () => {
      const repo = makeMockRepo({
        findUserByEmail: vi.fn().mockResolvedValue(makeStubUser()),
      });
      mockedComparePassword.mockResolvedValue(true);

      const service = new AuthService(repo);
      const result = await service.login('test@example.com', 'password123', {});

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.tokenType).toBe('Bearer');
      expect(typeof result.expiresIn).toBe('number');
      expect(result.expiresIn).toBeGreaterThan(0);
      expect(repo.createSession).toHaveBeenCalledOnce();
      expect(repo.updateUserLastLogin).toHaveBeenCalledOnce();
    });

    it('throws InvalidCredentialsError when user not found', async () => {
      const repo = makeMockRepo({
        findUserByEmail: vi.fn().mockResolvedValue(null),
      });

      const service = new AuthService(repo);
      await expect(
        service.login('unknown@example.com', 'password123', {}),
      ).rejects.toThrow(InvalidCredentialsError);

      expect(repo.createAuditAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });

    it('throws InvalidCredentialsError when password is wrong', async () => {
      const repo = makeMockRepo({
        findUserByEmail: vi.fn().mockResolvedValue(makeStubUser()),
      });
      mockedComparePassword.mockResolvedValue(false);

      const service = new AuthService(repo);
      await expect(
        service.login('test@example.com', 'wrongpassword', {}),
      ).rejects.toThrow(InvalidCredentialsError);

      expect(repo.createAuditAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, failureReason: 'wrong_password' }),
      );
    });

    it('throws AccountDisabledError when account is inactive', async () => {
      const repo = makeMockRepo({
        findUserByEmail: vi.fn().mockResolvedValue(makeStubUser({ isActive: false })),
      });

      const service = new AuthService(repo);
      await expect(
        service.login('test@example.com', 'password123', {}),
      ).rejects.toThrow(AccountDisabledError);

      expect(repo.createAuditAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, failureReason: 'account_disabled' }),
      );
    });
  });

  // ─── logout() ──────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('calls revokeAllUserSessions with the correct userId', async () => {
      const repo = makeMockRepo();
      const service = new AuthService(repo);

      await service.logout(BigInt(42));

      expect(repo.revokeAllUserSessions).toHaveBeenCalledOnce();
      expect(repo.revokeAllUserSessions).toHaveBeenCalledWith(BigInt(42));
    });
  });

  // ─── refresh() ─────────────────────────────────────────────────────────────

  describe('refresh()', () => {
    it('returns new accessToken for a valid token with active session', async () => {
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
    });

    it('throws UnauthorizedError when JWT is invalid', async () => {
      mockedVerifyRefreshToken.mockReturnValue(null);

      const repo = makeMockRepo();
      const service = new AuthService(repo);

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedError);
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
  });

  // ─── getMe() ───────────────────────────────────────────────────────────────

  describe('getMe()', () => {
    it('returns full user profile with projects and permissions', async () => {
      const repo = makeMockRepo({
        findUserById: vi.fn().mockResolvedValue(makeStubUser()),
        findUserProjectRoles: vi.fn().mockResolvedValue([makeStubProjectRole()]),
      });
      const service = new AuthService(repo);

      const result = await service.getMe(BigInt(1));

      expect(result.userId).toBe('1');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('admin');
      expect(Array.isArray(result.projects)).toBe(true);
      expect(result.projects).toHaveLength(1);
      expect(Array.isArray(result.permissions)).toBe(true);
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
