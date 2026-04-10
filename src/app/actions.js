import { WORK_DETAILS, SUBCONTRACTOR_DETAILS } from '../data/dashboard.js';
import { setSubDetail, setWorkDetail } from '../js/data-setters.js';
import { closeDr, om, tCl, toast, openDr } from '../js/modals.js';
import { goHome, gv, gvDash, gvMobile, toggleSB } from '../js/navigation.js';

function requireDatasetValue(actionElement, key) {
  return actionElement.dataset[key] || '';
}

function openWorkDetail(actionElement) {
  const workId = requireDatasetValue(actionElement, 'workId');
  const detail = WORK_DETAILS[workId];

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
  const detail = SUBCONTRACTOR_DETAILS[subcontractorId];

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

const actionHandlers = {
  'close-drawer': () => {
    closeDr();
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
