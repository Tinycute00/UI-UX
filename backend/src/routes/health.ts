import type { FastifyPluginAsync } from 'fastify';

/**
 * Health Check Route
 * GET /api/v1/health
 *
 * 回傳 API 服務的健康狀態，供 load balancer、k8s probe 使用
 * 不依賴任何資料庫連線（BE-001 zero-DB requirement）
 */
const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/health',
    {
      schema: {
        description: '健康檢查端點',
        tags: ['System'],
        response: {
          200: {
            type: 'object',
            required: ['status', 'timestamp', 'version'],
            properties: {
              status: { type: 'string', enum: ['ok'] },
              timestamp: { type: 'string', format: 'date-time' },
              version: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      return {
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
    },
  );
};

export default healthRoute;
