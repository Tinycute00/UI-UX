import { API_MODE, DEFAULT_PROJECT_ID } from '../config.js';
import { apiGet } from '../client.js';
import { WORK_DETAILS, SUBCONTRACTOR_DETAILS } from '../../data/dashboard.js';

function parseContractAmount(contractStr) {
  if (!contractStr) return 0;
  var num = contractStr.replace(/[^\d]/g, '');
  return Number.parseInt(num, 10) || 0;
}

function calculateStatus(actual, plan) {
  if (actual >= plan) {
    return 'on_track';
  }
  if (actual >= plan - 5) {
    return 'slight_delay';
  }
  return 'delayed';
}

function transformWorkToPhase(workId, workData) {
  var contractAmount = parseContractAmount(workData.contract);
  var status = calculateStatus(workData.actual, workData.plan);

  return {
    phaseId: workId,
    phaseName: workData.name,
    plannedProgress: workData.plan,
    actualProgress: workData.actual,
    weight: contractAmount,
  };
}

function transformWorkToItem(workId, workData) {
  var status = calculateStatus(workData.actual, workData.plan);

  return {
    id: workId,
    code: workData.id.toUpperCase(),
    name: workData.name,
    parentId: null,
    level: 1,
    unit: '%',
    contractQuantity: 100,
    contractUnitPrice: parseContractAmount(workData.contract) / 100,
    cumulativeCompletedQuantity: workData.actual,
    completionPercentage: workData.actual,
    status: status,
    hasChildren: false,
  };
}

function transformSubcontractorToApi(subId, subData) {
  var statusMap = {
    '施工中': 'active',
    '進度落後': 'delayed',
    '進場準備': 'preparing',
  };

  var contractMap = {
    '誠實營造': {
      taxId: '12345678',
      contactPerson: '張誠實',
      contactPhone: '02-2345-6789',
      email: 'contact@chenshi.com',
      type: 'construction',
      contractedItemsCount: 3,
      cumulativeBilledAmount: 22100000,
    },
    '王子水電': {
      taxId: '87654321',
      contactPerson: '王王子',
      contactPhone: '02-9876-5432',
      email: 'service@wangzi.com',
      type: 'mep',
      contractedItemsCount: 5,
      cumulativeBilledAmount: 17404000,
    },
    '大地模板': {
      taxId: '11223344',
      contactPerson: '林大地',
      contactPhone: '02-1111-2222',
      email: 'info@dadi.com',
      type: 'formwork',
      contractedItemsCount: 2,
      cumulativeBilledAmount: 9984000,
    },
    '永達預拌混凝土': {
      taxId: '55667788',
      contactPerson: '陳永達',
      contactPhone: '02-3333-4444',
      email: 'order@yongda.com',
      type: 'material',
      contractedItemsCount: 1,
      cumulativeBilledAmount: 18590000,
    },
    '建新帷幕': {
      taxId: '99001122',
      contactPerson: '李建新',
      contactPhone: '02-5555-6666',
      email: 'sales@jianxin.com',
      type: 'curtainwall',
      contractedItemsCount: 1,
      cumulativeBilledAmount: 3120000,
    },
  };

  var contractInfo = contractMap[subData.name] || {
    taxId: '',
    contactPerson: '',
    contactPhone: '',
    email: '',
    type: 'other',
    contractedItemsCount: 0,
    cumulativeBilledAmount: 0,
  };

  var contractStatus = subData.pct >= 90 ? 'nearly_complete' : subData.pct >= 50 ? 'in_progress' : 'early_stage';

  return {
    id: subId,
    name: subData.name,
    taxId: contractInfo.taxId,
    contactPerson: contractInfo.contactPerson,
    contactPhone: contractInfo.contactPhone,
    email: contractInfo.email,
    type: contractInfo.type,
    contractedItemsCount: contractInfo.contractedItemsCount,
    cumulativeBilledAmount: contractInfo.cumulativeBilledAmount,
    contractStatus: contractStatus,
    completionPercentage: subData.pct,
  };
}

