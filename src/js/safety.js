import { toast } from './modals.js';
import { apiPost } from '../api/client.js';
import { API_MODE, DEFAULT_PROJECT_ID } from '../api/config.js';

/* ═══ SAFETY WIZARD ═══ */
/* ═══ 工安巡檢步驟控制 ═══ */

// 標記單一巡檢項目合格/不合格 — 不使用 inline onclick，避免引號逃逸問題
export function markSI(btn, result) {
  var acts = btn.closest('.cl-acts');
  var ok;
  var ng;
  var fix;

  if (!acts) return;
  if (result === 'pass') {
    acts.innerHTML = '';
    ok = document.createElement('span');
    ok.className = 'tag tg';
    ok.style.cssText = 'font-size:9px;padding:3px 8px';
    ok.textContent = '合格';
    acts.appendChild(ok);
  } else {
    acts.innerHTML = '';
    ng = document.createElement('span');
    ng.className = 'tag tr';
    ng.style.cssText = 'font-size:9px;padding:3px 8px';
    ng.textContent = '不合格';
    fix = document.createElement('button');
    fix.textContent = '改為合格';
    fix.style.cssText =
      'padding:2px 8px;border-radius:3px;font-size:10px;margin-left:4px;cursor:pointer;border:1px solid rgba(78,156,106,.3);background:var(--green-dim);color:var(--green)';
    fix.setAttribute('data-mark', 'pass');
    acts.appendChild(ng);
    acts.appendChild(fix);
  }
}

// 進入步驟 2 時，從步驟 1 的勾選動態建立查核清單
export function safetyBuildStep2() {
  // 對應 step1 checkbox label → step2 查核描述
  var itemMap = {
    高空作業安全帶: '高空作業人員安全帶配戴確認（每人均檢查）',
    圍籬及警示標示: '工地周邊圍籬完整，警示標示清晰',
    消防設備有效期: '消防設備配置無缺失，滅火器有效期未過',
    起重機操作證照: '起重機操作人員持有效證照，每日作業前確認',
    電氣漏電斷路器: '電氣設備漏電斷路器動作測試正常',
    澆置區安全管制: '混凝土澆置區域管制線設置，閒雜人員禁止進入',
    車輛管制及淨高: '工地出入口車輛管制確實，淨高限制標示完整',
    個人防護具配備: '作業人員安全帽、安全鞋、手套配備齊全',
    物料堆置整齊: '材料堆置整齊，通道淨空無阻，無倒塌風險',
    機具設備狀況: '機具設備外觀無損傷，安全防護裝置完整',
  };

  var checked = [];
  var lbl;
  var container = document.getElementById('sf-checklist');
  // Read checked items from step 1 checkbox labels
  var step1 = document.getElementById('sw-step1');
  if (step1) {
    step1.querySelectorAll('input[type=checkbox]').forEach((cb) => {
      if (cb.checked) {
        lbl = cb.parentElement.textContent.trim();
        if (itemMap[lbl]) checked.push(itemMap[lbl]);
        else if (lbl) checked.push(lbl + '查核');
      }
    });
  }

  // If nothing checked, use defaults
  if (checked.length === 0) {
    checked = Object.values(itemMap).slice(0, 5);
  }

  if (!container) return;
  container.innerHTML = '';

  checked.forEach((txt, idx) => {
    var row = document.createElement('div');
    row.className = 'cl-item';
    row.style.cssText =
      'display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:var(--r-sm);background:var(--s3);margin-bottom:2px';
    // Build row with DOM API — avoids all quote-escaping issues
    var box = document.createElement('div');
    box.style.cssText =
      'width:16px;height:16px;border-radius:3px;border:1.5px solid var(--bd2);flex-shrink:0';
    box.className = 'cl-box';

    var label = document.createElement('span');
    label.style.cssText = 'font-size:12px;color:var(--tx2);flex:1';
    label.textContent = txt;

    var passBtn = document.createElement('button');
    passBtn.textContent = '合格';
    passBtn.style.cssText =
      'padding:3px 9px;border-radius:3px;font-family:var(--fm);font-size:10px;cursor:pointer;border:1px solid rgba(78,156,106,.3);background:var(--green-dim);color:var(--green)';
    passBtn.setAttribute('data-mark', 'pass');

    var failBtn = document.createElement('button');
    failBtn.textContent = '不合格';
    failBtn.style.cssText =
      'padding:3px 9px;border-radius:3px;font-family:var(--fm);font-size:10px;cursor:pointer;border:1px solid rgba(184,68,68,.3);background:var(--red-dim);color:var(--red)';
    failBtn.setAttribute('data-mark', 'fail');

    var acts = document.createElement('div');
    acts.className = 'cl-acts';
    acts.style.cssText = 'display:flex;gap:5px;flex-shrink:0';
    acts.appendChild(passBtn);
    acts.appendChild(failBtn);

    row.appendChild(box);
    row.appendChild(label);
    row.appendChild(acts);
    container.appendChild(row);
  });
}

export function initSafety() {
  // Delegated click handler for data-mark buttons (pass/fail)
  // Added once after DOM ready — handles all dynamically created buttons
  document.addEventListener('click', (e) => {
    var mark = e.target.getAttribute && e.target.getAttribute('data-mark');
    if (!mark) return;
    e.stopPropagation();
    markSI(e.target, mark);
  });
}

