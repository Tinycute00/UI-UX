import { IR_DETAILS, IR_NOTES, NCR_DETAILS } from '../data/quality.js';
import { getWorkDetailById, getSubcontractorDetailById, logout } from '../api/index.js';
import { MATERIAL_DETAILS, MATERIAL_QC_DETAILS } from '../data/materials.js';
import { BILLING_DETAILS } from '../data/finance.js';
import { MORNING_VIEW_DETAILS } from '../data/meetings.js';
import { DOCUMENT_VIEW_DETAILS, DOCUMENT_REVIEW_DETAILS } from '../data/documents.js';
import {
  setWorkDetail,
  setSubDetail,
  setIRDetail,
  setNCRDetail,
  setBillingDetail,
  setMatDetail,
  setMatQC,
  setMorningView,
  setDocView,
  setDocReview,
  signPad,
  filterIR,
  filterDocs,
  addWorkLog,
  saveWorkLog,
} from '../js/data-setters.js';
import { cm, om, closeDr, openDr, tCl, toast } from '../js/modals.js';
import { goHome, gv, gvDash, gvMobile, navFromAlert, toggleSB } from '../js/navigation.js';
import { safetyStep, safetyCancel, safetySend } from '../js/safety.js';
import { showDashState, showBillingState } from '../js/state-controller.js';
import { initDashboard } from './dashboard-init.js';

function requireDatasetValue(actionElement, key) {
  return actionElement.dataset[key] || '';
}

function openWorkDetail(actionElement) {
  const workId = requireDatasetValue(actionElement, 'workId');
  const detail = getWorkDetailById(workId);

  if (!detail) {
    toast('找不到工程分項資料', 'te');
    return;
  }

  setWorkDetail(
    detail.name,
    detail.colorKey,
    detail.actual,
    detail.plan,
    detail.contract,
    detail.start,
    detail.end,
    detail.scope,
    detail.recent,
    detail.items,
    detail.status,
  );
  om('mo-work-detail');
}

function openSubcontractorDetail(actionElement) {
  const subcontractorId = requireDatasetValue(actionElement, 'subId');
  const detail = getSubcontractorDetailById(subcontractorId);

  if (!detail) {
    toast('找不到分包商資料', 'te');
    return;
  }

  setSubDetail(
    detail.name,
    detail.work,
    detail.pct,
    detail.status,
    detail.contract,
    detail.period,
    detail.scope,
  );
  om('mo-sub-detail');
}

function openIRDetail(actionElement) {
  const irId = requireDatasetValue(actionElement, 'irId');
  const detail = IR_DETAILS[irId];

  if (!detail) {
    toast('找不到查驗記錄', 'te');
    return;
  }

  setIRDetail(
    detail.id,
    detail.loc,
    detail.item,
    detail.date,
    detail.result,
    detail.l1,
    detail.l2,
    detail.l3,
  );
  om('mo-ir-detail');
}

function openNCRDetail(actionElement) {
  const ncrId = requireDatasetValue(actionElement, 'ncrId');
  const detail = NCR_DETAILS[ncrId];

  if (!detail) {
    toast('找不到缺失記錄', 'te');
    return;
  }

  setNCRDetail(
    detail.id,
    detail.title,
    detail.type,
    detail.vendor,
    detail.deadline,
    detail.status,
    detail.desc,
  );
  om('mo-ncr-view');
}

function openMatDetail(actionElement) {
  const matId = requireDatasetValue(actionElement, 'matId');
  const detail = MATERIAL_DETAILS[matId];

  if (!detail) {
    toast('找不到材料記錄', 'te');
    return;
  }

  setMatDetail(
    detail.date,
    detail.name,
    detail.vendor,
    detail.qty,
    detail.unit,
    detail.result,
    detail.report,
  );
  om('mo-mat-detail');
}

function openMatQC(actionElement) {
  const matId = requireDatasetValue(actionElement, 'matId');
  const detail = MATERIAL_QC_DETAILS[matId];

  if (!detail) {
    toast('找不到驗收資料', 'te');
    return;
  }

  setMatQC(detail.date, detail.name, detail.vendor, detail.qty, detail.unit, detail.sample);
  om('mo-mat-qc');
}

