import { toast } from './modals.js';

/* ═══ WORK DETAIL SETTER ═══ */
var WC_COLOR={wc1:'var(--wc1)',wc2:'var(--wc2)',wc3:'var(--wc3)',wc4:'var(--wc4)'};
export function setWorkDetail(name,colorKey,actual,plan,contract,start,end,scope,recent,items,status){
  document.getElementById('wd-name').textContent=name;
  document.getElementById('wd-sub').textContent=start+' — '+end;
  document.getElementById('wd-contract').textContent=contract;
  document.getElementById('wd-period').textContent=start+' ～ '+end;
  document.getElementById('wd-scope').textContent=scope;
  document.getElementById('wd-recent').textContent=recent;
  document.getElementById('wd-items').innerHTML=items;
  document.getElementById('wd-status').innerHTML=status;
  var diff=actual-plan;
  var col=WC_COLOR[colorKey]||'var(--gold)';
  var diffStr=diff>=0?'<span style="color:var(--green)">▲ 超前 '+diff+'%</span>':'<span style="color:var(--red)">▼ 落後 '+Math.abs(diff)+'%</span>';
  document.getElementById('wd-plan').textContent=plan+'%';
  document.getElementById('wd-plan-lbl').textContent=plan+'%';
  document.getElementById('wd-plan-bar').style.width=plan+'%';
  var ae=document.getElementById('wd-actual');
  ae.textContent=actual+'%'; ae.style.color=col;
  var al=document.getElementById('wd-actual-lbl');
  al.innerHTML=actual+'% '+diffStr; al.style.color=col;
  var ab=document.getElementById('wd-actual-bar');
  ab.style.width=actual+'%'; ab.style.background=col;
  var mi=document.getElementById('wd-mi');
  if(mi) mi.style.borderColor='color-mix(in srgb,'+col+' 40%,var(--bd2))';
}

/* ═══ SIGN PAD ═══ */
export function signPad(el) {
  el.style.borderColor = 'var(--green)';
  el.style.background = 'var(--green-dim)';
  el.style.cursor = 'default';
  el.removeAttribute('onclick');
  el.onmouseover = null;
  el.onmouseout = null;
  el.innerHTML = '';
  var icon = document.createElement('span');
  icon.className = 'ic s16';
  icon.innerHTML = '<svg><use href="#ic-chk-c"/></svg>';
  var name = el.id === 'sign-pad-ir' ? '李家豪' : '陳志強';
  var time = new Date().toLocaleTimeString('zh-TW');
  var txt = document.createElement('span');
  txt.style.cssText = 'color:var(--green);font-size:12px;margin-left:6px';
  txt.textContent = name + ' 已完成電子簽名（' + time + '）';
  el.appendChild(icon);
  el.appendChild(txt);
}

/* ── IR TABLE FILTER ── */
export function filterIR(btn,s){
  document.querySelectorAll('.fb').forEach(b => {
    b.classList.remove('act');
  });
  btn.classList.add('act');
  document.querySelectorAll('#ir-tbl tbody tr').forEach(tr => {
    tr.style.display=(s==='all'||tr.dataset.s===s)?'':'none';
  });
}

export function initIRFilter() {
  document.querySelectorAll('.fbar .fb').forEach((b,i)=>{
    const map=['all','wait','pass','fail'];
    b.onclick=()=>filterIR(b,map[i]);
  });
}

