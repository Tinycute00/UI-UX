import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../plugins/jwtAuth.js';

/**
 * Valuations Routes — BE-004 stub
 *
 * Provides valuation (計價) endpoints. Currently in stub/contract mode to unblock
 * frontend FE-004. All data is in-memory until DB migration is ready.
 *
 * DB_PENDING: Replace stub data with Prisma queries once valuations schema is migrated.
 *
 * Registered at: /api/v1/valuations
 */

// ─── Query schema ─────────────────────────────────────────────────────────────
const ValuationsQuerySchema = z.object({
  projectId: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  status: z
    .enum(['draft', 'submitted', 'approved', 'rejected'])
    .optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 20)),
});

// ─── Stub data ────────────────────────────────────────────────────────────────
const STUB_VALUATIONS = [
  {
    valuationId: 1,
    projectId: 101,
    projectName: '台中辦公大樓新建工程',
    period: '2025-01',
    amount: 4250000,
    status: 'approved',
    submittedAt: '2025-01-31T12:00:00Z',
    approvedAt: '2025-02-05T09:30:00Z',
    submittedBy: { userId: 1, username: 'pm_wang', displayName: '王專案' },
  },
  {
    valuationId: 2,
    projectId: 101,
    projectName: '台中辦公大樓新建工程',
    period: '2025-02',
    amount: 3800000,
    status: 'submitted',
    submittedAt: '2025-02-28T17:45:00Z',
    approvedAt: null,
    submittedBy: { userId: 1, username: 'pm_wang', displayName: '王專案' },
  },
  {
    valuationId: 3,
    projectId: 102,
    projectName: '台南廠房擴建工程',
    period: '2025-02',
    amount: 1200000,
    status: 'draft',
    submittedAt: null,
    approvedAt: null,
    submittedBy: null,
  },
];

const valuationsRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── GET /valuations ──────────────────────────────────────────────────────
  // Returns paginated list of valuations with optional filters.
  // FE-004 unblock: stub returns contract-compliant shape.
  fastify.get(
    '/',
    { preHandler: authenticate },
    async (request, reply) => {
      const parseResult = ValuationsQuerySchema.safeParse(request.query);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'BAD_REQUEST',
            message: '查詢參數格式錯誤',
            details: parseResult.error.flatten().fieldErrors,
          },
        });
      }

      const { projectId, status, page, limit } = parseResult.data;

      // DB_PENDING: Replace with Prisma query + pagination.
      let filtered = STUB_VALUATIONS;
      if (projectId !== undefined && !isNaN(projectId)) {
        filtered = filtered.filter((v) => v.projectId === projectId);
      }
      if (status !== undefined) {
        filtered = filtered.filter((v) => v.status === status);
      }

      const total = filtered.length;
      const offset = ((page ?? 1) - 1) * (limit ?? 20);
      const items = filtered.slice(offset, offset + (limit ?? 20));

      return reply.status(200).send({
        items,
        pagination: {
          page: page ?? 1,
          limit: limit ?? 20,
          total,
          totalPages: Math.ceil(total / (limit ?? 20)),
        },
        // DB_PENDING: Real data from valuations table
      });
    },
  );
};

export default valuationsRoutes;