function getMockDashboardData(projectId) {
  var phases = [];
  var totalContract = 0;
  var weightedPlanSum = 0;
  var weightedActualSum = 0;
  var workIds = Object.keys(WORK_DETAILS);
  var index = 0;
  var workId = '';
  var workData = null;
  var phase = null;
  var contractAmount = 0;
  var overallPlan = 0;
  var overallActual = 0;

  for (index = 0; index < workIds.length; index = index + 1) {
    workId = workIds[index];
    workData = WORK_DETAILS[workId];
    phase = transformWorkToPhase(workId, workData);
    contractAmount = parseContractAmount(workData.contract);

    phases.push(phase);
    totalContract = totalContract + contractAmount;
    weightedPlanSum = weightedPlanSum + workData.plan * contractAmount;
    weightedActualSum = weightedActualSum + workData.actual * contractAmount;
  }

  overallPlan = totalContract > 0 ? Math.round((weightedPlanSum / totalContract) * 10) / 10 : 0;
  overallActual = totalContract > 0 ? Math.round((weightedActualSum / totalContract) * 10) / 10 : 0;

  return {
    projectId: projectId,
    projectName: '太陳建設總部大樓新建工程',
    overallProgress: {
      planned: overallPlan,
      actual: overallActual,
      variance: Math.round((overallActual - overallPlan) * 10) / 10,
    },
    phases: phases,
    contractAmount: totalContract,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function getMockWorkItems(projectId) {
  var items = [];
  var workIds = Object.keys(WORK_DETAILS);
  var index = 0;
  var workId = '';

  for (index = 0; index < workIds.length; index = index + 1) {
    workId = workIds[index];
    items.push(transformWorkToItem(workId, WORK_DETAILS[workId]));
  }

  return {
    projectId: projectId,
    items: items,
    pagination: {
      page: 1,
      limit: 50,
      total: items.length,
      totalPages: 1,
    },
  };
}

function getMockSubcontractors(projectId) {
  var subcontractors = [];
  var subIds = Object.keys(SUBCONTRACTOR_DETAILS);
  var index = 0;
  var subId = '';

  for (index = 0; index < subIds.length; index = index + 1) {
    subId = subIds[index];
    subcontractors.push(transformSubcontractorToApi(subId, SUBCONTRACTOR_DETAILS[subId]));
  }

  return {
    projectId: projectId,
    subcontractors: subcontractors,
  };
}

export function getDashboardData(projectId) {
  var pid = projectId || DEFAULT_PROJECT_ID;

  if (API_MODE === 'mock') {
    return Promise.resolve(getMockDashboardData(pid));
  }

  return apiGet('/projects/' + pid + '/progress').then(function (result) {
    if (result.error) {
      return Promise.reject(result.error);
    }
    return result.data;
  });
}

export function getWorkItems(projectId) {
  var pid = projectId || DEFAULT_PROJECT_ID;

  if (API_MODE === 'mock') {
    return Promise.resolve(getMockWorkItems(pid));
  }

  return apiGet('/projects/' + pid + '/work-items').then(function (result) {
    if (result.error) {
      return Promise.reject(result.error);
    }
    return result.data;
  });
}

export function getSubcontractors(projectId) {
  var pid = projectId || DEFAULT_PROJECT_ID;

  if (API_MODE === 'mock') {
    return Promise.resolve(getMockSubcontractors(pid));
  }

  return apiGet('/projects/' + pid + '/subcontractors').then(function (result) {
    if (result.error) {
      return Promise.reject(result.error);
    }
    return result.data;
  });
}

export function getWorkDetailById(workId) {
  var detail = WORK_DETAILS[workId];
  if (!detail) {
    return null;
  }
  return detail;
}

export function getSubcontractorDetailById(subcontractorId) {
  var detail = SUBCONTRACTOR_DETAILS[subcontractorId];
  if (!detail) {
    return null;
  }
  return detail;
}