/* ═══ DATA SETTERS ═══ */
export function setIRDetail(id,loc,item,date,result,l1,l2,l3){
  document.getElementById('ird-id').textContent=id;
  document.getElementById('ird-loc').textContent=loc;
  document.getElementById('ird-item').textContent=item;
  document.getElementById('ird-date').textContent=date;
  const rMap={'通過':'<span class="tag tg">通過</span>','進行中':'<span class="tag ta">進行中</span>','退件':'<span class="tag tr">退件</span>'};
  document.getElementById('ird-result').innerHTML=rMap[result]||result;
  const lMap={pass:'<span class="tag tg">合格</span>',fail:'<span class="tag tr">不合格</span>',pending:'<span class="tag ta">待審</span>'};
  ['l1','l2','l3'].forEach((k,i)=>{const v=[l1,l2,l3][i];document.getElementById('ird-'+k).innerHTML=lMap[v]||'<span class="tag tx">—</span>';});
  // Derive description from result
  var notes={
    'IR-2025-0316':'B2F天花板機電管路隱蔽前查驗，一、二級查驗均已通過，施工已可繼續。第三級集中送驗資料待本期請款時一併提交。',
    'IR-2025-0315':'B3F底板柱C-11鋼筋綁紮，一、二級查驗通過，已進行混凝土澆置。第三級已納入本期請款送驗包。',
    'IR-2025-0305':'B3F地下連續壁接頭品質查驗，接頭處無滲漏、無蜂窩，三級查驗全數通過。',
    'IR-2025-0318':'B3F底板柱C-12鋼筋綁紮，第一級已合格，待第二級監造工程師現場查驗。',
    'IR-2025-0317':'2F樓板S-B2區域模板組立，第一級已合格，待第二級監造工程師確認。',
    'IR-2025-0309':'2F樓板S-A1鋼筋保護層不足，第二級監造工程師查驗不合格，已退件並開立NCR-087。',
  };
  const el=document.getElementById('ird-notes');
  if(el) el.textContent=notes[id]||'—';
}
export function setNCRDetail(id,title,type,vendor,deadline,status,desc){
  document.getElementById('ncrd-id').textContent=id+' — '+title;
  document.getElementById('ncrd-type').textContent=type;
  document.getElementById('ncrd-vendor').innerHTML='<strong>'+vendor+'</strong>';
  var sMap={open:'<span class="tag tr">開立中</span>',overdue:'<span class="tag tr">改善逾期</span>',improving:'<span class="tag ta">改善中</span>',pending_re:'<span class="tag tb">待複驗</span>',overdue_re:'<span class="tag tr">複驗逾期</span>',closed:'<span class="tag tg">已關閉</span>'};
  const isOv=status==='overdue'||status==='overdue_re';
  document.getElementById('ncrd-deadline').innerHTML=(isOv?'<span style="color:var(--red)">':'')+'改善期限：'+deadline+(isOv?' ─ 已逾期</span>':'');
  document.getElementById('ncrd-status').innerHTML=sMap[status]||'—';
  document.getElementById('ncrd-desc').textContent=desc;
}
export function setSubDetail(name,work,pct,status){
  document.getElementById('subd-name').textContent=name;
  document.getElementById('subd-work').textContent=work;
  document.getElementById('subd-pct').innerHTML='<strong>'+pct+'%</strong>';
  document.getElementById('subd-bar-pct').textContent=pct+'%';
  document.getElementById('subd-bar').style.width=pct+'%';
  var sMap={'施工中':'<span class="tag tg">施工中</span>','進度落後':'<span class="tag ta">進度落後</span>','進場準備':'<span class="tag to">進場準備</span>'};
  document.getElementById('subd-status').innerHTML=sMap[status]||status;
  var contractData={
    '誠實營造':{contract:'$32,500,000',period:'2024/03 ～ 2025/08',scope:'B1F~15F 全棟結構鋼筋綁紮工程'},
    '王子水電':{contract:'$45,800,000',period:'2024/06 ～ 2025/10',scope:'消防、空調冷媒、電氣幹管、給排水全棟配管'},
    '大地模板':{contract:'$12,800,000',period:'2024/03 ～ 2025/06',scope:'B3F~15F 模板組立與拆除'},
    '永達預拌混凝土':{contract:'$28,600,000',period:'2024/03 ～ 2025/08',scope:'全棟各樓層混凝土供料'},
    '建新帷幕':{contract:'$62,400,000',period:'2025/01 ～ 2025/12',scope:'外牆全幕牆玻璃帷幕系統'},
  };
  var d=contractData[name]||{contract:'—',period:'—',scope:'—'};
  var sc=document.getElementById('subd-contract');  if(sc) sc.textContent=d.contract;
  var sp=document.getElementById('subd-period');    if(sp) sp.textContent=d.period;
  var ss=document.getElementById('subd-scope');     if(ss) ss.textContent=d.scope;
  subTab(1);
}
export function subTab(n){
  // Tabs removed — sub modal is now single flat layout
}
export function addWorkLog(){
  var f=document.getElementById('wl-form');
  var today = new Date().toISOString().split('T')[0];
  if(f){
    f.style.display='block';
    document.getElementById('wl-date').value=today;
  }
}
export function saveWorkLog(){
  var date=document.getElementById('wl-date').value;
  var workers=document.getElementById('wl-workers').value||'—';
  var progress=document.getElementById('wl-progress').value||'—';
  var notes=document.getElementById('wl-notes').value||'—';
  var rating=document.getElementById('wl-rating').value;
  var quality=document.getElementById('wl-quality').value;
  var coop=document.getElementById('wl-coop').value;
  var entry=document.createElement('div');
  entry.style.cssText='background:var(--s3);border:1px solid var(--bd1);border-radius:var(--r-sm);padding:13px;margin-bottom:10px';
  entry.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px"><span class="fm-font" style="font-size:10px;color:var(--gold-txt)">'+date+'</span><span class="tag to">'+rating.split(' ')[0]+'</span></div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:8px">'+
    '<div><div class="fm-font" style="font-size:8px;color:var(--tx3);margin-bottom:3px">出工</div><div style="font-size:14px;font-weight:600;color:var(--tx1)">'+workers+' 人</div></div>'+
    '<div><div class="fm-font" style="font-size:8px;color:var(--tx3);margin-bottom:3px">進度</div><div style="font-size:14px;font-weight:600;color:var(--green)">'+progress+'%</div></div>'+
    '<div><div class="fm-font" style="font-size:8px;color:var(--tx3);margin-bottom:3px">品質</div><span class="tag tg">'+quality+'</span></div>'+
    '<div><div class="fm-font" style="font-size:8px;color:var(--tx3);margin-bottom:3px">配合</div><span class="tag tg">'+coop+'</span></div></div>'+
    '<div style="font-size:11px;color:var(--tx3)">備註：'+notes+'</div>';
  var entries=document.getElementById('work-log-entries');
  if(entries) entries.insertBefore(entry,entries.firstChild);
  document.getElementById('wl-form').style.display='none';
  toast('出工記錄已儲存','ts');
}
export function setBillingDetail(period,range,pct,applied,approved,paid){
  document.getElementById('bd-title').textContent='第 '+period+' 期請款記錄';
  document.getElementById('bd-period').textContent='請款期間：'+range;
  document.getElementById('bd-pct').textContent=pct;
  document.getElementById('bd-applied').textContent=applied;
  document.getElementById('bd-approved').innerHTML='<strong style="color:var(--gold-txt)">'+approved+'</strong>';
  document.getElementById('bd-paid').textContent=paid;
}
export function setMatDetail(date,name,vendor,qty,unit,result,report){
  document.getElementById('matd-sub').textContent=name;
  document.getElementById('matd-date').textContent=date;
  document.getElementById('matd-name').textContent=name;
  document.getElementById('matd-vendor').textContent=vendor;
  document.getElementById('matd-qty').textContent=qty+' '+unit;
  document.getElementById('matd-result').innerHTML='<span class="tag '+(result==='合格'?'tg':'tr')+'">'+result+'</span>';
  document.getElementById('matd-report').textContent=report;
}
export function setMatReturn(name,vendor,qty){
  document.getElementById('matr-sub').textContent=name+' — 退料申請';
  document.getElementById('matr-name').textContent=name;
  document.getElementById('matr-vendor').textContent=vendor;
  document.getElementById('matr-qty').textContent=qty;
}
export function setMatQC(date,name,vendor,qty,unit,sample){
  document.getElementById('matqc-sub').textContent=name+' — '+vendor;
  document.getElementById('matqc-date').textContent=date;
  document.getElementById('matqc-name').textContent=name;
  document.getElementById('matqc-vendor').textContent=vendor;
  document.getElementById('matqc-qty').textContent=qty+' '+unit;
  document.getElementById('matqc-sample').innerHTML=sample==='待'?'<span class="tag ta">待送驗</span>':'<span class="tag tg">'+sample+'</span>';
}
export function setMorningView(date,weather,actual,plan,works,safety,note){
  document.getElementById('mv-date').textContent=date+' 晨會記錄';
  document.getElementById('mv-weather').textContent='天氣：'+weather;
  document.getElementById('mv-actual').innerHTML='<strong>'+actual+' 人</strong>';
  document.getElementById('mv-plan').textContent=plan+' 人';
  document.getElementById('mv-works').textContent=works;
  document.getElementById('mv-safety').innerHTML=safety;
  document.getElementById('mv-note').textContent=note;
}
export function setDocView(name,rev,cat,date,author,status,desc){
  document.getElementById('dv-name').textContent=name;
  document.getElementById('dv-cat').textContent=cat+' ／ '+status;
  document.getElementById('dv-rev').textContent=rev;
  document.getElementById('dv-date').textContent=date;
  document.getElementById('dv-author').textContent=author;
  document.getElementById('dv-desc').textContent=desc;
}
export function setDocReview(name,rev,author,date){
  document.getElementById('dr-name').textContent='審查：'+name;
  document.getElementById('dr-sub').textContent='提交單位：'+author;
  document.getElementById('dr-rev').textContent=rev;
  document.getElementById('dr-author').textContent=author;
  document.getElementById('dr-date').textContent=date;
}
