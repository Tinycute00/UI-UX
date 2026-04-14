import {
  getDashboardData,
  getWorkItems,
  getSubcontractors,
} from '../api/adapters/dashboard-adapter.js';
import { showDashState } from '../js/state-controller.js';

export function initDashboard() {
  var errorMsgEl = document.getElementById('dash-error-msg');

  showDashState('loading');

  Promise.all([getDashboardData(), getWorkItems(), getSubcontractors()])
    .then(function (results) {
      var dashData = results[0];
      var workData = results[1];
      var subData = results[2];

      renderDashboard(dashData, workData, subData);
      showDashState('content');
    })
    .catch(function (error) {
      var message =
        error && error.message
          ? error.message
          : '\u7121\u6cd5\u8f09\u5165\u5100\u8868\u677f\u8cc7\u6599';

      if (errorMsgEl) {
        errorMsgEl.textContent = message;
      }

      showDashState('error');
    });
}

function renderDashboard(dashData, workData, subData) {
  var overall = dashData && dashData.overallProgress ? dashData.overallProgress : {};
  var planned = overall.planned || 0;
  var actual = overall.actual || 0;
  var variance = overall.variance || 0;

  renderOverallProgress(actual, planned, variance);
  renderWorkItems(workData && workData.items ? workData.items : []);
  renderSubcontractors(subData && subData.subcontractors ? subData.subcontractors : []);
}

function renderOverallProgress(actual, planned, variance) {
  var overallActualEl = document.getElementById('dash-overall-actual');
  var overallStatusEl = document.getElementById('dash-overall-status');
  var planFillEl = document.getElementById('dash-plan-pct-fill');
  var planTextEl = document.getElementById('dash-plan-pct-text');
  var actualFillEl = document.getElementById('dash-actual-pct-fill');
  var actualTextEl = document.getElementById('dash-actual-pct-text');
  var varianceBadgeEl = document.getElementById('dash-variance-badge');

  var statusText = '';
  var statusClass = '';
  var varianceSymbol = '';
  var varianceClass = '';

  if (variance > 0) {
    statusText = '\u8d85\u524d\u8a08\u5283 ' + Math.abs(variance) + '%';
    statusClass = 'up';
    varianceSymbol = '\u25b2 +';
    varianceClass = 'color:var(--green)';
  } else if (variance < 0) {
    statusText = '\u843d\u5f8c\u8a08\u5283 ' + Math.abs(variance) + '%';
    statusClass = 'dn';
    varianceSymbol = '\u25bc ';
    varianceClass = 'color:var(--red)';
  } else {
    statusText = '\u6309\u8a08\u5283\u9032\u884c';
    statusClass = 'nt';
    varianceSymbol = '';
    varianceClass = '';
  }

  if (overallActualEl) {
    overallActualEl.innerHTML = actual + '<span style="font-size:15px">%</span>';
  }

  if (overallStatusEl) {
    overallStatusEl.className = statusClass;
    overallStatusEl.textContent = statusText;
  }

  if (planFillEl) {
    planFillEl.style.width = planned + '%';
  }

  if (planTextEl) {
    planTextEl.textContent = planned + '%';
  }

  if (actualFillEl) {
    actualFillEl.style.width = actual + '%';
  }

  if (actualTextEl) {
    actualTextEl.innerHTML =
      actual +
      '% <span style="' +
      varianceClass +
      ';font-size:9px">' +
      varianceSymbol +
      variance +
      '%</span>';
  }

  if (varianceBadgeEl) {
    varianceBadgeEl.style.cssText = varianceClass + ';font-size:9px';
    varianceBadgeEl.textContent = varianceSymbol + variance + '%';
  }
}

function renderWorkItems(items) {
  var workIdMap = {
    underground: 'underground',
    aboveground: 'aboveground',
    mep: 'mep',
    curtainwall: 'curtainwall',
  };

  var colorVarMap = {
    underground: 'var(--wc1)',
    aboveground: 'var(--wc2)',
    mep: 'var(--wc3)',
    curtainwall: 'var(--wc4)',
  };

  var itemIndex = 0;
  var item = null;
  var workId = '';
  var container = null;
  var progressFill = null;
  var percentSpan = null;
  var color = '';
  var pct = 0;

  for (itemIndex = 0; itemIndex < items.length; itemIndex = itemIndex + 1) {
    item = items[itemIndex];
    workId = workIdMap[item.id];

    if (!workId) {
      continue;
    }

    container = document.querySelector('[data-work-id="' + workId + '"]');

    if (!container) {
      continue;
    }

    progressFill = container.querySelector('.pb .pf');
    percentSpan = container.querySelector('.fm-font');
    color = colorVarMap[workId];
    pct = item.completionPercentage || 0;

    if (progressFill) {
      progressFill.style.width = pct + '%';
      progressFill.style.background = color;
    }

    if (percentSpan) {
      percentSpan.style.color = color;
      percentSpan.innerHTML = '<span style="font-weight:600">' + pct + '%</span>';
    }
  }
}

function renderSubcontractors(subcontractors) {
  var tbody = document.getElementById('subcontractors-tbody');

  if (!tbody) {
    return;
  }

  var statusMap = {
    active: { text: '\u65bd\u5de5\u4e2d', tagClass: 'tg' },
    delayed: { text: '\u4eba\u529b\u4e0d\u8db3', tagClass: 'ta' },
    preparing: { text: '\u9032\u5834\u6e96\u5099', tagClass: 'tx' },
  };

  var workTypeMap = {
    construction: '\u7d50\u69cb\u92fc\u7b4b',
    mep: '\u6a5f\u96fb\u7ba1\u8def',
    formwork: '\u6a21\u677f\u5de5\u7a0b',
    material: '\u6df7\u51dd\u571f\u4f9b\u6599',
    curtainwall: '\u5916\u7246\u5e55\u5e0c',
    other: '\u5176\u4ed6\u5de5\u9805',
  };

  var html = '';
  var index = 0;
  var sub = null;
  var statusInfo = null;
  var workType = '';
  var completionPct = 0;

  for (index = 0; index < subcontractors.length; index = index + 1) {
    sub = subcontractors[index];

    if (sub.completionPercentage < 30) {
      statusInfo = statusMap.preparing;
    } else if (sub.completionPercentage < 60) {
      statusInfo = statusMap.delayed;
    } else {
      statusInfo = statusMap.active;
    }

    if (sub.contractStatus === 'early_stage') {
      statusInfo = statusMap.preparing;
    }

    workType = workTypeMap[sub.type] || '\u5176\u4ed6\u5de5\u9805';
    completionPct = sub.completionPercentage || 0;

    html =
      html +
      '<tr>' +
      '<td class="tc1">' +
      (sub.name || '') +
      '</td>' +
      '<td>' +
      workType +
      '</td>' +
      '<td class="tcm">' +
      completionPct +
      '%</td>' +
      '<td><span class="tag ' +
      statusInfo.tagClass +
      '">' +
      statusInfo.text +
      '</span></td>' +
      '<td>' +
      '<button class="btn bg btn-sm" data-action="open-subcontractor-detail" data-sub-id="' +
      (sub.id || '') +
      '">' +
      '<span class="ic s12"><svg><use href="#ic-eye"/></svg></span> \u67e5\u770b' +
      '</button>' +
      '</td>' +
      '</tr>';
  }

  tbody.innerHTML = html;
}

if (typeof window !== 'undefined') {
  window.initDashboard = initDashboard;
  window.renderDashboard = renderDashboard;
  window.renderWorkItems = renderWorkItems;
  window.renderSubcontractors = renderSubcontractors;
}
