import './styles/main.css';

import { bootstrapApp } from './app/bootstrap.js';

import { om, cm, openDr, closeDr, toast, tCl } from './js/modals.js';

import { toggleSB, gv, goHome, gvDash, gvMobile, navFromAlert } from './js/navigation.js';

import { markSI, safetyBuildStep2, safetyStep, safetyCancel, safetySend } from './js/safety.js';

import {
  setWorkDetail,
  signPad,
  filterIR,
  setIRDetail,
  setNCRDetail,
  setSubDetail,
  subTab,
  addWorkLog,
  saveWorkLog,
  setBillingDetail,
  setMatDetail,
  setMatReturn,
  setMatQC,
  setMorningView,
  setDocView,
  setDocReview,
} from './js/data-setters.js';

// Bind globals for inline HTML event handlers
Object.assign(window, {
  om,
  cm,
  openDr,
  closeDr,
  toast,
  tCl,
  toggleSB,
  gv,
  goHome,
  gvDash,
  gvMobile,
  navFromAlert,
  markSI,
  safetyBuildStep2,
  safetyStep,
  safetyCancel,
  safetySend,
  setWorkDetail,
  signPad,
  filterIR,
  setIRDetail,
  setNCRDetail,
  setSubDetail,
  subTab,
  addWorkLog,
  saveWorkLog,
  setBillingDetail,
  setMatDetail,
  setMatReturn,
  setMatQC,
  setMorningView,
  setDocView,
  setDocReview,
});

// App initialization
document.addEventListener('DOMContentLoaded', () => {
  bootstrapApp();
});
