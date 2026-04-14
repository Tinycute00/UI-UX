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

// ─── Request Schemas (Zod) ────────────────────────────────────────────────────

export const LoginBodySchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(1).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RefreshBodySchema = z.object({
  /** Optional: refresh token in body (cookie-based is preferred) */
  refreshToken: z.string().optional(),
});

// ─── Response Schemas (Zod) ───────────────────────────────────────────────────

export const ProjectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
});

export const MeResponseSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  role: z.string(),
  name: z.string(),
  projects: z.array(ProjectSummarySchema),
  permissions: z.array(z.string()),
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
});

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type LoginBody = z.infer<typeof LoginBodySchema>;
export type RefreshBody = z.infer<typeof RefreshBodySchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;
