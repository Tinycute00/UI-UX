/**
 * AuthService — BE-002 (updated BE-307: contract-aligned)
 *
 * Encapsulates login / logout / refresh / getMe business logic.
 * Depends on IAuthRepository (injected) and JWT/password utilities.
 *
 * DB_PENDING: When IAuthRepository is replaced with PrismaAuthRepository,
 *             all stub behaviour below switches to real DB reads/writes.
 *
 * BE-307 changes:
 *   - login() now accepts username (not email) as primary identifier
 *   - LoginResult: expiresIn → expiresAt (Unix timestamp); added user object
 *   - logout() now returns Promise<{ clearedSessions: number }>
 *   - RefreshResult: expiresIn → expiresAt (Unix timestamp)
 *   - MeResult: userId → id; name → displayName; added username, createdAt, lastLoginAt
 */

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
  RefreshTokenInvalidError,
  RefreshTokenReusedError,
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

/** BE-307: user sub-object in login response, aligned to LoginResponseDTO */
export interface LoginResultUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'admin' | 'supervisor' | 'vendor';
  /** DB_PENDING: populated from auth.user_project_roles once live DB is ready */
  projectIds: string[];
}

/** BE-307: aligned to LoginResponseDTO — expiresAt replaces expiresIn */
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  /** Unix timestamp (seconds) when access token expires */
  expiresAt: number;
  user: LoginResultUser;
}

/** BE-307: aligned to RefreshTokenResponseDTO — expiresAt replaces expiresIn */
export interface RefreshResult {
  accessToken: string;
  tokenType: 'Bearer';
  /** Unix timestamp (seconds) when access token expires */
  expiresAt: number;
}

/** BE-307: aligned to GetCurrentUserResponseDTO */
export interface MeResult {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  projects: ProjectSummary[];
  permissions: string[];
  /** ISO 8601 string — DB_PENDING: from auth.users.created_at */
  createdAt: string;
  /** ISO 8601 string or null — DB_PENDING: from auth.users.last_login_at */
  lastLoginAt: string;
}

// ─── AuthService ───────────────────────────────────────────────────────────────

/**
 * Module-level set to track revoked JWT IDs (jti) for REFRESH_TOKEN_REUSED detection.
 * DB_PENDING: Replace with persistent auth.revoked_tokens table lookup once live DB is ready.
 * This in-memory set is reset on server restart — acceptable for stub baseline QA.
 */
const _revokedRefreshJtis = new Set<string>();

export class AuthService {
  constructor(private readonly repo: IAuthRepository) {}

  /**
   * Login: validate credentials, create session, issue tokens.
   *
   * BE-307: primary identifier changed from email to username per contract.
   * rememberMe parameter accepted (DB_PENDING: extend session TTL when live).
   *
   * DB_PENDING: findUserByUsername / comparePassword against real auth.users.password_hash
   *             createSession writes to auth.sessions
   *             createAuditAttempt writes to auth.audit_login_attempts
   */
  async login(
    username: string,
    password: string,
    ctx: LoginContext = {},
    _rememberMe?: boolean,
  ): Promise<LoginResult> {
    // 1. Look up user by username
    // DB_PENDING: SELECT * FROM auth.users WHERE username = $1
    const user = await this.repo.findUserByUsername(username);

    if (!user) {
      // Write audit record before throwing (constant-time defence against enumeration)
      await this.repo.createAuditAttempt({
        username,
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
        failureReason: 'account_locked',
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

    // 9. Compute expiresAt as Unix timestamp (seconds)
    const accessExpiresAt = Math.floor(Date.now() / 1000) + config.JWT_ACCESS_EXPIRES_MINUTES * 60;

    // 10. Build user object for response
    // DB_PENDING: projectIds from auth.user_project_roles
    const projectRoles = await this.repo.findUserProjectRoles(user.id);
    const projectIds = projectRoles.map((pr) => pr.projectId.toString());

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresAt: accessExpiresAt,
      user: {
        id: userId,
        username: user.username,
        displayName: user.displayName ?? user.username, // DB_PENDING: use display_name column
        email: user.email,
        role: user.role,
        projectIds,
      },
    };
  }

  /**
   * Logout: revoke sessions for user.
   *
   * BE-307: returns { clearedSessions: number } per LogoutResponseDTO contract.
   * DB_PENDING: revokeAllUserSessions updates auth.sessions.revoked_at
   *
   * BE-312: records all active refresh token hashes as revoked in _revokedRefreshJtis
   * so that subsequent /refresh calls with the same token trigger REFRESH_TOKEN_REUSED.
   * DB_PENDING: replace Set with persistent revoked_tokens table once live DB is ready.
   */
  async logout(userId: bigint, rawRefreshToken?: string): Promise<{ clearedSessions: number }> {
    // DB_PENDING: revokes all active sessions in auth.sessions
    const { count } = await this.repo.revokeAllUserSessions(userId);

    // BE-312: mark the refresh token hash as revoked for reuse detection
    if (rawRefreshToken) {
      const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
      _revokedRefreshJtis.add(tokenHash);
    }

    return { clearedSessions: count };
  }

  /**
   * Refresh: validate refresh token, issue new access token.
   *
   * BE-307: body token fallback removed — cookie-only per contract.
   *         UNAUTHORIZED replaced with REFRESH_TOKEN_INVALID error.
   *         expiresIn → expiresAt (Unix timestamp).
   *
   * DB_PENDING: findSessionByTokenHash queries auth.sessions
   */
  async refresh(rawToken: string): Promise<RefreshResult> {
    // 1. Verify JWT signature
    const payload = verifyRefreshToken(rawToken);
    if (!payload) {
      throw new RefreshTokenInvalidError();
    }

    // 2. Hash the incoming token and look up session
    // DB_PENDING: queries auth.sessions WHERE refresh_token_hash = hash
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    // BE-312: Check if token hash is in the revoked set (reuse detection)
    // DB_PENDING: replace with SELECT FROM auth.revoked_tokens WHERE hash = $1 once live DB is ready
    if (_revokedRefreshJtis.has(tokenHash)) {
      // Revoke all sessions for this user as a security measure (token theft response)
      // DB_PENDING: revokeAllUserSessions persists to auth.sessions when live DB is connected
      await this.repo.revokeAllUserSessions(BigInt(payload.userId));
      throw new RefreshTokenReusedError();
    }

    const session = await this.repo.findSessionByTokenHash(tokenHash);

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

    // 5. Compute expiresAt as Unix timestamp (seconds)
    const accessExpiresAt = Math.floor(Date.now() / 1000) + config.JWT_ACCESS_EXPIRES_MINUTES * 60;

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresAt: accessExpiresAt,
    };
  }

  /**
   * GetMe: fetch user profile and project roles.
   *
   * BE-307: response shape aligned to GetCurrentUserResponseDTO.
   *   - userId → id
   *   - name → displayName
   *   - added: username, createdAt, lastLoginAt
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
      id: user.id.toString(),
      username: user.username,
      displayName: user.displayName ?? user.username, // DB_PENDING: use display_name column
      email: user.email,
      role: user.role,
      projects,
      permissions,
      createdAt: user.createdAt.toISOString(),
      // DB_PENDING: real lastLoginAt from auth.users.last_login_at; stub fallback to epoch string
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : new Date(0).toISOString(),
    };
  }
}