function openBillingDetail(actionElement) {
  const billingId = requireDatasetValue(actionElement, 'billingId');
  const detail = BILLING_DETAILS[billingId];

  if (!detail) {
    toast('找不到請款記錄', 'te');
    return;
  }

  setBillingDetail(
    detail.period,
    detail.range,
    detail.pct,
    detail.applied,
    detail.approved,
    detail.paid,
  );
  om('mo-billing-detail');
}

function openMorningView(actionElement) {
  const morningId = requireDatasetValue(actionElement, 'morningId');
  const detail = MORNING_VIEW_DETAILS[morningId];

  if (!detail) {
    toast('找不到晨會記錄', 'te');
    return;
  }

  setMorningView(
    detail.date,
    detail.weather,
    detail.actual,
    detail.plan,
    detail.works,
    detail.safety,
    detail.note,
  );
  om('mo-morning-view');
}

function openDocView(actionElement) {
  const docId = requireDatasetValue(actionElement, 'docId');
  const detail = DOCUMENT_VIEW_DETAILS[docId];

  if (!detail) {
    toast('找不到文件資料', 'te');
    return;
  }

  setDocView(
    detail.name,
    detail.rev,
    detail.cat,
    detail.date,
    detail.author,
    detail.status,
    detail.desc,
  );
  om('mo-doc-view');
}

function openDocReview(actionElement) {
  const docId = requireDatasetValue(actionElement, 'docId');
  const detail = DOCUMENT_REVIEW_DETAILS[docId];

  if (!detail) {
    toast('找不到審查資料', 'te');
    return;
  }

  setDocReview(detail.name, detail.rev, detail.author, detail.date);
  om('mo-doc-review');
}

