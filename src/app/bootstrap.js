import { initIRFilter } from '../js/data-setters.js';
import { initModals, toast } from '../js/modals.js';
import { getActiveViewId, syncHomeButtonVisibility } from '../js/navigation.js';
import { initSafety } from '../js/safety.js';
import { initActionDispatcher } from './actions.js';

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

export function bootstrapApp() {
  initModals();
  initSafety();
  initIRFilter();
  initActionDispatcher();
  initDateDisplay();
  initResponsiveHomeButton();
  initWelcomeToast();
}
