// ═══════════════════════════════════════════════
//  js/export.js — Excel export (SheetJS via CDN)
// ═══════════════════════════════════════════════

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

async function loadXLSX() {
  if (window.XLSX) return window.XLSX;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  return window.XLSX;
}

// ── Main export function ──
export async function exportToExcel({ year, yearData, cats, fixedList, persons }) {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Resumen anual ──
  addSummarySheet(wb, XLSX, year, yearData, cats);

  // ── Sheet 2-13: Mes por mes ──
  for (let m = 0; m < 12; m++) {
    addMonthSheet(wb, XLSX, year, m, yearData[m] || {}, cats);
  }

  // ── Sheet: Transacciones ──
  addTxSheet(wb, XLSX, year, yearData, cats, persons);

  // ── Sheet: Desglose personas ──
  addPersonSheet(wb, XLSX, year, yearData, cats, persons);

  // ── Sheet: Gastos fijos ──
  addFixedSheet(wb, XLSX, fixedList, cats);

  const filename = `Finanzas_${year}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function addSummarySheet(wb, XLSX, year, yearData, cats) {
  const rows = [];
  rows.push([`RESUMEN ANUAL ${year}`]);
  rows.push([]);
  rows.push(['Concepto', ...MESES.map(m => m.substring(0,3)), 'TOTAL AÑO', 'MEDIA MES']);

  Object.entries(cats).forEach(([catId, cfg]) => {
    rows.push([cfg.label]);
    cfg.items.forEach(item => {
      const vals = Array.from({length:12}, (_,m) =>
        parseFloat(yearData[m]?.budgets?.[catId]?.[item]?.real || 0) || 0);
      const total = vals.reduce((a,b)=>a+b,0);
      rows.push([`  ${item}`, ...vals, total, total/12]);
    });
  });

  rows.push([]);
  const totals = Array.from({length:12}, (_,m) => calcMonthTotals(m, yearData, cats));
  rows.push(['TOTAL INGRESOS', ...totals.map(t=>t.ing), totals.reduce((s,t)=>s+t.ing,0),'']);
  rows.push(['TOTAL GASTOS',   ...totals.map(t=>t.exp), totals.reduce((s,t)=>s+t.exp,0),'']);
  rows.push(['AHORRO / DÉFICIT',...totals.map(t=>t.ahorro), totals.reduce((s,t)=>s+t.ahorro,0),'']);
  rows.push(['TASA DE AHORRO (%)',...totals.map(t=>t.ing ? (t.ahorro/t.ing*100).toFixed(1)+'%' : '—'),'','']);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:30}, ...Array(13).fill({wch:11}), {wch:12}];
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen Anual');
}

function addMonthSheet(wb, XLSX, year, m, monthData, cats) {
  const rows = [];
  rows.push([`${MESES[m].toUpperCase()} ${year}`]);
  rows.push([]);
  rows.push(['Concepto', 'Presupuesto', 'Real', 'Diferencia', 'Nota']);

  Object.entries(cats).forEach(([catId, cfg]) => {
    rows.push([cfg.label]);
    cfg.items.forEach(item => {
      const bud = monthData?.budgets?.[catId]?.[item] || {};
      const p = parseFloat(bud.presup) || 0;
      const r = parseFloat(bud.real)   || 0;
      rows.push([`  ${item}`, p || '', r || '', r - p || '', bud.nota || '']);
    });
    // Subtotal
    let sP=0, sR=0;
    cfg.items.forEach(item => {
      sP += parseFloat(monthData?.budgets?.[catId]?.[item]?.presup || 0) || 0;
      sR += parseFloat(monthData?.budgets?.[catId]?.[item]?.real   || 0) || 0;
    });
    rows.push([`  SUBTOTAL ${cfg.label}`, sP, sR, sR-sP, '']);
    rows.push([]);
  });

  // Resumen
  const t = calcMonthTotals(m, {[m]: monthData}, cats);
  rows.push(['TOTAL INGRESOS', '', t.ing]);
  rows.push(['TOTAL GASTOS',   '', t.exp]);
  rows.push(['AHORRO / DÉFICIT','', t.ahorro]);
  rows.push(['TASA DE AHORRO', '', t.ing ? (t.ahorro/t.ing*100).toFixed(1)+'%' : '—']);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:32},{wch:13},{wch:13},{wch:13},{wch:30}];
  XLSX.utils.book_append_sheet(wb, ws, MESES[m].substring(0,3));
}

function addTxSheet(wb, XLSX, year, yearData, cats, persons) {
  const rows = [['TRANSACCIONES ' + year], [],
    ['Fecha','Mes','Tipo','Descripción','Categoría','Ítem','Importe','Persona','Nota']];

  for (let m = 0; m < 12; m++) {
    const txs = yearData[m]?.transactions || {};
    Object.values(txs).forEach(tx => {
      const catLabel = tx.catId && cats[tx.catId] ? cats[tx.catId].label : '';
      rows.push([
        tx.fecha || '', MESES[m], tx.tipo === 'gasto' ? 'Gasto' : 'Ingreso',
        tx.desc || '', catLabel, tx.item || '',
        (tx.tipo === 'gasto' ? -1 : 1) * (tx.importe || 0),
        tx.persona || '', tx.nota || ''
      ]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:12},{wch:12},{wch:10},{wch:28},{wch:20},{wch:22},{wch:11},{wch:14},{wch:30}];
  XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
}

function addPersonSheet(wb, XLSX, year, yearData, cats, persons) {
  const rows = [`DESGLOSE POR PERSONA — ${year}`, []];
  persons.forEach(person => {
    rows.push([person.toUpperCase()]);
    rows.push(['Mes','Ingresos','Gastos','Ahorro']);
    let totalIng=0, totalExp=0;
    for (let m = 0; m < 12; m++) {
      const txs = Object.values(yearData[m]?.transactions || {})
        .filter(tx => tx.persona === person);
      const ing = txs.filter(t=>t.tipo==='ingreso').reduce((s,t)=>s+t.importe,0);
      const exp = txs.filter(t=>t.tipo==='gasto').reduce((s,t)=>s+t.importe,0);
      totalIng += ing; totalExp += exp;
      rows.push([MESES[m], ing || '', exp || '', (ing-exp) || '']);
    }
    rows.push(['TOTAL', totalIng, totalExp, totalIng-totalExp]);
    rows.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:14},{wch:13},{wch:13},{wch:13}];
  XLSX.utils.book_append_sheet(wb, ws, 'Por Persona');
}

function addFixedSheet(wb, XLSX, fixedList, cats) {
  const rows = [['GASTOS FIJOS RECURRENTES'], [],
    ['Nombre','Categoría','Ítem','Importe mensual','Importe anual']];
  let total = 0;
  fixedList.forEach(fx => {
    const catLabel = fx.catId && cats[fx.catId] ? cats[fx.catId].label : '';
    rows.push([fx.name, catLabel, fx.item || '', fx.importe, fx.importe * 12]);
    total += fx.importe || 0;
  });
  rows.push([]);
  rows.push(['TOTAL', '', '', total, total*12]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:24},{wch:20},{wch:22},{wch:16},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws, 'Gastos Fijos');
}

function calcMonthTotals(m, yearData, cats) {
  const bud = yearData[m]?.budgets || {};
  let ing = 0, exp = 0;
  Object.entries(cats).forEach(([catId, cfg]) => {
    cfg.items.forEach(item => {
      const v = parseFloat(bud[catId]?.[item]?.real || 0) || 0;
      if (cfg.type === 'income') ing += v; else exp += v;
    });
  });
  return { ing, exp, ahorro: ing - exp };
}