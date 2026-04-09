import { om, cm } from './modals.js';

/* ── VIEW LABELS ── */
const vl = {
  'dashboard': '工地總覽儀表板', 'morning': '工地晨會記錄', 'daily': '施工日報', 
  'ir': '查驗資料 (IR)', 'ncr': '缺失追蹤 (NCR)', 'material': '材料進場驗收', 
  'safety': '工安巡檢', 'sub': '分包商管理', 'billing': '估驗請款', 'docs': '文件管理'
};

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
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
  });
  document.getElementById('v-' + id)?.classList.add('active');
  el?.classList.add('active');
  const label = lbl || vl[id] || '';
  document.getElementById('tb-title').textContent = label;
  document.getElementById('tb-crumb').textContent = 'TC-2024-018  ›  ' + label;
  
  const homeBtn = document.getElementById('tb-home');
  if (homeBtn) {
    const onMobile = window.innerWidth < 768;
    homeBtn.style.display = (onMobile && id !== 'dashboard') ? 'flex' : 'none';
  }
}

/* ── GO HOME ── */
export function goHome() {
  gv('dashboard', null, '工地總覽儀表板');
  document.querySelectorAll('.bn-btn').forEach(b => {
    b.classList.remove('act');
  });
  document.getElementById('bn0')?.classList.add('act');
}

/* ── NAVIGATE FROM DASHBOARD KPI ── */
const BN_MAP = { dashboard: 'bn0', ir: 'bn1', ncr: 'bn2', safety: 'bn3' };
export function gvDash(id, lbl) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(n => {
    n.classList.remove('active');
  });
  navItems.forEach(n => {
    if (n.getAttribute('onclick') && n.getAttribute('onclick').includes("'" + id + "'")) {
      n.classList.add('active');
    }
  });
  gv(id, null, lbl);
  document.querySelectorAll('.bn-btn').forEach(b => {
    b.classList.remove('act');
  });
  const bnId = BN_MAP[id];
  if (bnId) document.getElementById(bnId)?.classList.add('act');
}

/* ── MOBILE NAV ── */
export function gvMobile(id, el, lbl) {
  gv(id, null, lbl);
  document.querySelectorAll('.bn-btn').forEach(b => {
    b.classList.remove('act');
  });
  el?.classList.add('act');
}

/* ── NAVIGATE FROM ALERT ── */
export function navFromAlert(viewId, label, openModalId) {
  cm('mo-alerts');
  setTimeout(() => {
    gv(viewId, null, label);
    const bnMap = { dashboard: 'bn0', ir: 'bn1', ncr: 'bn2', safety: 'bn3' };
    document.querySelectorAll('.bn-btn').forEach(b => {
      b.classList.remove('act');
    });
    const bnId = bnMap[viewId];
    if (bnId) document.getElementById(bnId)?.classList.add('act');
    
    document.querySelectorAll('.nav-item').forEach(n => {
      if (n.getAttribute('onclick')?.includes("'" + viewId + "'")) {
        n.classList.add('active');
      }
    });
    if (openModalId) setTimeout(() => om(openModalId), 200);
  }, 160);
}
