import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../plugins/jwtAuth.js';

/**
 * Projects Routes — BE-003 stub
 *
 * Provides project-level endpoints. Currently in stub/contract mode to unblock
 * frontend FE-003. All data is in-memory until DB migration is ready.
 *
 * DB_PENDING: Replace stub data with Prisma queries once project schema is migrated.
 *
 * Registered at: /api/v1/projects
 */
const projectsRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── GET /projects/:projectId/progress ────────────────────────────────────
  // Returns progress summary for a specific project.
  // FE-003 unblock: stub returns static data with correct contract shape.
  fastify.get<{ Params: { projectId: string } }>(
    '/:projectId/progress',
    { preHandler: authenticate },
    async (request, reply) => {
      const { projectId } = request.params;

      // Validate projectId is a positive integer
      const id = parseInt(projectId, 10);
      if (isNaN(id) || id <= 0) {
        return reply.status(400).send({
          error: {
            code: 'BAD_REQUEST',
            message: 'projectId 必須為正整數',
          },
        });
      }

      // DB_PENDING: Query actual project progress from DB.
      // Stub returns mock data for project 101 (and generic shape for any ID).
      // Schema: { projectId, name, overallProgress, phases, lastUpdated }
      const stubProgress = {
        projectId: id,
        name: id === 101 ? '台中辦公大樓新建工程' : `工程專案 #${id}`,
        overallProgress: id === 101 ? 42 : 0,
        phases: [
          {
            phaseId: 1,
            name: '規劃設計',
            progress: 100,
            status: 'completed' as const,
            startDate: '2024-01-15',
            endDate: '2024-06-30',
          },
          {
            phaseId: 2,
            name: '申請許可',
            progress: 80,
            status: 'in_progress' as const,
            startDate: '2024-07-01',
            endDate: null,
          },
          {
            phaseId: 3,
            name: '施工',
            progress: 0,
            status: 'pending' as const,
            startDate: null,
            endDate: null,
          },
        ],
        lastUpdated: new Date().toISOString(),
        // DB_PENDING: actual phase data from progress_records table
      };

      return reply.status(200).send(stubProgress);
    },
  );
};

export default projectsRoutes;
