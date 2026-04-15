import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../plugins/jwtAuth.js';

/**
 * Projects Routes — BE-003 stub (updated BE-FE003-REFRESH-RECON-20260415)
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

  // ─── GET /projects/:projectId/work-items ──────────────────────────────────
  // Returns WBS work items for a project.
  // BE-FE003-REFRESH-RECON-20260415: stub added to resolve FE-003 live 404.
  // Contract: api-contracts-v1.md §GET /api/v1/projects/:projectId/work-items
  // DB_PENDING: Replace with Prisma query on contract.contract_items + contract.contract_item_measurement_rules
  fastify.get<{
    Params: { projectId: string };
    Querystring: {
      parentId?: string;
      level?: string;
      status?: string;
      page?: string;
      limit?: string;
    };
  }>(
    '/:projectId/work-items',
    { preHandler: authenticate },
    async (request, reply) => {
      const { projectId } = request.params;
      const id = parseInt(projectId, 10);
      if (isNaN(id) || id <= 0) {
        return reply.status(400).send({
          error: { code: 'BAD_REQUEST', message: 'projectId 必須為正整數' },
        });
      }

      const page = Math.max(1, parseInt(request.query.page ?? '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(request.query.limit ?? '20', 10) || 20));

      // Stub data: representative WBS items for project 101
      const stubItems = [
        {
          id: 'wi-001',
          code: '1.0',
          name: '基礎工程',
          parentId: null,
          level: 1,
          unit: '式',
          contractQuantity: 1,
          contractUnitPrice: 5000000,
          cumulativeCompletedQuantity: 1,
          completionPercentage: 100,
          status: 'completed' as const,
          hasChildren: true,
        },
        {
          id: 'wi-002',
          code: '1.1',
          name: '土方開挖',
          parentId: 'wi-001',
          level: 2,
          unit: 'm³',
          contractQuantity: 2500,
          contractUnitPrice: 800,
          cumulativeCompletedQuantity: 2500,
          completionPercentage: 100,
          status: 'completed' as const,
          hasChildren: false,
        },
        {
          id: 'wi-003',
          code: '1.2',
          name: '基礎混凝土澆置',
          parentId: 'wi-001',
          level: 2,
          unit: 'm³',
          contractQuantity: 450,
          contractUnitPrice: 3500,
          cumulativeCompletedQuantity: 450,
          completionPercentage: 100,
          status: 'completed' as const,
          hasChildren: false,
        },
        {
          id: 'wi-004',
          code: '2.0',
          name: '主體結構工程',
          parentId: null,
          level: 1,
          unit: '式',
          contractQuantity: 1,
          contractUnitPrice: 12000000,
          cumulativeCompletedQuantity: 0,
          completionPercentage: 35,
          status: 'in_progress' as const,
          hasChildren: true,
        },
        {
          id: 'wi-005',
          code: '2.1',
          name: '鋼筋工程',
          parentId: 'wi-004',
          level: 2,
          unit: 'ton',
          contractQuantity: 120,
          contractUnitPrice: 25000,
          cumulativeCompletedQuantity: 42,
          completionPercentage: 35,
          status: 'in_progress' as const,
          hasChildren: false,
        },
        {
          id: 'wi-006',
          code: '3.0',
          name: '內裝工程',
          parentId: null,
          level: 1,
          unit: '式',
          contractQuantity: 1,
          contractUnitPrice: 8000000,
          cumulativeCompletedQuantity: 0,
          completionPercentage: 0,
          status: 'pending' as const,
          hasChildren: false,
        },
      ];

      // Apply status filter if provided
      const statusFilter = request.query.status;
      const filtered =
        statusFilter && statusFilter !== 'all'
          ? stubItems.filter((item) => {
              if (statusFilter === 'active') return item.status !== 'completed';
              return item.status === statusFilter;
            })
          : stubItems;

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);

      return reply.status(200).send({
        projectId: id,
        items,
        pagination: { page, limit, total, totalPages },
        // DB_PENDING: stub data only; replace with contract.contract_items query
      });
    },
  );

  // ─── GET /projects/:projectId/subcontractors ──────────────────────────────
  // Returns subcontractor (vendor) list for a project.
  // BE-FE003-REFRESH-RECON-20260415: stub added to resolve FE-003 live 404.
  // Contract: api-contracts-v1.md §GET /api/v1/projects/:projectId/subcontractors
  // DB_PENDING: Replace with Prisma query on vendor.vendors + contract.contract_headers
  fastify.get<{
    Params: { projectId: string };
    Querystring: {
      status?: string;
      search?: string;
      page?: string;
      limit?: string;
    };
  }>(
    '/:projectId/subcontractors',
    { preHandler: authenticate },
    async (request, reply) => {
      const { projectId } = request.params;
      const id = parseInt(projectId, 10);
      if (isNaN(id) || id <= 0) {
        return reply.status(400).send({
          error: { code: 'BAD_REQUEST', message: 'projectId 必須為正整數' },
        });
      }

      const page = Math.max(1, parseInt(request.query.page ?? '1', 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(request.query.limit ?? '20', 10) || 20));

      // Stub data: representative subcontractors for project 101
      const stubSubcontractors = [
        {
          id: 'sc-001',
          name: '大成建設股份有限公司',
          taxId: '12345678',
          contactPerson: '王大明',
          contactPhone: '02-2345-6789',
          email: 'contact@dacheng.com.tw',
          type: 'general' as const,
          contractedItemsCount: 5,
          cumulativeBilledAmount: 2500000,
          contractStatus: 'active' as const,
          contractStartDate: '2024-03-01',
          contractEndDate: '2025-06-30',
        },
        {
          id: 'sc-002',
          name: '精銳鋼鐵工程有限公司',
          taxId: '87654321',
          contactPerson: '李小華',
          contactPhone: '02-3456-7890',
          email: 'info@jingru-steel.com.tw',
          type: 'specialized' as const,
          contractedItemsCount: 2,
          cumulativeBilledAmount: 800000,
          contractStatus: 'active' as const,
          contractStartDate: '2024-05-15',
          contractEndDate: null,
        },
        {
          id: 'sc-003',
          name: '友達勞務工程行',
          taxId: '11223344',
          contactPerson: '陳阿福',
          contactPhone: '04-5678-9012',
          email: 'yuda.labor@gmail.com',
          type: 'labor_only' as const,
          contractedItemsCount: 3,
          cumulativeBilledAmount: 320000,
          contractStatus: 'active' as const,
          contractStartDate: '2024-06-01',
          contractEndDate: '2024-12-31',
        },
      ];

      // Apply status filter
      const statusFilter = request.query.status;
      let filtered =
        statusFilter && statusFilter !== 'all'
          ? stubSubcontractors.filter((sc) => sc.contractStatus === statusFilter)
          : stubSubcontractors;

      // Apply search filter (name or taxId)
      const search = request.query.search?.toLowerCase();
      if (search) {
        filtered = filtered.filter(
          (sc) =>
            sc.name.toLowerCase().includes(search) || sc.taxId.toLowerCase().includes(search),
        );
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const subcontractors = filtered.slice(start, start + limit);

      return reply.status(200).send({
        projectId: id,
        subcontractors,
        pagination: { page, limit, total, totalPages },
        // DB_PENDING: stub data only; replace with vendor.vendors + contract.contract_headers query
      });
    },
  );
};

export default projectsRoutes;
