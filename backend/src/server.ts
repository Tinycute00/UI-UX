import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from './config.js';
import requestIdPlugin from './plugins/requestId.js';
import healthRoute from './routes/health.js';
import authRoute from './routes/auth.js';

/**
 * 建立並設定 Fastify 應用程式
 * 匯出 build() 供測試與 server 主程式使用（App Factory Pattern）
 */
export async function build() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        config.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'HH:MM:ss Z' },
            }
          : undefined,
      // 每個 log 行自動帶上 requestId（由 genReqId 設定）
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            requestId: request.id,
          };
        },
      },
    },
    // Fastify 內建 request ID 生成（保留）
    genReqId: () => crypto.randomUUID(),
  });

  // ─── Plugins ──────────────────────────────────────────────────────────────

  // Security headers (X-Frame-Options, CSP, HSTS, etc.)
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // CORS
  await app.register(cors, {
    origin:
      config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  // httpOnly cookie support (for refresh token in BE-002)
  await app.register(cookie, {
    hook: 'onRequest',
  });

  // Custom request ID plugin (X-Request-Id header)
  await app.register(requestIdPlugin);

  // ─── Routes ───────────────────────────────────────────────────────────────

  // API v1 prefix
  await app.register(
    async (v1) => {
      await v1.register(healthRoute);
      await v1.register(authRoute, { prefix: '/auth' });
    },
    { prefix: '/api/v1' },
  );

  // ─── Global Error Handler ────────────────────────────────────────────────

  app.setErrorHandler((error: { statusCode?: number; message: string }, _request, reply) => {
    const statusCode = error.statusCode ?? 500;
    const code =
      statusCode === 400
        ? 'BAD_REQUEST'
        : statusCode === 401
          ? 'UNAUTHORIZED'
          : statusCode === 403
            ? 'FORBIDDEN'
            : statusCode === 404
              ? 'NOT_FOUND'
              : statusCode === 429
                ? 'RATE_LIMIT_EXCEEDED'
                : 'INTERNAL_SERVER_ERROR';

    app.log.error({ err: error, statusCode }, error.message);

    void reply.status(statusCode).send({
      error: {
        code,
        message: statusCode < 500 ? error.message : '伺服器發生錯誤，請稍後再試',
      },
    });
  });

  // 404 handler
  app.setNotFoundHandler((_request, reply) => {
    void reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: '找不到請求的資源',
      },
    });
  });

  return app;
}

/**
 * 啟動 HTTP 服務（僅在直接執行時調用）
 */
async function start() {
  const app = await build();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    app.log.info(`收到 ${signal}，開始優雅關閉...`);
    await app.close();
    app.log.info('服務已關閉');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    app.log.info(`🚀 Ta Chen PMIS API Server 啟動`);
    app.log.info(`   Port:        ${config.PORT}`);
    app.log.info(`   Environment: ${config.NODE_ENV}`);
    app.log.info(`   Health:      http://localhost:${config.PORT}/api/v1/health`);
  } catch (err: unknown) {
    app.log.error(err);
    process.exit(1);
  }
}

// 僅在非測試環境直接執行時啟動 HTTP server
if (config.NODE_ENV !== 'test') {
  void start();
}
