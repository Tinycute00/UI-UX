import { z } from 'zod';

// ─── Request Schemas ──────────────────────────────────────────────────────────

export const LoginBodySchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RefreshBodySchema = z.object({
  /** Optional: refresh token in body (cookie-based is preferred) */
  refreshToken: z.string().optional(),
});

// ─── Response Schemas ─────────────────────────────────────────────────────────

export const MeResponseSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  role: z.string(),
  name: z.string(),
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
