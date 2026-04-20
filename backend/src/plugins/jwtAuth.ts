import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, type JwtAccessPayload } from '../utils/jwt.js';

// Extend FastifyRequest to include the decoded user payload
declare module 'fastify' {
  interface FastifyRequest {
    user: JwtAccessPayload;
  }
}

/**
 * Extract Bearer token from Authorization header or access_token cookie.
 */
function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // @fastify/cookie augments request.cookies at runtime; cast to access it
  const cookieToken = (request as FastifyRequest & { cookies: Record<string, string | undefined> }).cookies['access_token'];
  if (cookieToken) return cookieToken;
  return null;
}

/**
 * preHandler hook — use per-route to require authentication.
 * Attaches decoded payload to request.user on success.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = extractToken(request);
  if (!token) {
    void reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: '缺少認證 Token，請先登入' },
    });
    return;
  }
  const payload = verifyAccessToken(token);
  if (!payload) {
    void reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Token 無效或已過期，請重新登入' },
    });
    return;
  }
  request.user = payload;
}

/**
 * jwtAuthPlugin — registers the authenticate preHandler on the Fastify instance.
 * Use this plugin if you want instance-wide JWT validation (optional).
 * For per-route auth, import and use the `authenticate` hook directly.
 */
const jwtAuthPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', authenticate);
};

export default fp(jwtAuthPlugin, {
  name: 'jwtAuth',
  fastify: '5.x',
});
