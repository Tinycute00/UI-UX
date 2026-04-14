/**
 * AuthService — BE-002
 *
 * Encapsulates login / logout / refresh / getMe business logic.
 * Depends on IAuthRepository (injected) and JWT/password utilities.
 *
 * DB_PENDING: When IAuthRepository is replaced with PrismaAuthRepository,
 *             all stub behaviour below switches to real DB reads/writes.
 */

import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { comparePassword } from '../utils/password.js';
import { config } from '../config.js';
import type { IAuthRepository } from '../repositories/auth.repository.js';
import type { ProjectSummary } from '../types/auth.js';
import {
  InvalidCredentialsError,
  AccountDisabledError,
  SessionExpiredError,
  SessionRevokedError,
  UnauthorizedError,
} from '../errors/auth.errors.js';

// ─── Permission Map ────────────────────────────────────────────────────────────
// DB_PENDING: Replace with DB-driven permission lookup once auth.roles is live

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['projects:read', 'projects:write', 'users:read', 'users:write', 'reports:read'],
  supervisor: ['projects:read', 'projects:write', 'reports:read'],
  vendor: ['projects:read'],
};

// ─── Context Types ─────────────────────────────────────────────────────────────

export interface LoginContext {
  ip?: string;
  userAgent?: string;
  deviceInfo?: Record<string, unknown>;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface RefreshResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface MeResult {
  userId: string;
  email: string;
  role: string;
  name: string;
  projects: ProjectSummary[];
  permissions: string[];
}

// ─── AuthService ───────────────────────────────────────────────────────────────

export class AuthService {
  constructor(private readonly repo: IAuthRepository) {}

  /**
   * Login: validate credentials, create session, issue tokens.
   *
   * DB_PENDING: findUserByEmail / comparePassword against real auth.users.password_hash
   *             createSession writes to auth.sessions
   *             createAuditAttempt writes to auth.audit_login_attempts
   */
  async login(email: string, password: string, ctx: LoginContext = {}): Promise<LoginResult> {
    // 1. Look up user
    const user = await this.repo.findUserByEmail(email);

    if (!user) {
      // Write audit record before throwing (constant-time defence against enumeration)
      await this.repo.createAuditAttempt({
        username: email,
        email,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        success: false,
        failureReason: 'user_not_found',
      });
      throw new InvalidCredentialsError();
    }

    // 2. Check account status
    if (!user.isActive) {
      await this.repo.createAuditAttempt({
        username: user.username,
        email: user.email,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        success: false,
        failureReason: 'account_disabled',
      });
      throw new AccountDisabledError();
    }

    // 3. Verify password
    // DB_PENDING: comparePassword runs against real bcrypt hash from auth.users
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      await this.repo.createAuditAttempt({
        username: user.username,
        email: user.email,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        success: false,
        failureReason: 'wrong_password',
      });
      throw new InvalidCredentialsError();
    }

    // 4. Issue tokens
    const userId = user.id.toString();
    const accessToken = signAccessToken({ userId, role: user.role });
    const refreshToken = signRefreshToken({ userId });

    // 5. Hash refresh token for storage (never store plaintext)
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(
      Date.now() + config.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    );

    // 6. Persist session
    // DB_PENDING: inserts into auth.sessions
    await this.repo.createSession({
      userId: user.id,
      refreshTokenHash: tokenHash,
      expiresAt,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
      deviceInfo: ctx.deviceInfo,
    });

    // 7. Update last_login_at
    // DB_PENDING: updates auth.users.last_login_at
    await this.repo.updateUserLastLogin(user.id, new Date());

    // 8. Write success audit
    await this.repo.createAuditAttempt({
      username: user.username,
      email: user.email,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
      success: true,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: config.JWT_ACCESS_EXPIRES_MINUTES * 60,
    };
  }

  /**
   * Logout: revoke sessions for user.
   *
   * DB_PENDING: revokeAllUserSessions updates auth.sessions.revoked_at
   */
  async logout(userId: bigint): Promise<void> {
    // DB_PENDING: revokes all active sessions in auth.sessions
    await this.repo.revokeAllUserSessions(userId);
  }

  /**
   * Refresh: validate refresh token hash against DB session, issue new access token.
   *
   * DB_PENDING: findSessionByTokenHash queries auth.sessions
   */
  async refresh(rawToken: string): Promise<RefreshResult> {
    // 1. Verify JWT signature
    const payload = verifyRefreshToken(rawToken);
    if (!payload) {
      throw new UnauthorizedError('Refresh Token 無效或已過期，請重新登入');
    }

    // 2. Hash the incoming token and look up session
    // DB_PENDING: queries auth.sessions WHERE refresh_token_hash = hash
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const session = await this.repo.findSessionByTokenHash(tokenHash);

    if (!session) {
      // Stub path: findSessionByTokenHash only matches 'stub-token-hash',
      // so for JWT-based tokens we fall through here.
      // DB_PENDING: real implementation will find the session via hash lookup
    }

    if (session) {
      // 3a. Check revocation
      if (session.revokedAt !== null) {
        throw new SessionRevokedError();
      }

      // 3b. Check expiry
      if (session.expiresAt < new Date()) {
        throw new SessionExpiredError();
      }
    }
    // DB_PENDING: if session is null, we still honour the JWT signature for now
    // Remove this fallthrough once PrismaAuthRepository is connected

    // 4. Issue new access token
    const accessToken = signAccessToken({
      userId: payload.userId,
      role: 'user', // DB_PENDING: fetch real role from auth.users
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: config.JWT_ACCESS_EXPIRES_MINUTES * 60,
    };
  }

  /**
   * GetMe: fetch user profile and project roles.
   *
   * DB_PENDING: findUserById queries auth.users
   *             findUserProjectRoles queries auth.user_project_roles
   *             project names require JOIN with project.projects
   */
  async getMe(userId: bigint): Promise<MeResult> {
    // DB_PENDING: queries auth.users WHERE user_id = userId
    const user = await this.repo.findUserById(userId);

    if (!user) {
      throw new UnauthorizedError('找不到使用者，請重新登入');
    }

    // DB_PENDING: queries auth.user_project_roles + JOIN project.projects
    const projectRoles = await this.repo.findUserProjectRoles(userId);

    const projects: ProjectSummary[] = projectRoles.map((pr) => ({
      id: pr.projectId.toString(),
      name: `Project-${pr.projectId}`, // DB_PENDING: replace with project.projects.name
      role: pr.role,
    }));

    const permissions = ROLE_PERMISSIONS[user.role] ?? [];

    return {
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.username, // DB_PENDING: use display_name / full_name when added to schema
      projects,
      permissions,
    };
  }
}