function validateStep1() {
  var step1 = document.getElementById('sw-step1');
  if (!step1) return true;
  var checked = step1.querySelectorAll('input[type=checkbox]:checked');
  return checked.length > 0;
}

function validateStep2() {
  var container = document.getElementById('sf-checklist');
  var items;
  var i;
  var acts;
  var tag;
  if (!container) return true;
  items = container.querySelectorAll('.cl-item');
  if (items.length === 0) return true;
  for (i = 0; i < items.length; i++) {
    acts = items[i].querySelector('.cl-acts');
    if (!acts) continue;
    tag = acts.querySelector('.tag');
    if (!tag) return false;
  }
  return true;
}

export function safetyStep(n) {
  var step1;
  var checked;
  var container;
  var items;
  var unMarked;
  var acts;
  var tag;
  var wiz;
  var dot;
  var i;
  var panel;
  var si;

  // 進入 Step 2：驗證 Step 1（至少選一個巡檢位置 checkbox）
  if (n === 2) {
    step1 = document.getElementById('sw-step1');
    if (step1) {
      checked = step1.querySelectorAll('input[type=checkbox]:checked');
      if (checked.length === 0) {
        toast('請至少選擇一個巡檢位置', 'tw');
        return;
      }
    }
  }

  // 進入 Step 3：驗證 Step 2（所有已列出的查核項目需已標記合格/不合格）
  if (n === 3) {
    container = document.getElementById('sf-checklist');
    if (container) {
      items = container.querySelectorAll('.cl-item');
      if (items.length > 0) {
        unMarked = 0;
        for (i = 0; i < items.length; i++) {
          acts = items[i].querySelector('.cl-acts');
          if (acts) {
            tag = acts.querySelector('.tag');
            if (!tag) {
              unMarked++;
            }
          }
        }
        if (unMarked > 0) {
          toast('請完成所有查核項目的標記（' + unMarked + ' 項未完成）', 'tw');
          return;
        }
      }
    }
  }

  wiz = document.getElementById('safety-wizard');
  for (i = 1; i <= 3; i++) {
    panel = document.getElementById('sw-step' + i);
    if (panel) panel.style.display = i === n ? 'block' : 'none';
    si = document.getElementById('sw-s' + i);
    if (si) si.style.opacity = i <= n ? '1' : '0.4';
    if (si) {
      dot = si.querySelector('div');
      if (dot)
        dot.style.background = i < n ? 'var(--green)' : i === n ? 'var(--gold)' : 'var(--bd2)';
      if (dot) dot.style.color = i <= n ? '#1A1200' : 'var(--tx3)';
    }
  }
  if (n === 2) safetyBuildStep2();
}

export function safetyCancel() {
  document.getElementById('safety-wizard').style.display = 'none';
}

export function safetySend() {
  var confirmBox = document.getElementById('sf-confirm');
  var inspectorName = '';
  var user = null;
  var today = '';
  var step1 = null;
  var checked = [];
  var container = null;
  var items = [];
  var rows = [];
  var i = 0;
  var row = null;
  var acts = null;
  var label = null;
  var result = '';
  var allPass = true;
  var body = null;

  if (!confirmBox || !confirmBox.checked) {
    toast('請勾選安危確認聲明後再送出', 'tw');
    return;
  }

  if (API_MODE === 'mock') {
    document.getElementById('safety-wizard').style.display = 'none';
    toast('巡檢日報已送出，記錄已存檔', 'ts');
    return;
  }

  inspectorName = '現場工程師';
  try {
    user = JSON.parse(sessionStorage.getItem('pmis_user') || 'null');
    if (user && user.displayName) {
      inspectorName = user.displayName;
    }
  } catch (e) {
    /* empty */
  }

  today = new Date().toISOString().slice(0, 10);

  step1 = document.getElementById('sw-step1');
  if (step1) {
    checked = [];
    step1.querySelectorAll('input[type=checkbox]:checked').forEach(function (cb) {
      checked.push(cb.parentElement.textContent.trim());
    });
  }

  container = document.getElementById('sf-checklist');
  items = [];
  allPass = true;
  if (container) {
    rows = container.querySelectorAll('.cl-item');
    for (i = 0; i < rows.length; i++) {
      row = rows[i];
      label = row.querySelector('span');
      acts = row.querySelector('.cl-acts');
      result = 'pass';
      if (acts) {
        if (acts.querySelector('.tag.tr') || acts.querySelector('[data-mark="fail"]')) {
          result = 'fail';
          allPass = false;
        }
      }
      items.push({
        category: 'safety',
        description: label ? label.textContent.trim() : '',
        result: result,
      });
    }
  }

  if (items.length === 0) {
    toast('請至少完成一項巡檢查核', 'tw');
    return;
  }

  body = {
    projectId: Number(DEFAULT_PROJECT_ID) || 101,
    inspectionDate: today,
    inspectorName: inspectorName,
    items: items,
    overallResult: allPass ? 'pass' : 'fail',
  };

  apiPost('/safety-inspections', body)
    .then(function (result) {
      if (result.error) {
        toast('送出失敗：' + (result.error.message || '請稍後再試'), 'te');
        return;
      }
      document.getElementById('safety-wizard').style.display = 'none';
      toast('巡檢日報已送出，記錄已存檔', 'ts');
    })
    .catch(function () {
      toast('送出失敗，請稍後再試', 'te');
    });
}
