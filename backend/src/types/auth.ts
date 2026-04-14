import { z } from 'zod';

// ─── Domain Enums ─────────────────────────────────────────────────────────────

export type UserRoleType = 'admin' | 'supervisor' | 'vendor';

// ─── Domain Entity Types (aligned to DB-302 proposal) ────────────────────────

/**
 * AuthUser — maps to auth.users
 * DB_PENDING: populated from Prisma User model once live DB is ready
 */
export interface AuthUser {
  id: bigint;
  username: string;
  /** DB_PENDING: display_name / full_name column not yet in schema; using username as fallback */
  displayName?: string;
  email: string;
  passwordHash: string;
  role: UserRoleType;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AuthSession — maps to auth.sessions
 * DB_PENDING: populated from Prisma Session model once live DB is ready
 */
export interface AuthSession {
  id: bigint;
  userId: bigint;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  deviceInfo: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date;
}

/**
 * AuditLoginAttempt — maps to auth.audit_login_attempts
 * DB_PENDING: populated from Prisma AuditLoginAttempt model once live DB is ready
 */
export interface AuditLoginAttempt {
  id: bigint;
  username: string;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  failureReason: string | null;
  attemptedAt: Date;
}

/**
 * UserProjectRole — maps to auth.user_project_roles
 * DB_PENDING: populated from Prisma UserProjectRole model once live DB is ready
 */
export interface UserProjectRole {
  id: bigint;
  userId: bigint;
  projectId: bigint;
  role: UserRoleType;
  assignedAt: Date;
  assignedBy: bigint | null;
}

// ─── Service Input Types ──────────────────────────────────────────────────────

/** Input for creating a new session record */
export interface CreateSessionInput {
  userId: bigint;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, unknown>;
}

/** Input for creating an audit login attempt record */
export interface CreateAuditAttemptInput {
  username: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}

// ─── Request Schemas (Zod) — BE-307: aligned to contract ─────────────────────

/**
 * LoginBodySchema — BE-307: username (required) replaces email as primary field.
 * email is optional for future multi-field lookup support.
 * rememberMe added per contract.
 */
export const LoginBodySchema = z.object({
  /** 使用者帳號（員工編號或 email）*/
  username: z.string().min(1, 'Username is required'),
  /** 使用者密碼 */
  password: z.string().min(8, 'Password must be at least 8 characters'),
  /** 記住我（延長 token 有效期）*/
  rememberMe: z.boolean().optional(),
  /** Optional email — for future multi-field lookup; not required per contract */
  email: z.string().email('Invalid email format').optional(),
});

/**
 * RefreshBodySchema — BE-307: body token fallback removed.
 * Refresh token is read exclusively from httpOnly cookie per contract.
 * Schema kept as empty object to avoid breaking imports.
 */
export const RefreshBodySchema = z.object({}).strict();

// ─── Response Schemas (Zod) — BE-307: aligned to contract ────────────────────

export const ProjectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['admin', 'supervisor', 'vendor']),
});

/**
 * LoginUserSchema — BE-307: user object in login response per contract.
 */
export const LoginUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'supervisor', 'vendor']),
  /** DB_PENDING: populated from auth.user_project_roles once live DB is ready */
  projectIds: z.array(z.string()),
});

/**
 * LoginResponseSchema — BE-307: aligned to LoginResponseDTO in contract.
 * expiresAt replaces expiresIn (now Unix timestamp).
 * NOTE (DB_PENDING): user.projectIds populated from auth.user_project_roles once live DB is ready.
 */
export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  /** Unix timestamp (seconds) */
  expiresAt: z.number().int().positive(),
  user: LoginUserSchema,
});

/**
 * RefreshResponseSchema — BE-307: aligned to RefreshTokenResponseDTO in contract.
 */
export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  /** Unix timestamp (seconds) */
  expiresAt: z.number().int().positive(),
});

/**
 * LogoutResponseSchema — BE-307: aligned to LogoutResponseDTO in contract.
 */
export const LogoutResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  /** Number of sessions cleared */
  clearedSessions: z.number().int().nonnegative(),
});

/**
 * MeResponseSchema — BE-307: aligned to GetCurrentUserResponseDTO in contract.
 * userId → id, name → displayName; added username, createdAt, lastLoginAt.
 */
export const MeResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'supervisor', 'vendor']),
  projects: z.array(ProjectSummarySchema),
  permissions: z.array(z.string()),
  /** ISO 8601 string — DB_PENDING: from auth.users.created_at */
  createdAt: z.string(),
  /** ISO 8601 string — DB_PENDING: from auth.users.last_login_at; always populated by runtime */
  lastLoginAt: z.string(),
});

/**
 * AuthTokensSchema — kept for legacy / internal use; new endpoints use
 * LoginResponseSchema / RefreshResponseSchema which use expiresAt.
 */
export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  /** Unix timestamp (seconds) */
  expiresAt: z.number().int().positive(),
});

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type LoginBody = z.infer<typeof LoginBodySchema>;
export type RefreshBody = z.infer<typeof RefreshBodySchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;
export type LoginUser = z.infer<typeof LoginUserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
