import { initModals, toast } from '../js/modals.js';
import { getStoredUser } from '../api/index.js';
import { getActiveViewId, syncHomeButtonVisibility } from '../js/navigation.js';
import { initSafety } from '../js/safety.js';
import { initActionDispatcher } from './actions.js';
import { initDashboard } from './dashboard-init.js';

function initDateDisplay() {
  const currentDate = new Date();
  const topbarDate = document.getElementById('tb-date');

  if (!topbarDate) {
    return;
  }

  topbarDate.textContent = currentDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function initResponsiveHomeButton() {
  syncHomeButtonVisibility(getActiveViewId());

  window.addEventListener('resize', () => {
    syncHomeButtonVisibility(getActiveViewId());
  });
}

function initWelcomeToast() {
  setTimeout(() => {
    toast('系統連線成功｜今日有 5 則待處理通知', 'tw');
  }, 900);
}

function initUserShell() {
  const user = getStoredUser();
  const avatar = document.getElementById('sb-avatar');
  const name = document.getElementById('sb-uname');
  const role = document.getElementById('sb-urole');

  if (!user) {
    return;
  }

  if (avatar) {
    avatar.textContent = (user.displayName || user.username || 'D').charAt(0);
  }

  if (name) {
    name.textContent = user.displayName || user.username || 'Demo User';
  }

  if (role) {
    role.textContent = user.roleLabel || user.role || 'Demo';
  }
}

export function bootstrapApp() {
  initModals();
  initSafety();
  initActionDispatcher();
  initDashboard();
  initDateDisplay();
  initResponsiveHomeButton();
  initUserShell();
  initWelcomeToast();
}
