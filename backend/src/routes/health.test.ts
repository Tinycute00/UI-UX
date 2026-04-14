import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../server.js';
import type { FastifyInstance } from 'fastify';

// 設定測試環境，避免 server.ts 底部的 start() 在測試時觸發
process.env['NODE_ENV'] = 'test';

describe('GET /api/v1/health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 OK', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return correct response body', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    const body = JSON.parse(response.body) as Record<string, unknown>;

    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
    // ISO8601 format check
    expect(() => new Date(body.timestamp as string)).not.toThrow();
    expect(new Date(body.timestamp as string).toISOString()).toBe(body.timestamp);
    expect(body.version).toBe('1.0.0');
  });

  it('should include X-Request-Id header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.headers['x-request-id']).toBeTruthy();
    expect(typeof response.headers['x-request-id']).toBe('string');
  });

  it('should include security headers from helmet', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    // Helmet should inject X-Frame-Options or x-frame-options
    const frameOptions =
      response.headers['x-frame-options'] ?? response.headers['X-Frame-Options'];
    expect(frameOptions).toBeTruthy();
  });

  it('should return 404 for unknown routes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/unknown-endpoint',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body) as Record<string, unknown>;
    expect(body.error).toBeTruthy();
  });
});