const actionHandlers = {
  /* ── Shell / Navigation (Phase 1) ── */
  'close-drawer': () => {
    closeDr();
  },
  'reload-dashboard': () => {
    showDashState('loading');
    initDashboard();
  },
  'retry-dashboard': () => {
    showDashState('loading');
    initDashboard();
  },
  'dashboard-nav': (actionElement) => {
    gvDash(requireDatasetValue(actionElement, 'view'), requireDatasetValue(actionElement, 'label'));
  },
  'go-home': () => {
    goHome();
  },
  'mobile-bottom-nav': (actionElement) => {
    gvMobile(
      requireDatasetValue(actionElement, 'view'),
      actionElement,
      requireDatasetValue(actionElement, 'label'),
    );
  },
  'mobile-drawer-nav': (actionElement) => {
    const buttonId = requireDatasetValue(actionElement, 'bnId');
    const bottomNavButton = buttonId ? document.getElementById(buttonId) : null;

    gvMobile(
      requireDatasetValue(actionElement, 'view'),
      bottomNavButton,
      requireDatasetValue(actionElement, 'label'),
    );
    closeDr();
  },
  'navigate-view': (actionElement) => {
    gv(
      requireDatasetValue(actionElement, 'view'),
      actionElement,
      requireDatasetValue(actionElement, 'label'),
    );
  },
  'logout-user': () => {
    logout();
  },
  'open-drawer': () => {
    openDr();
  },
  'open-modal': (actionElement) => {
    om(requireDatasetValue(actionElement, 'modalId'));
  },
  'open-subcontractor-detail': (actionElement) => {
    openSubcontractorDetail(actionElement);
  },
  'open-work-detail': (actionElement) => {
    openWorkDetail(actionElement);
  },
  'toggle-checklist': (actionElement) => {
    tCl(actionElement);
  },
  'toggle-sidebar': () => {
    toggleSB();
  },

  /* ── Modal close / toast combos (Phase 2) ── */
  'close-modal': (actionElement) => {
    cm(requireDatasetValue(actionElement, 'modalId'));
  },
  'close-modal-toast': (actionElement) => {
    cm(requireDatasetValue(actionElement, 'modalId'));
    toast(
      requireDatasetValue(actionElement, 'msg'),
      requireDatasetValue(actionElement, 'type') || 'ts',
    );
  },
  'close-modal-open-modal': (actionElement) => {
    cm(requireDatasetValue(actionElement, 'closeId'));
    om(requireDatasetValue(actionElement, 'openId'));
  },
  'toast-msg': (actionElement) => {
    toast(
      requireDatasetValue(actionElement, 'msg'),
      requireDatasetValue(actionElement, 'type') || 'ts',
    );
  },

  /* ── Alerts / Navigation from notification ── */
  'nav-from-alert': (actionElement) => {
    navFromAlert(
      requireDatasetValue(actionElement, 'view'),
      requireDatasetValue(actionElement, 'label'),
      requireDatasetValue(actionElement, 'openModalId') || undefined,
    );
  },

  /* ── Dashboard navigation + close modal combo ── */
  'dashboard-nav-close-modal': (actionElement) => {
    gvDash(requireDatasetValue(actionElement, 'view'), requireDatasetValue(actionElement, 'label'));
    cm(requireDatasetValue(actionElement, 'modalId'));
  },

  /* ── IR view ── */
  'filter-ir': (actionElement) => {
    filterIR(actionElement, requireDatasetValue(actionElement, 'filter'));
  },

  /* ── Docs view ── */
  'filter-docs': (actionElement) => {
    const f = actionElement.dataset.filter || 'all';
    filterDocs(actionElement, f);
  },
  'open-ir-detail': (actionElement) => {
    openIRDetail(actionElement);
  },

  /* ── IR review (modal) ── */
  'ir-review-check': (actionElement, event) => {
    event.stopPropagation();
    const result = requireDatasetValue(actionElement, 'result');
    const acts = actionElement.closest('.cl-acts');
    if (!acts) return;

    if (result === 'pass') {
      acts.innerHTML = '<span class="tag tg" style="font-size:9px">合格</span>';
    } else {
      acts.innerHTML = '<span class="tag tr" style="font-size:9px">不合格</span>';
    }
  },
  'ir-review-sign': (actionElement) => {
    const time = new Date().toLocaleTimeString('zh-TW');
    actionElement.innerHTML =
      '<span style="color:var(--green)">✅ 李家豪 已完成電子簽名（' + time + '）</span>';
    actionElement.style.borderColor = 'var(--green)';
  },

  /* ── NCR view ── */
  'open-ncr-detail': (actionElement) => {
    openNCRDetail(actionElement);
  },

  /* ── Material view ── */
  'open-mat-detail': (actionElement) => {
    openMatDetail(actionElement);
  },
  'open-mat-qc': (actionElement) => {
    openMatQC(actionElement);
  },

  /* ── Morning meeting ── */
  'open-morning-view': (actionElement) => {
    openMorningView(actionElement);
  },

  /* ── Billing ── */
  'open-billing-detail': (actionElement) => {
    openBillingDetail(actionElement);
  },
  'retry-billing': () => {
    showBillingState('loading');
    setTimeout(() => showBillingState('content'), 1500);
  },

  /* ── Documents ── */
  'open-doc-view': (actionElement) => {
    openDocView(actionElement);
  },
  'open-doc-review': (actionElement) => {
    openDocReview(actionElement);
  },

  /* ── Work log (sub-detail modal) ── */
  'add-work-log': () => {
    addWorkLog();
  },
  'save-work-log': () => {
    saveWorkLog();
  },
  'hide-form': (actionElement) => {
    const formId = requireDatasetValue(actionElement, 'formId');
    const form = document.getElementById(formId);
    if (form) form.style.display = 'none';
  },

  /* ── Safety wizard ── */
  'safety-step': (actionElement) => {
    const step = Number.parseInt(requireDatasetValue(actionElement, 'step'), 10);
    if (step) {
      document.getElementById('safety-wizard').style.display = 'block';
      safetyStep(step);
    }
  },
  'safety-cancel': () => {
    safetyCancel();
  },
  'safety-send': () => {
    safetySend();
  },

  /* ── Sign pad ── */
  'sign-pad': (actionElement) => {
    signPad(actionElement);
  },
};

export function initActionDispatcher() {
  document.addEventListener('click', (event) => {
    const actionElement = event.target.closest('[data-action]');

    if (!actionElement) {
      return;
    }

    const handler = actionHandlers[actionElement.dataset.action];

    if (!handler) {
      return;
    }

    if (actionElement.tagName === 'A' || actionElement.tagName === 'BUTTON') {
      event.preventDefault();
    }

    handler(actionElement, event);
  });
}
