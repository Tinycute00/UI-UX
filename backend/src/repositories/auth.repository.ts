/**
 * Auth Repository — BE-002 (updated BE-307: contract-aligned stub)
 *
 * Defines the IAuthRepository interface (data access contract) and
 * AuthRepositoryStub (hardcoded stub implementation for pre-DB-migration use).
 *
 * DB_PENDING: IAuthRepository methods will be replaced with PrismaAuthRepository
 *             once live DB migration (auth schema) is applied and service account
 *             GRANTS are configured per DB-302 proposal.
 *
 * BE-307 changes:
 *   - Added findUserByUsername() to interface and stub
 *   - revokeAllUserSessions() now returns { count: number } instead of void
 *   - Stub user includes displayName field
 */

import type {
  AuthUser,
  AuthSession,
  UserProjectRole,
  CreateSessionInput,
  CreateAuditAttemptInput,
} from '../types/auth.js';

// ─── Repository Interface (Contract) ──────────────────────────────────────────

/**
 * IAuthRepository — data access contract for auth domain.
 * All methods are DB_PENDING until Prisma client is connected to a live DB.
 */
export interface IAuthRepository {
  /** Find a user record by username (primary lookup per contract) */
  findUserByUsername(username: string): Promise<AuthUser | null>;

  /** Find a user record by email address */
  findUserByEmail(email: string): Promise<AuthUser | null>;

  /** Find a user record by primary key */
  findUserById(id: bigint): Promise<AuthUser | null>;

  /** Update last_login_at timestamp for a user */
  updateUserLastLogin(userId: bigint, loginAt: Date): Promise<void>;

  /** Create a new session record (on successful login) */
  createSession(data: CreateSessionInput): Promise<AuthSession>;

  /** Find an active session by refresh_token_hash */
  findSessionByTokenHash(hash: string): Promise<AuthSession | null>;

  /** Mark a single session as revoked */
  revokeSession(sessionId: bigint, revokedAt: Date): Promise<void>;

  /**
   * Revoke all sessions belonging to a user (e.g. logout-all).
   * BE-307: returns { count: number } so route can report clearedSessions.
   */
  revokeAllUserSessions(userId: bigint): Promise<{ count: number }>;

  /** Delete sessions that have expired before the given date. Returns count deleted. */
  cleanExpiredSessions(before: Date): Promise<number>;

  /** Insert a login attempt audit record */
  createAuditAttempt(data: CreateAuditAttemptInput): Promise<void>;

  /** Fetch all project-role associations for a user (for /auth/me) */
  findUserProjectRoles(userId: bigint): Promise<UserProjectRole[]>;
}

// ─── Stub Implementation ──────────────────────────────────────────────────────

const STUB_USER_ID = BigInt(1);
const STUB_SESSION_ID = BigInt(1);

/**
 * AuthRepositoryStub
 *
 * Hardcoded stub implementation of IAuthRepository.
 * Returns predictable test data so the service/route layer can run end-to-end
 * without a real database connection.
 *
 * DB_PENDING: Replace with PrismaAuthRepository once:
 *   1. auth schema migration is applied to PostgreSQL
 *   2. Backend service account GRANTS are configured per DB-302 §6
 *   3. DATABASE_URL is pointed at the live DB
 */
export class AuthRepositoryStub implements IAuthRepository {
  // Hardcoded stub credentials — STUB only, not real data
  private readonly stubPasswordHash =
    '$2b$12$stubHashForTestingDoNotUseInProduction000000000000000000';

  async findUserByUsername(username: string): Promise<AuthUser | null> {
    // DB_PENDING: SELECT * FROM auth.users WHERE username = $1
    if (username === 'stub_user') {
      return this._stubUser();
    }
    return null;
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    // DB_PENDING: SELECT * FROM auth.users WHERE email = $1
    if (email === 'stub@example.com') {
      return this._stubUser();
    }
    return null;
  }

  async findUserById(id: bigint): Promise<AuthUser | null> {
    // DB_PENDING: SELECT * FROM auth.users WHERE user_id = $1
    if (id === STUB_USER_ID) {
      return this._stubUser();
    }
    return null;
  }

  async updateUserLastLogin(_userId: bigint, _loginAt: Date): Promise<void> {
    // DB_PENDING: UPDATE auth.users SET last_login_at = $2 WHERE user_id = $1
    return;
  }

  async createSession(data: CreateSessionInput): Promise<AuthSession> {
    // DB_PENDING: INSERT INTO auth.sessions (...) VALUES (...) RETURNING *
    return {
      id: STUB_SESSION_ID,
      userId: data.userId,
      refreshTokenHash: data.refreshTokenHash,
      expiresAt: data.expiresAt,
      revokedAt: null,
      deviceInfo: data.deviceInfo ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    };
  }

  async findSessionByTokenHash(hash: string): Promise<AuthSession | null> {
    // DB_PENDING: SELECT * FROM auth.sessions WHERE refresh_token_hash = $1
    if (hash === 'stub-token-hash') {
      return {
        id: STUB_SESSION_ID,
        userId: STUB_USER_ID,
        refreshTokenHash: hash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        deviceInfo: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };
    }
    return null;
  }

  async revokeSession(_sessionId: bigint, _revokedAt: Date): Promise<void> {
    // DB_PENDING: UPDATE auth.sessions SET revoked_at = $2 WHERE session_id = $1
    return;
  }

  async revokeAllUserSessions(_userId: bigint): Promise<{ count: number }> {
    // DB_PENDING: UPDATE auth.sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL
    // Stub returns count=1 to indicate the single stub session was cleared
    return { count: 1 };
  }

  async cleanExpiredSessions(_before: Date): Promise<number> {
    // DB_PENDING: DELETE FROM auth.sessions WHERE expires_at < $1 RETURNING count
    return 0;
  }

  async createAuditAttempt(_data: CreateAuditAttemptInput): Promise<void> {
    // DB_PENDING: INSERT INTO auth.audit_login_attempts (...) VALUES (...)
    return;
  }

  async findUserProjectRoles(userId: bigint): Promise<UserProjectRole[]> {
    // DB_PENDING: SELECT * FROM auth.user_project_roles WHERE user_id = $1
    if (userId === STUB_USER_ID) {
      return [
        {
          id: BigInt(1),
          userId,
          projectId: BigInt(101),
          role: 'admin',
          assignedAt: new Date(),
          assignedBy: null,
        },
      ];
    }
    return [];
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private _stubUser(): AuthUser {
    return {
      id: STUB_USER_ID,
      username: 'stub_user',
      displayName: 'Stub User', // DB_PENDING: from auth.users.display_name column
      email: 'stub@example.com',
      passwordHash: this.stubPasswordHash,
      role: 'admin',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };
  }
}
