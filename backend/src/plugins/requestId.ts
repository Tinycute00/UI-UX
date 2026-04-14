import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

/**
 * Request ID Plugin
 * 為每個進入的請求產生唯一 request ID，
 * 加入 X-Request-Id response header，並掛載到 request 物件供後續使用
 */
const requestIdPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('requestId', '');

  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    // 優先使用前端傳入的 X-Request-Id，否則產生新的
    const incoming = request.headers['x-request-id'];
    const reqId =
      typeof incoming === 'string' && incoming.length > 0
        ? incoming
        : crypto.randomUUID();

    request.requestId = reqId;
  });

  fastify.addHook('onSend', async (request: FastifyRequest, reply) => {
    void reply.header('X-Request-Id', request.requestId);
  });
};

export default fp(requestIdPlugin, {
  name: 'request-id',
  fastify: '5.x',
});
