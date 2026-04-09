import './styles/main.css';

import { 
  om, cm, openDr, closeDr, toast, tCl, initModals 
} from './js/modals.js';

import { 
  toggleSB, gv, goHome, gvDash, gvMobile, navFromAlert 
} from './js/navigation.js';

import { 
  markSI, safetyBuildStep2, safetyStep, safetyCancel, safetySend, initSafety 
} from './js/safety.js';

import { 
  setWorkDetail, signPad, filterIR, initIRFilter,
  setIRDetail, setNCRDetail, setSubDetail, subTab, addWorkLog, saveWorkLog, 
  setBillingDetail, setMatDetail, setMatReturn, setMatQC, setMorningView, 
  setDocView, setDocReview 
} from './js/data-setters.js';

// Bind globals for inline HTML event handlers
Object.assign(window, {
  om, cm, openDr, closeDr, toast, tCl,
  toggleSB, gv, goHome, gvDash, gvMobile, navFromAlert,
  markSI, safetyBuildStep2, safetyStep, safetyCancel, safetySend,
  setWorkDetail, signPad, filterIR,
  setIRDetail, setNCRDetail, setSubDetail, subTab, addWorkLog, saveWorkLog,
  setBillingDetail, setMatDetail, setMatReturn, setMatQC, setMorningView,
  setDocView, setDocReview
});

// App initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize dynamic DOM listeners
  initModals();
  initSafety();
  initIRFilter();

  /* ── DATE ── */
  const d = new Date();
  const tbDate = document.getElementById('tb-date');
  if (tbDate) {
    tbDate.textContent = d.toLocaleDateString('zh-TW', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'short'
    });
  }

  /* ── INIT TOAST ── */
  setTimeout(() => toast('系統連線成功｜今日有 5 則待處理通知', 'tw'), 900);

  /* ── RESPONSIVE: hide home btn on desktop, manage on resize ── */
  window.addEventListener('resize', () => {
    const activeViewEl = document.querySelector('.view.active');
    const activeView = activeViewEl ? activeViewEl.id.replace('v-', '') : '';
    const homeBtn = document.getElementById('tb-home');
    if (homeBtn && activeView) {
      homeBtn.style.display = (window.innerWidth < 768 && activeView !== 'dashboard') ? 'flex' : 'none';
    }
  });
});
