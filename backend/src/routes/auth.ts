import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { LoginBodySchema, RefreshBodySchema } from '../types/auth.js';
import { authenticate } from '../plugins/jwtAuth.js';
import { config } from '../config.js';
import { AuthRepositoryStub } from '../repositories/auth.repository.js';
import { AuthService } from '../services/auth.service.js';
import { AuthError } from '../errors/auth.errors.js';

type RequestWithCookies = FastifyRequest & { cookies: Record<string, string | undefined> };
type ReplyWithCookie = { setCookie(name: string, value: string, opts: object): void };

// ─── Instantiate repo + service ───────────────────────────────────────────────
// DB_PENDING: Replace AuthRepositoryStub with PrismaAuthRepository once live DB is ready
const repo = new AuthRepositoryStub();
const authService = new AuthService(repo);

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

    const { email, password } = parseResult.data;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];

    try {
      const result = await authService.login(email, password, {
        ip,
        userAgent,
      });

      // Set refresh token as httpOnly cookie
      void (reply as unknown as ReplyWithCookie).setCookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: config.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60,
        path: '/api/v1/auth',
      });

      return reply.status(200).send({
        accessToken: result.accessToken,
        tokenType: result.tokenType,
        expiresIn: result.expiresIn,
        // DB_PENDING: stub data — remove _stub after PrismaAuthRepository is connected
        _stub: 'DB_PENDING: auth.users lookup uses AuthRepositoryStub; real password hash comparison pending live DB',
      });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ─── POST /logout ─────────────────────────────────────────────────────────
  fastify.post('/logout', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = BigInt(request.user.userId);
      await authService.logout(userId);

      // Clear the refresh token cookie
      void (reply as unknown as ReplyWithCookie).setCookie('refresh_token', '', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/api/v1/auth',
      });

      return reply.status(200).send({
        message: 'logged out',
        // DB_PENDING: session revocation uses AuthRepositoryStub
        _stub: 'DB_PENDING: auth.sessions revocation pending live DB',
      });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ─── POST /refresh ────────────────────────────────────────────────────────
  fastify.post('/refresh', async (request, reply) => {
    const cookieToken = (request as unknown as RequestWithCookies).cookies['refresh_token'];
    const parseResult = RefreshBodySchema.safeParse(request.body);
    const bodyToken = parseResult.success ? parseResult.data.refreshToken : undefined;
    const rawToken = cookieToken ?? bodyToken;

    if (!rawToken) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: '缺少 Refresh Token' },
      });
    }

    try {
      const result = await authService.refresh(rawToken);

      return reply.status(200).send({
        accessToken: result.accessToken,
        tokenType: result.tokenType,
        expiresIn: result.expiresIn,
        // DB_PENDING: session validation uses AuthRepositoryStub
        _stub: 'DB_PENDING: auth.sessions hash lookup pending live DB; JWT signature is validated',
      });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ─── GET /me ──────────────────────────────────────────────────────────────
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = BigInt(request.user.userId);
      const result = await authService.getMe(userId);

      return reply.status(200).send({
        ...result,
        // DB_PENDING: user data & project roles use AuthRepositoryStub
        _stub: 'DB_PENDING: real user profile from auth.users; project names pending project.projects JOIN',
      });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });
};

export default authRoutes;
