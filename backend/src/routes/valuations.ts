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
 *
 * CONTRACT ALIGNMENT (BE-FE004-VALUATIONS-CONTRACT-ALIGN-20260415):
 *   Canonical status enum (per api-contracts-v1.md):
 *     draft | pending_review | approved | rejected | paid
 *   Legacy aliases accepted (mapped to canonical before filtering):
 *     'pending'   → 'pending_review'   (QA / FE shorthand)
 *     'submitted' → 'pending_review'   (old BE stub value)
 */

// ─── Status alias map ─────────────────────────────────────────────────────────
// Maps legacy / shorthand status strings to canonical values.
// This allows QA and FE to pass 'pending' or 'submitted' without a 400.
const STATUS_ALIAS: Record<string, string> = {
  pending: 'pending_review',
  submitted: 'pending_review',
};

// ─── Query schema ─────────────────────────────────────────────────────────────
const CANONICAL_STATUSES = ['draft', 'pending_review', 'approved', 'rejected', 'paid'] as const;
type CanonicalStatus = (typeof CANONICAL_STATUSES)[number];

/**
 * Resolve a raw status string to a canonical value.
 * Returns the canonical value if valid (after alias resolution),
 * or null if the input is not recognised.
 */
function resolveStatus(raw: string): CanonicalStatus | null {
  const resolved = STATUS_ALIAS[raw] ?? raw;
  if ((CANONICAL_STATUSES as readonly string[]).includes(resolved)) {
    return resolved as CanonicalStatus;
  }
  return null;
}

const ValuationsQuerySchema = z.object({
  projectId: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  status: z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || resolveStatus(v) !== null,
      (v) => ({
        message: `Invalid status "${v}". Accepted: ${CANONICAL_STATUSES.join(', ')} (aliases: pending, submitted)`,
      }),
    )
    .transform((v): CanonicalStatus | undefined =>
      v === undefined ? undefined : (resolveStatus(v) as CanonicalStatus),
    ),
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
// Status uses canonical values: draft | pending_review | approved | rejected | paid
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
    status: 'pending_review',   // was 'submitted' — aligned to canonical contract
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
