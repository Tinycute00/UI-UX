import { om, cm } from './modals.js';

/* ── VIEW LABELS ── */
export const VIEW_LABELS = {
  dashboard: '工地總覽儀表板',
  morning: '工地晨會記錄',
  daily: '施工日報',
  ir: '查驗資料 (IR)',
  ncr: '缺失追蹤 (NCR)',
  material: '材料進場驗收',
  safety: '工安巡檢',
  sub: '分包商管理',
  billing: '估驗請款',
  docs: '文件管理',
};

const BOTTOM_NAV_MAP = { dashboard: 'bn0', ir: 'bn1', ncr: 'bn2', safety: 'bn3' };

function setActiveBottomNav(buttonId) {
  document.querySelectorAll('.bn-btn').forEach((button) => {
    button.classList.remove('act');
  });

  if (buttonId) {
    document.getElementById(buttonId)?.classList.add('act');
  }
}

export function syncHomeButtonVisibility(viewId) {
  const homeBtn = document.getElementById('tb-home');

  if (!homeBtn || !viewId) {
    return;
  }

  const onMobile = window.innerWidth < 768;
  homeBtn.style.display = onMobile && viewId !== 'dashboard' ? 'flex' : 'none';
}

export function getActiveViewId() {
  return document.querySelector('.view.active')?.id.replace('v-', '') || 'dashboard';
}

export function syncDesktopNavigation(viewId, activeElement = null) {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.remove('active');
  });

  if (activeElement?.classList.contains('nav-item')) {
    activeElement.classList.add('active');
    return;
  }

  if (!viewId) {
    return;
  }

  document.querySelector(`.nav-item[data-view="${viewId}"]`)?.classList.add('active');
}

export function syncBottomNavigation(viewId, buttonId = null, activeElement = null) {
  if (buttonId) {
    setActiveBottomNav(buttonId);
    return;
  }

  if (activeElement?.id?.startsWith('bn')) {
    setActiveBottomNav(activeElement.id);
    return;
  }

  setActiveBottomNav(BOTTOM_NAV_MAP[viewId] || null);
}

/* ── SIDEBAR TOGGLE ── */
export function toggleSB() {
  const sb = document.querySelector('.sidebar');
  if (!sb) return;
  sb.classList.toggle('collapsed');
  const tog = document.getElementById('sb-toggle');
  if (tog) tog.title = sb.classList.contains('collapsed') ? '展開側欄' : '收折側欄';
}

/* ── DESKTOP NAV ── */
export function gv(id, el, lbl) {
  document.querySelectorAll('.view').forEach((v) => {
    v.classList.remove('active');
  });
  document.getElementById('v-' + id)?.classList.add('active');
  syncDesktopNavigation(id, el);

  const label = lbl || VIEW_LABELS[id] || '';
  const title = document.getElementById('tb-title');
  const crumb = document.getElementById('tb-crumb');

  if (title) title.textContent = label;
  if (crumb) crumb.textContent = 'TC-2024-018  ›  ' + label;

  syncHomeButtonVisibility(id);
}

/* ── GO HOME ── */
export function goHome() {
  gv('dashboard', null, VIEW_LABELS.dashboard);
  syncBottomNavigation('dashboard');
}

/* ── NAVIGATE FROM DASHBOARD KPI ── */
export function gvDash(id, lbl) {
  gv(id, null, lbl);
  syncBottomNavigation(id);
}

/* ── MOBILE NAV ── */
export function gvMobile(id, el, lbl) {
  gv(id, null, lbl);
  syncBottomNavigation(id, null, el);
}

/* ── NAVIGATE FROM ALERT ── */
export function navFromAlert(viewId, label, openModalId) {
  cm('mo-alerts');
  setTimeout(() => {
    gv(viewId, null, label);
    syncBottomNavigation(viewId);
    if (openModalId) setTimeout(() => om(openModalId), 200);
  }, 160);
}
