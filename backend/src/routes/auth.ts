import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { LoginBodySchema } from '../types/auth.js';
import { authenticate } from '../plugins/jwtAuth.js';
import { config } from '../config.js';
import { AuthRepositoryStub } from '../repositories/auth.repository.js';
import { AuthService } from '../services/auth.service.js';
import { AuthError } from '../errors/auth.errors.js';

/**
 * Auth Routes — BE-002 (updated BE-307: contract-aligned)
 *
 * BE-307 changes:
 *   - /login: uses username (not email), returns expiresAt + user object
 *   - /logout: returns { success, message, clearedSessions }
 *   - /refresh: cookie-only (body fallback removed), returns expiresAt,
 *               uses RefreshTokenInvalidError
 *   - /me: returns id/username/displayName/createdAt/lastLoginAt
 */

type RequestWithCookies = FastifyRequest & { cookies: Record<string, string | undefined> };
type ReplyWithCookie = { setCookie(name: string, value: string, opts: object): void };

// ─── Instantiate repo + service ───────────────────────────────────────────────
// DB_PENDING: Replace AuthRepositoryStub with PrismaAuthRepository once live DB is ready
const repo = new AuthRepositoryStub();
const authService = new AuthService(repo);

// ─── Logout request schema ────────────────────────────────────────────────────
const LogoutBodySchema = z.object({
  logoutAllDevices: z.boolean().optional(),
});

// ─── Helper: map AuthError to reply ──────────────────────────────────────────

function handleAuthError(err: unknown, reply: { status: (code: number) => { send: (body: unknown) => unknown } }) {
  if (err instanceof AuthError) {
    return reply.status(err.statusCode).send({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }
  // Re-throw unexpected errors to Fastify default error handler
  throw err;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── POST /login ─────────────────────────────────────────────────────────
  // BE-307: username (required) + rememberMe (optional) per contract
  fastify.post('/login', async (request, reply) => {
    const parseResult = LoginBodySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: '請求格式錯誤',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const { username, password, rememberMe } = parseResult.data;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];

    try {
      const result = await authService.login(username, password, { ip, userAgent }, rememberMe);

      // Set refresh token as httpOnly cookie
      void (reply as unknown as ReplyWithCookie).setCookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: config.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60,
        path: '/api/v1/auth',
      });

      // BE-307: response aligned to LoginResponseDTO — expiresAt + user object
      return reply.status(200).send({
        accessToken: result.accessToken,
        tokenType: result.tokenType,
        expiresAt: result.expiresAt,
        user: result.user,
        // DB_PENDING: auth.users lookup uses AuthRepositoryStub; real password hash comparison pending live DB
      });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ─── POST /logout ─────────────────────────────────────────────────────────
  // BE-307: returns { success: true, message, clearedSessions } per contract
  fastify.post('/logout', { preHandler: authenticate }, async (request, reply) => {
    // Accept logoutAllDevices (currently always logs out all sessions in stub)
    // DB_PENDING: honour logoutAllDevices flag to selectively revoke sessions
    const _parseResult = LogoutBodySchema.safeParse(request.body);

    try {
      const userId = BigInt(request.user.userId);
      // BE-312: pass raw refresh token to service for reuse detection tracking
      const rawRefreshToken = (request as unknown as RequestWithCookies).cookies['refresh_token'];
      const { clearedSessions } = await authService.logout(userId, rawRefreshToken);

      // Clear the refresh token cookie
      void (reply as unknown as ReplyWithCookie).setCookie('refresh_token', '', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/api/v1/auth',
      });

      return reply.status(200).send({
        success: true as const,
        message: '登出成功',
        clearedSessions,
        // DB_PENDING: session revocation uses AuthRepositoryStub
      });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ─── POST /refresh ────────────────────────────────────────────────────────
  // BE-307: body token fallback removed — cookie-only per contract
  //         uses RefreshTokenInvalidError instead of generic UNAUTHORIZED
  //         returns expiresAt (Unix timestamp) instead of expiresIn
  fastify.post('/refresh', async (request, reply) => {
    // Read refresh token exclusively from httpOnly cookie
    const rawToken = (request as unknown as RequestWithCookies).cookies['refresh_token'];

    if (!rawToken) {
      return reply.status(401).send({
        error: { code: 'REFRESH_TOKEN_INVALID', message: '缺少 Refresh Token，請重新登入' },
      });
    }

    try {
      const result = await authService.refresh(rawToken);

      return reply.status(200).send({
        accessToken: result.accessToken,
        tokenType: result.tokenType,
        expiresAt: result.expiresAt,
        // DB_PENDING: session validation uses AuthRepositoryStub; JWT signature is validated
      });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ─── GET /me ──────────────────────────────────────────────────────────────
  // BE-307: returns id/username/displayName/createdAt/lastLoginAt per contract
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = BigInt(request.user.userId);
      const result = await authService.getMe(userId);

      return reply.status(200).send({
        ...result,
        // DB_PENDING: user data & project roles use AuthRepositoryStub
      });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });
};

export default authRoutes;
