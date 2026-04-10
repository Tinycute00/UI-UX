/* ── MODALS ── */
export function om(id) {
  document.getElementById(id)?.classList.add('open');
}
export function cm(id) {
  document.getElementById(id)?.classList.remove('open');
}
export function openDr() {
  document.getElementById('dov').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}
export function closeDr() {
  document.getElementById('dov').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
  document.body.style.overflow = '';
}

/* ── TOAST ── */
export function toast(msg, type = 'ts') {
  const w = document.getElementById('tw-wrap');
  if (!w) return;
  const t = document.createElement('div');
  const icons = { ts: 'chk-c', tw: 'alert-t', te: 'x-c' };
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="ic s16"><svg><use href="#ic-${icons[type] || 'info'}"/></svg></span><span>${msg}</span>`;
  w.appendChild(t);
  setTimeout(() => {
    t.style.cssText = 'opacity:0;transform:translateX(10px);transition:.25s';
    setTimeout(() => t.remove(), 250);
  }, 3200);
}

/* ── CHECKLIST TOGGLE ── */
export function tCl(el) {
  el.classList.toggle('ck');
  const b = el.querySelector('.cl-box');
  b.classList.toggle('ck');
  b.innerHTML = b.classList.contains('ck')
    ? '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
    : '';
}

// Setup listeners
export function initModals() {
  document.querySelectorAll('.mo').forEach((m) => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('open');
    });
  });
}
