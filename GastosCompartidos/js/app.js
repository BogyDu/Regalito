// ═══════════════════════════════════════════════
//  js/app.js — Main application logic
// ═══════════════════════════════════════════════

import * as DB from "./db.js";
import { exportToExcel } from "./export.js";
import { APP_CONFIG, DEFAULT_CATEGORIES } from "../config.js";

// ── Constants ──
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MABBR = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const TYPE_BADGE = { income:'badge-ing', fixed:'badge-fix', variable:'badge-var', other:'badge-oth' };
const TYPE_LABEL = { income:'Ingreso', fixed:'Gasto fijo', variable:'Gasto variable', other:'Otro' };
const TYPE_COLOR = { income:'c-ing', fixed:'c-fix', variable:'c-var', other:'c-acc' };

// ── State ──
let curUser  = null;
let curMon   = new Date().getMonth();
let curYear  = new Date().getFullYear();
let curPage  = 'resumen';
let curPerson = 'todos';
let cats     = {};
let yearData = {};    // { month: { budgets, transactions } }
let fixedList = [];
let txList   = [];    // current month transactions (live)
let noteCtx  = null;
let addItemCtx = null;
let saveQueue  = {};  // batched budget saves
let saveTimer  = null;

// Unsubscribe handles
let unsubYear  = null;
let unsubCats  = null;
let unsubFixed = null;
let unsubTxs   = null;

