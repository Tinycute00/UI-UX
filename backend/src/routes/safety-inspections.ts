import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../plugins/jwtAuth.js';

/**
 * Safety Inspections Routes — BE-005 stub
 *
 * Provides safety inspection (安全檢查) endpoints. Currently in stub/contract mode
 * to unblock frontend FE-005. All data is in-memory until DB migration is ready.
 *
 * DB_PENDING: Replace stub data with Prisma queries once safety_inspections schema
 * is migrated. Schema will include: inspectionId, projectId, inspector, date,
 * items (array), overallResult, notes, attachments.
 *
 * Registered at: /api/v1/safety-inspections
 */

// ─── Request body schema ──────────────────────────────────────────────────────
const CreateSafetyInspectionSchema = z.object({
  projectId: z.number().int().positive({ message: 'projectId 必須為正整數' }),
  inspectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'inspectionDate 格式須為 YYYY-MM-DD' }),
  inspectorName: z.string().min(1).max(100),
  items: z
    .array(
      z.object({
        category: z.string().min(1),
        description: z.string().min(1),
        result: z.enum(['pass', 'fail', 'na']),
        notes: z.string().optional(),
      }),
    )
    .min(1, { message: '至少須有一個檢查項目' }),
  overallResult: z.enum(['pass', 'fail', 'conditional']),
  notes: z.string().optional(),
});

// In-memory stub store (resets on server restart)
// DB_PENDING: Replace with Prisma model once safety_inspections table exists
const stubInspections: Array<{
  inspectionId: number;
  projectId: number;
  inspectionDate: string;
  inspectorName: string;
  items: Array<{
    category: string;
    description: string;
    result: 'pass' | 'fail' | 'na';
    notes?: string;
  }>;
  overallResult: 'pass' | 'fail' | 'conditional';
  notes?: string;
  createdAt: string;
  createdBy: { userId: number; username: string };
}> = [];

let nextInspectionId = 1;

const safetyInspectionsRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── POST /safety-inspections ─────────────────────────────────────────────
  // Creates a new safety inspection record.
  // FE-005 unblock: accepts and validates full contract payload; persists to stub store.
  fastify.post(
    '/',
    { preHandler: authenticate },
    async (request, reply) => {
      const parseResult = CreateSafetyInspectionSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'BAD_REQUEST',
            message: '請求格式錯誤',
            details: parseResult.error.flatten().fieldErrors,
          },
        });
      }

      const body = parseResult.data;
      const userId = parseInt(request.user.userId, 10);

      // DB_PENDING: Verify project exists (projectId FK check) in DB.
      // DB_PENDING: Persist to safety_inspections table via Prisma.
      const inspection = {
        inspectionId: nextInspectionId++,
        projectId: body.projectId,
        inspectionDate: body.inspectionDate,
        inspectorName: body.inspectorName,
        items: body.items,
        overallResult: body.overallResult,
        notes: body.notes,
        createdAt: new Date().toISOString(),
        createdBy: {
          userId,
          // DB_PENDING: resolve displayName from users table by userId
          username: `user_${userId}`,
        },
      };

      stubInspections.push(inspection);

      return reply.status(201).send(inspection);
    },
  );

  // ─── GET /safety-inspections ──────────────────────────────────────────────
  // List inspections (bonus endpoint for FE-005 read-back verification).
  // DB_PENDING: Replace with Prisma query.
  fastify.get(
    '/',
    { preHandler: authenticate },
    async (_request, reply) => {
      return reply.status(200).send({
        items: stubInspections,
        total: stubInspections.length,
        // DB_PENDING: Real data from safety_inspections table
      });
    },
  );
};

export default safetyInspectionsRoutes;
