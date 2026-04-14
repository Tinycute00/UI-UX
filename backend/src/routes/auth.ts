import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { LoginBodySchema, RefreshBodySchema } from '../types/auth.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { authenticate } from '../plugins/jwtAuth.js';
import { config } from '../config.js';

type RequestWithCookies = FastifyRequest & { cookies: Record<string, string | undefined> };
type ReplyWithCookie = { setCookie(name: string, value: string, opts: object): void };

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── POST /login ────────────────────────────────────────────────────────────
  fastify.post('/login', async (request, reply) => {
    // Validate request body
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

    const { email } = parseResult.data;

    // TODO (DB_PENDING): Query database for user by email
    //   const user = await db.user.findUnique({ where: { email } });
    //   if (!user) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: '帳號或密碼錯誤' } });

    // TODO (DB_PENDING): Compare password
    //   const valid = await comparePassword(password, user.passwordHash);
    //   if (!valid) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: '帳號或密碼錯誤' } });

    // STUB: Return placeholder tokens until Prisma schema is ready
    const stubUserId = 'stub-user-id';
    const stubRole = 'user';

    const accessToken = signAccessToken({ userId: stubUserId, role: stubRole });
    const refreshToken = signRefreshToken({ userId: stubUserId });

    // Set refresh token as httpOnly cookie
    void (reply as unknown as ReplyWithCookie).setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: config.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60,
      path: '/api/v1/auth',
    });

    return reply.status(200).send({
      accessToken,
      tokenType: 'Bearer' as const,
      expiresIn: config.JWT_ACCESS_EXPIRES_MINUTES * 60,
      // DB_PENDING: remove this message after Prisma schema is ready
      _stub: 'DB_PENDING: real user lookup & password comparison waiting for Prisma schema',
      _email: email,
    });
  });

  // ─── POST /logout ───────────────────────────────────────────────────────────
  fastify.post('/logout', { preHandler: authenticate }, async (_request, reply) => {
    // TODO (DB_PENDING): Invalidate session / refresh token in DB
    //   await db.session.delete({ where: { userId: request.user.userId } });

    // Clear the refresh token cookie
    void (reply as unknown as ReplyWithCookie).setCookie('refresh_token', '', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/api/v1/auth',
    });

    return reply.status(200).send({ message: 'logged out' });
  });

  // ─── POST /refresh ──────────────────────────────────────────────────────────
  fastify.post('/refresh', async (request, reply) => {
    // Read refresh token from cookie (preferred) or body
    const cookieToken = (request as unknown as RequestWithCookies).cookies['refresh_token'];
    const parseResult = RefreshBodySchema.safeParse(request.body);
    const bodyToken = parseResult.success ? parseResult.data.refreshToken : undefined;
    const token = cookieToken ?? bodyToken;

    if (!token) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: '缺少 Refresh Token' },
      });
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Refresh Token 無效或已過期，請重新登入' },
      });
    }

    // TODO (DB_PENDING): Validate session in DB (check token not revoked)
    //   const session = await db.session.findUnique({ where: { userId: payload.userId } });
    //   if (!session || session.refreshToken !== token) { ... }

    // STUB: Issue new access token with stub role
    const newAccessToken = signAccessToken({ userId: payload.userId, role: 'user' });

    return reply.status(200).send({
      accessToken: newAccessToken,
      tokenType: 'Bearer' as const,
      expiresIn: config.JWT_ACCESS_EXPIRES_MINUTES * 60,
      _stub: 'DB_PENDING: session validation against DB waiting for Prisma schema',
    });
  });

  // ─── GET /me ────────────────────────────────────────────────────────────────
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    // TODO (DB_PENDING): Fetch full user record from DB
    //   const user = await db.user.findUnique({ where: { id: request.user.userId } });
    //   return reply.status(200).send({ userId: user.id, email: user.email, role: user.role, name: user.name });

    // STUB: Return decoded token payload until Prisma schema is ready
    return reply.status(200).send({
      userId: request.user.userId,
      role: request.user.role,
      _stub: 'DB_PENDING: full user data (email, name, etc.) waiting for Prisma schema',
    });
  });
};

export default authRoutes;