// ── Helpers ──
const $ = id => document.getElementById(id);
const fmt = v => {
  const n = parseFloat(v);
  return isNaN(n) ? '—' : n.toLocaleString(APP_CONFIG.locale, { style:'currency', currency:APP_CONFIG.currency, minimumFractionDigits:2 });
};
const pct = v => (v === 0 ? '0.0%' : (!v ? '—' : (v*100).toFixed(1)+'%'));
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const todayStr = () => {
  const d = new Date();
  return `${curYear}-${String(curMon+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// ── Toast ──
function toast(msg, type = 'ok') {
  const el = $('toast');
  el.className = type === 'saving' ? 'show saving' : type === 'error' ? 'show err' : 'show';
  $('toast-text').textContent = msg;
  clearTimeout(el._h);
  if (type !== 'saving') el._h = setTimeout(() => el.classList.remove('show'), 2400);
}

// ── Overlays ──
function openSheet(id) { $(id).classList.add('open'); }
function closeSheet(id) { $(id).classList.remove('open'); }
document.querySelectorAll('.overlay').forEach(ov =>
  ov.addEventListener('click', e => { if (e.target === ov) closeSheet(ov.id); }));

// ── Auth ──
DB.onAuth(user => {
  if (user) {
    curUser = user;
    showScreen('app');
    initApp();
  } else {
    curUser = null;
    showScreen('auth');
  }
});

function showScreen(s) {
  $('auth-screen').style.display = s === 'auth' ? 'flex' : 'none';
  $('loader').style.display      = s === 'loader' ? 'flex' : 'none';
  $('app').style.display         = s === 'app' ? 'block' : 'none';
}

// ── Init ──
function initApp() {
  // Year selector
  const sel = $('year-sel');
  sel.innerHTML = '';
  for (let y = curYear - 2; y <= curYear + 2; y++) {
    sel.innerHTML += `<option value="${y}"${y === curYear ? ' selected' : ''}>${y}</option>`;
  }

  // User info
  const av = $('user-avatar');
  if (curUser.photoURL) av.innerHTML = `<img src="${esc(curUser.photoURL)}" alt=""/>`;
  else av.textContent = (curUser.displayName || 'U')[0].toUpperCase();
  $('user-name-short').textContent = (curUser.displayName || '').split(' ')[0];
  if ($('cfg-name'))  $('cfg-name').textContent  = curUser.displayName || '—';
  if ($('cfg-email')) $('cfg-email').textContent = curUser.email || '—';

  buildPersonTabs();
  buildMonthStrip();
  loadAll();
}

function buildPersonTabs() {
  const persons = APP_CONFIG.persons;
  const container = $('person-tabs');
  if (!container) return;
  container.innerHTML = `<button class="ptab active" onclick="setPerson('todos')">Todos</button>` +
    persons.map((p, i) => `<button class="ptab" onclick="setPerson('${esc(p)}')">${esc(p)}</button>`).join('');
}

function buildMonthStrip() {
  const strip = $('month-strip');
  strip.innerHTML = MESES.map((m, i) =>
    `<button class="mbtn${i === curMon ? ' active' : ''}" onclick="setMonth(${i})">${MABBR[i]}</button>`
  ).join('');
}

function updateMonthStrip() {
  document.querySelectorAll('.mbtn').forEach((b, i) => b.classList.toggle('active', i === curMon));
}

// ── Load all live data ──
function loadAll() {
  // Categories
  if (unsubCats) unsubCats();
  unsubCats = DB.watchCats(data => {
    cats = data && Object.keys(data).length ? data : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    loadYearData();
  });

  // Fixed
  if (unsubFixed) unsubFixed();
  unsubFixed = DB.watchFixed(list => {
    fixedList = list;
    if (curPage === 'config') renderConfig();
  });
}

function loadYearData() {
  if (unsubYear) unsubYear();
  unsubYear = DB.watchYear(curYear, data => {
    yearData = data || {};
    loadMonthTxs();
    renderCurrentPage();
  });
}

function loadMonthTxs() {
  if (unsubTxs) unsubTxs();
  unsubTxs = DB.watchTxs(curYear, curMon, list => {
    txList = list;
    if (curPage === 'gastos') renderGastos();
    // refresh summary totals
    if (curPage === 'resumen') refreshSummary();
  });
}

// ── Navigation ──
function navTo(page) {
  curPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  const titles = { resumen:'Resumen', gastos:'Gastos & Transacciones', anual:'Resumen Anual', config:'Configuración' };
  $('topbar-title').textContent = titles[page] || page;
  const fab = $('fab');
  fab.style.display = (page === 'resumen' || page === 'gastos') ? 'flex' : 'none';
  renderCurrentPage();
}

function renderCurrentPage() {
  if (curPage === 'resumen') renderResumen();
  else if (curPage === 'gastos') renderGastos();
  else if (curPage === 'anual') renderAnual();
  else if (curPage === 'config') renderConfig();
}

// ── Totals calculation ──
function calcTotals(m) {
  const bud = yearData[m]?.budgets || {};
  let ing = 0, exp = 0;
  Object.entries(cats).forEach(([catId, cfg]) => {
    cfg.items.forEach(item => {
      const v = parseFloat(bud[catId]?.[item]?.real || 0) || 0;
      if (cfg.type === 'income') ing += v; else exp += v;
    });
  });
  return { ing, exp, ahorro: ing - exp, tasa: ing ? (ing - exp) / ing : 0 };
}

// ── RENDER RESUMEN ──
function renderResumen() {
  refreshSummary();

  const grid = $('budget-grid');
  grid.innerHTML = '';

  // Group cats by type for ordering
  const ORDER = ['income', 'fixed', 'variable', 'other'];
  const grouped = {};
  ORDER.forEach(t => grouped[t] = []);
  Object.entries(cats).forEach(([id, cfg]) => {
    const t = cfg.type || 'other';
    if (grouped[t]) grouped[t].push([id, cfg]); else grouped['other'].push([id, cfg]);
  });

  ORDER.forEach(type => {
    grouped[type].forEach(([catId, cfg]) => {
      const card = buildBudgetCard(catId, cfg);
      if (card) grid.appendChild(card);
    });
  });
}

function refreshSummary() {
  const T = calcTotals(curMon);
  $('sum-ing').textContent   = fmt(T.ing);
  $('sum-exp').textContent   = fmt(T.exp);
  const sa = $('sum-ahorro');
  sa.textContent = fmt(T.ahorro);
  sa.className = 'sc-val ' + (T.ahorro >= 0 ? 'c-ing' : 'c-danger');
  $('sum-tasa').textContent  = pct(T.tasa);
}

function buildBudgetCard(catId, cfg) {
  let subP = 0, subR = 0;
  const bud = yearData[curMon]?.budgets || {};
  cfg.items.forEach(item => {
    subP += parseFloat(bud[catId]?.[item]?.presup || 0) || 0;
    subR += parseFloat(bud[catId]?.[item]?.real   || 0) || 0;
  });
  const colCls = TYPE_COLOR[cfg.type] || 'c-acc';

  const div = document.createElement('div');
  div.className = 'card';

  // Header
  div.innerHTML = `
    <div class="card-hdr">
      <span class="card-hdr-title ${colCls}">${esc(cfg.label)}</span>
      <span class="card-hdr-title ${colCls}">${fmt(subR)}</span>
    </div>
    <div class="brow-head">
      <span>Concepto</span><span>Presup.</span><span>Real</span><span></span>
    </div>`;

  // Item rows
  cfg.items.forEach((item, idx) => {
    const b = bud[catId]?.[item] || {};
    const p = b.presup || '';
    const r = b.real   || '';
    const n = b.nota   || '';
    const pN = parseFloat(p) || 0, rN = parseFloat(r) || 0;

    const row = document.createElement('div');
    row.className = 'brow';
    row.innerHTML = `
      <span class="brow-lbl">${esc(item)}${n ? `<small title="${esc(n)}">📝 ${esc(n.substring(0,22))}${n.length>22?'…':''}</small>` : ''}</span>
      <input class="num-inp dim" type="number" inputmode="decimal" step="0.01" placeholder="0.00"
        value="${esc(p)}" data-cat="${esc(catId)}" data-idx="${idx}" data-field="presup"
        oninput="onBudgetInput(this)" onblur="flushSave()"/>
      <input class="num-inp" type="number" inputmode="decimal" step="0.01" placeholder="0.00"
        value="${esc(r)}" data-cat="${esc(catId)}" data-idx="${idx}" data-field="real"
        oninput="onBudgetInput(this)" onblur="flushSave()"/>
      <div class="brow-acts">
        <button class="icon-btn${n ? ' note-on' : ''}" title="Nota" onclick="openNoteModal('${esc(catId)}',${idx})">📝</button>
      </div>`;
    div.appendChild(row);

    // Progress bar
    if (pN > 0) {
      const pct2 = Math.min(rN / pN, 1.5);
      const color = pct2 > 1 ? 'var(--danger)' : pct2 > 0.85 ? 'var(--warn)' : 'var(--ing)';
      const prog = document.createElement('div');
      prog.className = 'prog-bar-wrap';
      prog.innerHTML = `<div class="prog-bar" style="width:${Math.min(pct2,1)*100}%;background:${color}"></div>`;
      div.appendChild(prog);
    }
  });

  // Quick add item
  const qa = document.createElement('div');
  qa.className = 'quick-row';
  qa.innerHTML = `
    <input class="quick-inp" placeholder="Añadir concepto…" data-cat="${esc(catId)}"
      onkeydown="if(event.key==='Enter') quickAddItem(this)"/>
    <button class="btn-quick" onclick="quickAddItem(this.previousElementSibling)">＋</button>`;
  div.appendChild(qa);

  return div;
}

// ── Budget input ──
window.onBudgetInput = (inp) => {
  const catId = inp.dataset.cat, idx = parseInt(inp.dataset.idx), field = inp.dataset.field;
  const item  = cats[catId]?.items[idx];
  if (!item) return;
  // Update local state immediately
  if (!yearData[curMon]) yearData[curMon] = {};
  if (!yearData[curMon].budgets) yearData[curMon].budgets = {};
  const b = yearData[curMon].budgets;
  if (!b[catId]) b[catId] = {};
  if (!b[catId][item]) b[catId][item] = {};
  b[catId][item][field] = inp.value;
  // Queue save
  const key = `${catId}|${item}|${field}`;
  saveQueue[key] = { catId, item, field, value: inp.value };
  toast('Guardando…', 'saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 1000);
  refreshSummary();
};

window.flushSave = async () => {
  if (!Object.keys(saveQueue).length) return;
  const q = { ...saveQueue };
  saveQueue = {};
  try {
    await Promise.all(Object.values(q).map(({ catId, item, field, value }) =>
      DB.saveBudgetField(curYear, curMon, catId, item, field, value)));
    toast('Guardado ✓');
  } catch (e) {
    console.error('Save error', e);
    toast('Error al guardar', 'error');
  }
};

// ── Quick add item ──
window.quickAddItem = async (inp) => {
  const name  = inp.value.trim();
  const catId = inp.dataset.cat;
  if (!name || !catId || cats[catId]?.items.includes(name)) { inp.value = ''; return; }
  cats[catId].items.push(name);
  await DB.saveCats(cats);
  inp.value = '';
};

// ── Note modal ──
window.openNoteModal = (catId, idx) => {
  noteCtx = { catId, idx };
  const item = cats[catId]?.items[idx];
  const nota = yearData[curMon]?.budgets?.[catId]?.[item]?.nota || '';
  $('nota-text').value = nota;
  openSheet('ov-nota');
  setTimeout(() => $('nota-text').focus(), 250);
};

window.saveNota = async () => {
  if (!noteCtx) return;
  const { catId, idx } = noteCtx;
  const item = cats[catId]?.items[idx];
  const nota = $('nota-text').value.trim();
  // Save directly
  try {
    await DB.saveBudgetField(curYear, curMon, catId, item, 'nota', nota || null);
    toast('Nota guardada ✓');
  } catch(e) { toast('Error', 'error'); }
  closeSheet('ov-nota');
  noteCtx = null;
};

// ── Add item modal ──
window.openAddItemModal = (catId) => {
  addItemCtx = { catId };
  $('additem-title').textContent = `Añadir a ${cats[catId]?.label || catId}`;
  $('additem-inp').value = '';
  openSheet('ov-additem');
  setTimeout(() => $('additem-inp').focus(), 250);
};

window.confirmAddItem = async () => {
  if (!addItemCtx) return;
  const name = $('additem-inp').value.trim();
  if (!name) return;
  const { catId } = addItemCtx;
  if (cats[catId]?.items.includes(name)) { closeSheet('ov-additem'); return; }
  cats[catId].items.push(name);
  try {
    await DB.saveCats(cats);
    toast('Concepto añadido ✓');
  } catch(e) { toast('Error', 'error'); }
  closeSheet('ov-additem');
};

window.removeItem = async (catId, idx) => {
  confirm2(`¿Eliminar "${cats[catId]?.items[idx]}"?`, async () => {
    cats[catId].items.splice(idx, 1);
    await DB.saveCats(cats);
    toast('Eliminado ✓');
  });
};

// ── Add / remove category ──
window.addCategory = async () => {
  const name = $('new-cat-name').value.trim();
  const type = $('new-cat-type').value;
  if (!name) { toast('Escribe un nombre', 'error'); return; }
  const icons = { income:'💰', fixed:'🏠', variable:'🛒', other:'📁' };
  const id = 'cat_' + Date.now();
  cats[id] = { label: `${icons[type]} ${name}`, type, items: [] };
  try {
    await DB.saveCats(cats);
    $('new-cat-name').value = '';
    toast('Categoría creada ✓');
  } catch(e) { toast('Error al crear', 'error'); }
};

window.removeCategory = async (catId) => {
  const isDefault = ['ingresos','gastos_fijos','gastos_variables'].includes(catId);
  if (isDefault) { toast('No puedes eliminar las categorías por defecto', 'error'); return; }
  confirm2(`¿Eliminar la categoría "${cats[catId]?.label}"?`, async () => {
    delete cats[catId];
    await DB.saveCats(cats);
    toast('Categoría eliminada ✓');
  });
};

// ── RENDER GASTOS ──
function renderGastos() {
  // Summary
  let tGasto = 0, tIng = 0;
  const personFilter = curPerson === 'todos' ? null : curPerson;
  const filtered = personFilter ? txList.filter(tx => tx.persona === personFilter) : txList;
  filtered.forEach(tx => {
    if (tx.tipo === 'gasto') tGasto += tx.importe || 0;
    else tIng += tx.importe || 0;
  });
  const bal = tIng - tGasto;
  $('tx-sum-gasto').textContent = fmt(tGasto);
  $('tx-sum-ing').textContent   = fmt(tIng);
  const txBal = $('tx-sum-bal');
  txBal.textContent = fmt(bal);
  txBal.className = 'sc-val ' + (bal >= 0 ? 'c-ing' : 'c-danger');

  // List
  const wrap = $('tx-list-wrap');
  if (!filtered.length) {
    const who = personFilter ? ` de ${personFilter}` : '';
    wrap.innerHTML = `<div class="empty"><div class="ei">💳</div><p>No hay transacciones${who} en ${MESES[curMon]}.<br/>Pulsa <strong>＋ Transacción</strong> para añadir.</p></div>`;
    return;
  }

  // Group by date
  const groups = {};
  filtered.forEach(tx => {
    const k = tx.fecha || 'Sin fecha';
    if (!groups[k]) groups[k] = [];
    groups[k].push(tx);
  });

  wrap.innerHTML = Object.entries(groups)
    .sort(([a],[b]) => b.localeCompare(a))
    .map(([fecha, txs]) => {
      const d = new Date(fecha + 'T12:00:00');
      const lbl = fecha === 'Sin fecha' ? 'Sin fecha'
        : d.toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'long' });
      const rows = txs.map(tx => {
        const esG = tx.tipo === 'gasto';
        const catLabel = tx.catId && cats[tx.catId] ? cats[tx.catId].label : '';
        const meta = [catLabel, tx.item, tx.persona, tx.nota].filter(Boolean).join(' · ');
        return `<div class="tx-row">
          <div class="tx-icon ${tx.tipo}">${esG ? '💸' : '💰'}</div>
          <div class="tx-body">
            <div class="tx-desc">${esc(tx.desc)}</div>
            ${meta ? `<div class="tx-meta">${esc(meta)}</div>` : ''}
          </div>
          <div class="tx-right">
            <div class="tx-amt ${tx.tipo}">${esG?'−':'+'} ${fmt(tx.importe)}</div>
          </div>
          <button class="tx-del" onclick="doDeleteTx('${esc(tx.id)}')" title="Eliminar">✕</button>
        </div>`;
      }).join('');
      return `<div class="tx-group-lbl">${esc(lbl)}</div><div class="card">${rows}</div>`;
    }).join('');
}

// ── TX Modal ──
window.openTxModal = () => {
  $('tx-fecha').value = todayStr();
  $('tx-desc').value  = '';
  $('tx-imp').value   = '';
  $('tx-nota').value  = '';
  $('tx-tipo').value  = 'gasto';
  // Default persona
  if (APP_CONFIG.persons.length) $('tx-persona').value = APP_CONFIG.persons[0];
  updateTxCats();
  openSheet('ov-tx');
  setTimeout(() => $('tx-desc').focus(), 300);
};

window.updateTxCats = () => {
  const tipo  = $('tx-tipo').value;
  const sel   = $('tx-cat');
  sel.innerHTML = '<option value="">Sin categoría</option>';
  Object.entries(cats).forEach(([id, cfg]) => {
    const isIncome = cfg.type === 'income';
    if ((tipo === 'ingreso' && isIncome) || (tipo === 'gasto' && !isIncome)) {
      sel.innerHTML += `<option value="${esc(id)}">${esc(cfg.label)}</option>`;
    }
  });
  updateTxItems();
};

window.updateTxItems = () => {
  const catId = $('tx-cat').value;
  const sel   = $('tx-item');
  sel.innerHTML = '<option value="">Sin ítem</option>';
  if (catId && cats[catId]) {
    cats[catId].items.forEach(item =>
      sel.innerHTML += `<option value="${esc(item)}">${esc(item)}</option>`);
  }
};

window.saveTx = async () => {
  const desc   = $('tx-desc').value.trim();
  const imp    = parseFloat($('tx-imp').value);
  const fecha  = $('tx-fecha').value;
  if (!desc || isNaN(imp) || imp <= 0 || !fecha) {
    toast('Rellena descripción, fecha e importe', 'error');
    return;
  }
  // Determine month from date
  const m = parseInt(fecha.split('-')[1]) - 1;
  const y = parseInt(fecha.split('-')[0]);
  const tx = {
    desc, importe: imp, fecha,
    tipo:    $('tx-tipo').value,
    catId:   $('tx-cat').value,
    item:    $('tx-item').value,
    persona: $('tx-persona').value,
    nota:    $('tx-nota').value.trim(),
    creadoPor: curUser.displayName || DB.uid()
  };
  try {
    await DB.addTx(y, m, tx);
    toast('Transacción guardada ✓');
    closeSheet('ov-tx');
    // Switch to gastos view to see it
    if (m === curMon) navTo('gastos');
  } catch(e) {
    console.error('saveTx error', e);
    toast('Error al guardar', 'error');
  }
};

window.doDeleteTx = (txId) => {
  confirm2('¿Eliminar esta transacción?', async () => {
    await DB.deleteTx(curYear, curMon, txId);
    toast('Eliminada ✓');
  });
};

// ── RENDER ANUAL ──
function renderAnual() {
  $('anual-year').textContent = curYear;
  const tbl = $('annual-tbl');
  let html = `<thead><tr><th>Concepto</th>${MABBR.map(a=>`<th>${a}</th>`).join('')}<th>Total</th><th>Media</th></tr></thead><tbody>`;

  Object.entries(cats).forEach(([catId, cfg]) => {
    const col = TYPE_COLOR[cfg.type] || 'c-acc';
    html += `<tr class="sec-row"><td colspan="15" class="${col}">${esc(cfg.label)}</td></tr>`;
    cfg.items.forEach(item => {
      const vals = Array.from({length:12}, (_,m) =>
        parseFloat(yearData[m]?.budgets?.[catId]?.[item]?.real || 0) || 0);
      const total = vals.reduce((a,b)=>a+b,0);
      html += `<tr><td style="padding-left:1.25rem">${esc(item)}</td>
        ${vals.map(v=>`<td class="${v>0?col:''}">${v?fmt(v):'—'}</td>`).join('')}
        <td class="${col}" style="font-weight:700">${total?fmt(total):'—'}</td>
        <td class="${col}">${total?fmt(total/12):'—'}</td></tr>`;
    });
  });

  const MT = Array.from({length:12}, (_,m) => calcTotals(m));
  [
    ['🔴 Total gastos',     m => MT[m].exp,    m => 'c-danger'],
    ['💰 Total ingresos',   m => MT[m].ing,    () => 'c-ing'],
    ['💚 Ahorro / Déficit', m => MT[m].ahorro, m => MT[m].ahorro>=0?'c-ing':'c-danger'],
    ['📈 Tasa de ahorro',   m => pct(MT[m].tasa), () => 'c-acc'],
  ].forEach(([label, getter, colorFn]) => {
    const vals  = Array.from({length:12}, (_,m) => getter(m));
    const isNum = typeof vals[0] === 'number';
    const total = isNum ? vals.reduce((a,b)=>a+b,0) : null;
    html += `<tr class="sum-row"><td>${label}</td>
      ${vals.map((v,m)=>`<td class="${colorFn(m)}">${isNum?fmt(v):v}</td>`).join('')}
      <td class="${colorFn(0)}">${total!=null?fmt(total):'—'}</td>
      <td>${total!=null&&isNum?fmt(total/12):'—'}</td></tr>`;
  });
  tbl.innerHTML = html + '</tbody>';
}

// ── RENDER CONFIG ──
function renderConfig() {
  // Fixed expenses
  const fc = $('fixed-card');
  if (fixedList.length === 0) {
    fc.innerHTML = `<div style="padding:1rem 1.1rem;color:var(--muted);font-size:.85rem">Sin gastos fijos configurados.</div>`;
  } else {
    fc.innerHTML = fixedList.map(fx => {
      const catLabel = fx.catId && cats[fx.catId] ? cats[fx.catId].label : '';
      return `<div class="fixed-row">
        <div style="min-width:0;flex:1">
          <div class="fixed-name">${esc(fx.name)}</div>
          <div class="fixed-meta">${esc(catLabel)}${fx.item?` · ${esc(fx.item)}`:''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:.5rem;flex-shrink:0">
          <span style="font-family:'Syne',sans-serif;font-weight:700;color:var(--fixed)">${fmt(fx.importe)}</span>
          <button class="btn btn-danger btn-sm" onclick="doDeleteFixed('${esc(fx.id)}')">✕</button>
        </div>
      </div>`;
    }).join('');
  }

  // Categories
  const cc = $('config-cats');
  cc.innerHTML = '';
  Object.entries(cats).forEach(([catId, cfg]) => {
    const isDefault = ['ingresos','gastos_fijos','gastos_variables'].includes(catId);
    const colCls = TYPE_COLOR[cfg.type] || 'c-acc';
    const block  = document.createElement('div');
    block.className = 'cat-block';
    block.innerHTML = `
      <div class="cat-block-hdr">
        <div class="cat-block-hdr-l">
          <span class="cat-block-title ${colCls}">${esc(cfg.label)}</span>
          <span class="badge ${TYPE_BADGE[cfg.type]||'badge-oth'}">${TYPE_LABEL[cfg.type]||'Otro'}</span>
        </div>
        <div style="display:flex;gap:.4rem">
          <button class="btn btn-ghost btn-sm" onclick="openAddItemModal('${esc(catId)}')">＋ Ítem</button>
          ${!isDefault ? `<button class="btn btn-danger btn-sm" onclick="removeCategory('${esc(catId)}')">🗑️</button>` : ''}
        </div>
      </div>
      ${cfg.items.map((item,idx)=>`
        <div class="cat-item-row">
          <span class="cat-item-lbl">· ${esc(item)}</span>
          <button class="btn btn-ghost btn-xs" style="color:var(--danger)" onclick="removeItem('${esc(catId)}',${idx})">Quitar</button>
        </div>`).join('')}
      ${!cfg.items.length ? `<div style="padding:.6rem 1.1rem .6rem 1.6rem;color:var(--muted);font-size:.78rem">Sin conceptos</div>` : ''}`;
    cc.appendChild(block);
  });

  // Names config
  const p1 = $('cfg-p1'), p2 = $('cfg-p2');
  if (p1) p1.value = APP_CONFIG.persons[0] || '';
  if (p2) p2.value = APP_CONFIG.persons[1] || '';
}

// ── Fixed expense modal ──
window.openFixedModal = () => {
  $('fixed-name').value = ''; $('fixed-imp').value = '';
  const sel = $('fixed-cat');
  sel.innerHTML = '<option value="">Sin categoría</option>';
  Object.entries(cats).filter(([,c]) => c.type !== 'income').forEach(([id,cfg]) =>
    sel.innerHTML += `<option value="${esc(id)}">${esc(cfg.label)}</option>`);
  sel.onchange = () => {
    const catId = sel.value;
    const iSel  = $('fixed-item');
    iSel.innerHTML = '<option value="">Sin ítem</option>';
    if (catId && cats[catId]) cats[catId].items.forEach(item =>
      iSel.innerHTML += `<option value="${esc(item)}">${esc(item)}</option>`);
  };
  sel.onchange();
  openSheet('ov-fixed');
};

window.saveFixed = async () => {
  const name = $('fixed-name').value.trim();
  const imp  = parseFloat($('fixed-imp').value);
  if (!name || isNaN(imp) || imp <= 0) { toast('Rellena nombre e importe', 'error'); return; }
  try {
    await DB.addFixed({ name, importe: imp, catId: $('fixed-cat').value, item: $('fixed-item').value });
    toast('Gasto fijo añadido ✓');
    closeSheet('ov-fixed');
  } catch(e) { toast('Error', 'error'); }
};

window.doDeleteFixed = (id) => {
  confirm2('¿Eliminar este gasto fijo?', async () => {
    await DB.deleteFixed(id);
    toast('Eliminado ✓');
  });
};

window.doApplyFixed = async () => {
  if (!fixedList.length) { toast('No hay gastos fijos configurados', 'error'); return; }
  try {
    await DB.applyFixedToMonth(curYear, curMon, fixedList, cats);
    toast(`Gastos fijos aplicados a ${MESES[curMon]} ✓`);
  } catch(e) { toast('Error', 'error'); }
};

// ── Confirm dialog ──
function confirm2(msg, cb) {
  $('confirm-msg').textContent = msg;
  $('confirm-ok').onclick = () => { closeSheet('ov-confirm'); cb(); };
  openSheet('ov-confirm');
}

// ── Person tabs ──
window.setPerson = (p) => {
  curPerson = p;
  document.querySelectorAll('.ptab').forEach(b =>
    b.classList.toggle('active', b.textContent === (p === 'todos' ? 'Todos' : p)));
  if (curPage === 'gastos') renderGastos();
};

// ── Month & Year ──
window.setMonth = (m) => {
  curMon = m;
  updateMonthStrip();
  loadMonthTxs();
  renderCurrentPage();
};

window.changeYear = () => {
  curYear = parseInt($('year-sel').value);
  if (unsubYear) { unsubYear(); unsubYear = null; }
  if (unsubTxs)  { unsubTxs();  unsubTxs  = null; }
  loadYearData();
};

// ── Export ──
window.doExport = async () => {
  toast('Generando Excel…', 'saving');
  try {
    const allData = await DB.getYearData(curYear);
    // Convert to month-indexed
    const byMonth = {};
    Object.entries(allData).forEach(([m, v]) => { byMonth[parseInt(m)] = v; });
    await exportToExcel({
      year: curYear,
      yearData: byMonth,
      cats,
      fixedList,
      persons: APP_CONFIG.persons
    });
    toast('Excel descargado ✓');
  } catch(e) {
    console.error(e);
    toast('Error al exportar', 'error');
  }
};

// ── Sign in/out ──
window.signInWithGoogle = () => DB.signIn().catch(e => { console.error(e); toast('Error al entrar', 'error'); });
window.doSignOut = () => {
  [unsubYear, unsubCats, unsubFixed, unsubTxs].forEach(u => u && u());
  DB.signOut();
};

// ── Close sheet global ──
window.closeSheet = closeSheet;
window.navTo = navTo;