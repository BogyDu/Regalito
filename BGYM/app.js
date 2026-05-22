/* ═══════════════════════════════════════════════════════════════
   FITCORE — app.js
   Main application logic
═══════════════════════════════════════════════════════════════ */

// ── TOAST ────────────────────────────────────────────────────────
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove("show"), 2800);
}

// ── NAVIGATION ──────────────────────────────────────────────────
function go(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-link, .tab-btn").forEach(b => b.classList.remove("active"));

  const page = document.getElementById("p-" + id);
  if (page) page.classList.add("active");

  document.querySelectorAll(`[data-page="${id}"]`).forEach(b => b.classList.add("active"));

  // Scroll to top
  document.getElementById("page-container").scrollTo(0, 0);

  // Page-specific init
  if (id === "gym")          renderGym();
  if (id === "registro")     { renderLogs(); loadChartJs().then(renderChart); }
  if (id === "dashboard")    renderDashboard();
}

// ── DASHBOARD ───────────────────────────────────────────────────
function renderDashboard() {
  const peso = Store.getPeso();
  document.getElementById("peso-display").textContent = peso;
  updateProgress(peso);
  renderWeek();
}

function renderWeek() {
  const days  = ["L","M","X","J","V","S","D"];
  const types = ["PUSH","PULL","PUSH","PULL","CORE","⚽","⚽"];
  const week  = Store.getWeek();
  const today = new Date().getDay();
  const ti    = today === 0 ? 6 : today - 1;

  document.getElementById("week-grid").innerHTML = days.map((d, i) => {
    const done   = week.includes(i);
    const isFtbl = i >= 5;
    const isToday = i === ti;
    return `<div class="week-day ${done?"done":""} ${isFtbl?"futbol":""} ${isToday?"today":""}"
                 onclick="toggleWeekDay(${i})" title="${isFtbl?"Fútbol":types[i]}">
      <div class="week-day-lbl">${d}</div>
      <div style="font-size:14px;font-weight:700;">${done?"✓":isFtbl?"⚽":"○"}</div>
      <div style="font-size:8px;opacity:.5;">${types[i]}</div>
    </div>`;
  }).join("");
}

function toggleWeekDay(i) {
  let w = Store.getWeek();
  w = w.includes(i) ? w.filter(d => d !== i) : [...w, i];
  Store.setWeek(w);
  renderWeek();
}

function updateProgress(peso) {
  const pct = Math.max(0, Math.min(100, ((peso - 60) / 10) * 100));
  const bar = document.getElementById("progress-bar");
  const lbl = document.getElementById("prog-label");
  if (bar) bar.style.width = pct + "%";
  if (lbl) lbl.textContent = peso + " kg";
}

function actualizarPeso() {
  const val = parseFloat(document.getElementById("nuevo-peso").value);
  if (!val || val < 40 || val > 250) { toast("Introduce un peso válido"); return; }
  Store.setPeso(val);
  document.getElementById("peso-display").textContent = val;
  updateProgress(val);
  Store.addLog({ fecha: today(), tipo: "peso", valor: val + " kg", kcal: "", notas: "" });
  document.getElementById("nuevo-peso").value = "";
  toast("✓ Peso actualizado a " + val + " kg");
  loadChartJs().then(renderChart);
}

// ── GYM ─────────────────────────────────────────────────────────
function renderGym() {
  const activeId    = Store.getActiveDay();
  const activeCombo = Store.getActiveCombo();

  if (activeId) {
    const wt = WORKOUT_TYPES.find(w => w.id === activeId);
    if (wt) { renderWorkout([wt]); return; }
  }
  if (activeCombo) {
    const wts = activeCombo.map(id => WORKOUT_TYPES.find(w => w.id === id)).filter(Boolean);
    if (wts.length) { renderWorkout(wts); return; }
  }
  renderDaySel();
}

// ── DAY SELECTOR ────────────────────────────────────────────────
function renderDaySel() {
  const el = document.getElementById("gym-content");
  el.innerHTML = `
    <div class="ds-header">
      <div class="ds-title">¿Qué entrenas hoy?</div>
      <div class="ds-sub">Selecciona la sesión según tu recuperación. Sin días de pierna — el fútbol cubre la parte inferior.</div>
    </div>
    <div class="ds-grid">
      ${WORKOUT_TYPES.map(w => {
        const badgeHtml = `<span class="badge badge-${w.label.toLowerCase()} ds-card-badge">${w.label}</span>`;
        return `<div class="ds-card" style="--_color:${w.color}" onclick="pickSingle('${w.id}')">
          ${badgeHtml}
          <div class="ds-icon">${w.icon}</div>
          <div class="ds-name">${w.name}</div>
          <div class="ds-sub-text">${w.sub}</div>
        </div>`;
      }).join("")}
    </div>
    <div class="combo-section">
      <div class="combo-label">Combinar grupos musculares</div>
      <div class="combo-grid">
        ${COMBOS.map(c => `
          <div class="combo-card" onclick="pickCombo(${JSON.stringify(c.ids)})">
            <span class="combo-icon">${c.icon}</span>
            <span>${c.name}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

function pickSingle(id) {
  Store.setActiveDay(id);
  Store.setActiveCombo(null);
  renderGym();
}

function pickCombo(ids) {
  Store.setActiveCombo(ids);
  Store.setActiveDay(null);
  renderGym();
}

function changeDay() {
  Store.clearActive();
  renderDaySel();
}

// ── WORKOUT RENDERER ─────────────────────────────────────────────
function renderWorkout(wts) {
  const el = document.getElementById("gym-content");

  // Special views
  if (wts.length === 1 && wts[0].isFutbol) { el.innerHTML = futbolHTML(); bindFutbol(); return; }
  if (wts.length === 1 && wts[0].isRest)   { el.innerHTML = restHTML(); return; }

  const td        = today();
  const setsData  = Store.getSets();
  const allExs    = buildAllExs(wts);
  const totalExs  = allExs.length;
  const doneCount = countDone(allExs, setsData, td);
  const progPct   = totalExs > 0 ? Math.round(doneCount / totalExs * 100) : 0;
  const title     = wts.map(w => w.name).join(" + ");

  let html = `
    <div class="wv-header">
      <div class="wv-title-wrap">
        <div class="wv-title">${wts.map(w => w.icon).join("")} ${title}</div>
        <div class="wv-sub">${wts.map(w => w.sub).join(" · ")}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="changeDay()">← Cambiar sesión</button>
    </div>
    <div class="wv-progress-card">
      <div class="progress-track" style="flex:1">
        <div class="progress-fill" id="wv-prog" style="width:${progPct}%"></div>
      </div>
      <div class="wv-prog-txt" id="wv-prog-txt">${doneCount}/${totalExs}</div>
    </div>`;

  // Build exercise cards grouped by workout type
  let gi = 0; // global index across all wts
  wts.forEach((wt, wi) => {
    if (wts.length > 1) {
      html += `<div class="group-divider" style="--_color:${wt.color}">
        <div class="group-divider-icon">${wt.icon}</div>
        <div><div class="group-divider-name">${wt.name}</div><div class="group-divider-sub">${wt.sub}</div></div>
      </div>`;
    }
    (wt.exercises || []).forEach(ex => {
      const key   = Store.getSetKey(wt.id, td, gi);
      const saved = setsData[key] || {};
      const sets  = parseSets(ex.sets);
      const done  = Store.isExDone(key, sets);
      html += buildExCardHTML(ex, gi, wt.id, saved, sets, done, td);
      gi++;
    });
  });

  html += `<div style="margin-top:16px;padding:14px 16px;background:var(--bg3);border:1px solid var(--b1);border-radius:var(--r-md);font-size:12px;color:var(--t1);">
    <strong style="color:var(--lime);">💾 Auto-guardado</strong> — Los pesos y series se guardan automáticamente. Usa el botón <em>Guardar</em> para registrar en el historial.
  </div>`;

  el.innerHTML = html;
}

// Build flattened list of {ex, wt, globalIdx}
function buildAllExs(wts) {
  const r = [];
  wts.forEach(wt => (wt.exercises || []).forEach(ex => r.push({ ex, wt })));
  return r;
}

function countDone(allExs, setsData, td) {
  let count = 0;
  allExs.forEach(({ ex, wt }, gi) => {
    const key  = Store.getSetKey(wt.id, td, gi);
    const sets = parseSets(ex.sets);
    if (Store.isExDone(key, sets)) count++;
  });
  return count;
}

// ── EXERCISE CARD HTML ───────────────────────────────────────────
function buildExCardHTML(ex, ei, wtId, saved, totalSets, allDone, td) {
  const key     = Store.getSetKey(wtId, td, ei);
  const gifUrl  = ex.gif || "";

  // Sets rows
  const setsHtml = Array.from({ length: totalSets }, (_, si) => {
    const done = (saved.done || [])[si];
    const w    = (saved.weights || [])[si] || "";
    const r    = (saved.reps    || [])[si] || "";
    return `<div class="set-row ${done ? "done" : ""}" id="sr-${ei}-${si}">
      <div class="set-n">${si + 1}</div>
      <div class="set-field">
        <input class="set-input" type="number" inputmode="decimal" placeholder="kg" step="0.5" value="${w}"
               oninput="handleSetInput('${key}',${ei},${si},'w',this.value)"
               id="si-w-${ei}-${si}">
        <div class="set-inp-lbl">Kg</div>
      </div>
      <div class="set-field">
        <input class="set-input" type="number" inputmode="numeric" placeholder="reps" value="${r}"
               oninput="handleSetInput('${key}',${ei},${si},'r',this.value)"
               id="si-r-${ei}-${si}">
        <div class="set-inp-lbl">Reps</div>
      </div>
      <button class="set-tick" onclick="handleTick('${key}',${ei},${si},${totalSets},'${wtId}')"
              id="st-${ei}-${si}" aria-label="Marcar serie">${done ? "✓" : ""}</button>
    </div>`;
  }).join("");

  return `
  <div class="ex-card ${allDone ? "done" : ""}" id="ex-${ei}">
    <div class="ex-card-head" onclick="toggleExCard(${ei})">
      <div class="ex-check-wrap">
        <div class="ex-check" id="ex-cb-${ei}">${allDone ? "✓" : ""}</div>
      </div>
      <div class="ex-thumb" id="ex-thumb-${ei}">
        ${gifUrl
          ? `<img src="${gifUrl}" alt="${ex.name}" loading="lazy"
                  onerror="this.parentElement.innerHTML='<div class=\\'ex-thumb-ph\\'>🏋️</div>'">`
          : `<div class="ex-thumb-ph">🏋️</div>`}
      </div>
      <div class="ex-info">
        <div class="ex-name">${ex.name}</div>
        <div class="ex-muscle">${ex.muscle}</div>
        <div class="ex-machine">📍 ${ex.equipment}</div>
      </div>
      <div class="ex-chips">
        <span class="chip">${ex.sets}</span>
        <span class="chip tl">⏱ ${ex.rest}</span>
        <span class="chip yw">⚖️ ${ex.weight}</span>
      </div>
      <div class="ex-chev">▾</div>
    </div>
    <div class="ex-detail">
      <div class="ex-detail-inner">
        <div class="ex-gif-panel">
          ${gifUrl
            ? `<img class="ex-gif" src="${gifUrl}" alt="${ex.name}"
                     loading="lazy"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
                     id="ex-gif-${ei}">
               <div class="ex-gif-loading" style="display:none">🏋️</div>`
            : `<div class="ex-gif-loading">🏋️</div>`}
          <div class="ex-weight-badge">
            <div class="ex-weight-label">Peso para 60 kg · Principiante</div>
            <div class="ex-weight-val">${ex.weight}</div>
          </div>
        </div>
        <div class="ex-text-panel">
          <div class="ex-section-lbl">Ejecución correcta</div>
          <div class="ex-desc">${ex.howto}</div>
          <div class="ex-pro">${ex.pro}</div>
          <div class="sets-title">Series de hoy — ${td}</div>
          <div class="sets-grid">${setsHtml}</div>
          <button class="save-ex-btn" onclick="logExercise('${key}',${ei},'${ex.name.replace(/'/g,"\\'")}')">
            💾 Guardar en historial
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

function parseSets(s) {
  const m = (s || "").match(/^(\d+)/);
  return m ? parseInt(m[1]) : 3;
}

function toggleExCard(ei) {
  document.getElementById("ex-" + ei).classList.toggle("open");
}

// ── SET INTERACTIONS ─────────────────────────────────────────────
function handleSetInput(key, ei, si, field, val) {
  Store.saveSet(key, si, field, val);
}

function handleTick(key, ei, si, totalSets, wtId) {
  const isDone = Store.tickSet(key, si);

  // Update row UI
  const row = document.getElementById(`sr-${ei}-${si}`);
  const btn = document.getElementById(`st-${ei}-${si}`);
  if (row) row.classList.toggle("done", isDone);
  if (btn) btn.textContent = isDone ? "✓" : "";

  // Check if all sets done
  const setsData = Store.getSets();
  const allDone  = Store.isExDone(key, totalSets);
  const card     = document.getElementById("ex-" + ei);
  const cb       = document.getElementById("ex-cb-" + ei);
  const nm       = card?.querySelector(".ex-name");

  if (card) card.classList.toggle("done", allDone);
  if (cb)   cb.textContent = allDone ? "✓" : "";
  if (nm)   nm.style.color = allDone ? "var(--lime)" : "";

  updateWorkoutProgress();
}

function updateWorkoutProgress() {
  const activeId    = Store.getActiveDay();
  const activeCombo = Store.getActiveCombo();
  let wts = [];
  if (activeId)    wts = [WORKOUT_TYPES.find(w => w.id === activeId)].filter(Boolean);
  if (activeCombo) wts = activeCombo.map(id => WORKOUT_TYPES.find(w => w.id === id)).filter(Boolean);

  const td       = today();
  const setsData = Store.getSets();
  const allExs   = buildAllExs(wts);
  const total    = allExs.length;
  const done     = countDone(allExs, setsData, td);
  const pct      = total > 0 ? Math.round(done / total * 100) : 0;

  const bar = document.getElementById("wv-prog");
  const txt = document.getElementById("wv-prog-txt");
  if (bar) bar.style.width = pct + "%";
  if (txt) txt.textContent = `${done}/${total}`;
}

function logExercise(key, ei, name) {
  const d       = Store.getSets()[key] || {};
  const weights = d.weights || [];
  const reps    = d.reps    || [];
  const done    = d.done    || [];
  const lines   = weights
    .map((w, i) => `S${i+1}: ${w||"?"}kg × ${reps[i]||"?"} reps ${done[i]?"✓":""}`)
    .filter((_, i) => weights[i] || reps[i]);

  if (!lines.length) { toast("Introduce al menos 1 serie antes de guardar"); return; }
  Store.addLog({ fecha: today(), tipo: "gym", valor: name, kcal: "", notas: lines.join(" | ") });
  toast(`✓ ${name} guardado`);
}

// ── FÚTBOL VIEW ──────────────────────────────────────────────────
function futbolHTML() {
  const items = [
    "☕ Desayuno con carbohidratos 2-3h antes",
    "💧 Hidratación: 500ml agua antes de empezar",
    "🔥 Calentamiento 10 min — trote + estiramientos dinámicos",
    "⚽ PARTIDO — 1 hora",
    "🥤 Whey + plátano en los 30 min post-partido",
    "🍽️ Comida completa en la siguiente hora (carbos + proteína)",
    "😴 Dormir 8h mínimo — día de alta demanda calórica",
  ];
  return `
    <div class="wv-header">
      <div class="wv-title-wrap">
        <div class="wv-title">⚽ Fútbol</div>
        <div class="wv-sub">Partido 1h · Sin entrenamiento de gimnasio este día</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="changeDay()">← Cambiar sesión</button>
    </div>
    <div class="futbol-hero">
      <div class="futbol-top">
        <div class="futbol-emoji">⚽</div>
        <div>
          <div class="futbol-t">PARTIDO DE FÚTBOL</div>
          <div class="futbol-s">Sesión activa completa · No hay gym hoy</div>
        </div>
      </div>
      <div class="futbol-stats">
        <div class="ftbl-stat"><div class="ftbl-val">~700</div><div class="ftbl-lbl">kcal quemadas</div></div>
        <div class="ftbl-stat"><div class="ftbl-val">8-12</div><div class="ftbl-lbl">km de carrera</div></div>
        <div class="ftbl-stat"><div class="ftbl-val">+500</div><div class="ftbl-lbl">kcal extra hoy</div></div>
      </div>
      <div class="t-micro" style="margin-bottom:10px;">Checklist del partido</div>
      <div class="futbol-checklist">
        ${items.map((item, i) => `
          <label class="ftbl-item" id="ftbl-lbl-${i}" onclick="toggleFtblItem(${i})">
            <input type="checkbox" id="ftbl-chk-${i}" onclick="event.stopPropagation()">
            ${item}
          </label>`).join("")}
      </div>
      <div class="futbol-note">
        <strong style="color:var(--green)">⚠️ Nutrición post-partido:</strong> El fútbol gasta ~600-800 kcal.
        Come carbohidratos de rápida absorción + proteína en los 60 min post-partido.
        Repón al menos 500ml de agua por hora jugada. Día de alta demanda — come más.
      </div>
      <div style="margin-top:14px;">
        <button class="btn btn-green-outline" onclick="logFutbol()">⚽ Registrar partido completado</button>
      </div>
    </div>`;
}

function bindFutbol() {}

function toggleFtblItem(i) {
  const chk = document.getElementById(`ftbl-chk-${i}`);
  const lbl = document.getElementById(`ftbl-lbl-${i}`);
  chk.checked = !chk.checked;
  lbl.classList.toggle("checked", chk.checked);
}

function logFutbol() {
  Store.addLog({ fecha: today(), tipo: "futbol", valor: "Partido de fútbol 1h", kcal: "700", notas: "~700 kcal, cardio alta intensidad" });
  toast("⚽ Partido registrado");
}

// ── REST VIEW ────────────────────────────────────────────────────
function restHTML() {
  const items = [
    { icon:"🚶", title:"Paseo 30-45 min", desc:"Zona 2 de cardio — puedes mantener conversación. Activa la circulación sin catabolismo." },
    { icon:"🔵", title:"Foam roller completo", desc:"2 min por zona: espalda alta, glúteos, isquiotibiales, cuádriceps, gemelos." },
    { icon:"🔄", title:"Movilidad de cadera y tobillos", desc:"90/90 hip stretch, círculos de tobillo, world's greatest stretch — 15 minutos." },
    { icon:"🧘", title:"Estiramientos estáticos", desc:"Isquios y psoas: 45s por posición. Solo en días de descanso, nunca antes de levantar." },
  ];
  return `
    <div class="wv-header">
      <div class="wv-title-wrap">
        <div class="wv-title">😴 Descanso activo</div>
        <div class="wv-sub">Recuperación — movilidad y foam roller</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="changeDay()">← Cambiar sesión</button>
    </div>
    <div class="stack">
      ${items.map(it => `
        <div class="rest-item">
          <div class="rest-icon">${it.icon}</div>
          <div>
            <div class="rest-title">${it.title}</div>
            <div class="rest-desc">${it.desc}</div>
          </div>
        </div>`).join("")}
    </div>`;
}

// ── DIET ─────────────────────────────────────────────────────────
let dietIdx = 0;

function renderDiet() {
  const day = DIET_DAYS[dietIdx];
  const sel = Store.getDietSel();
  const el  = document.getElementById("diet-content");

  el.innerHTML = day.meals.map((m, mi) => {
    const selKey = `${dietIdx}_${mi}`;
    return `
      <div class="meal-block">
        <div class="meal-header">
          <div class="meal-title">${m.title}</div>
          <div class="meal-time-chip">${m.time}</div>
        </div>
        ${m.options.map((o, oi) => `
          <div class="meal-opt ${sel[selKey]===oi?"selected":""}" onclick="selectMealOpt(${mi},${oi})">
            <div class="meal-opt-left">
              <div class="meal-opt-name">${o.name}</div>
              <div class="meal-opt-desc">${o.desc}</div>
            </div>
            <div class="meal-macros">
              <div class="meal-mac"><div class="mm-v" style="color:#ff6b6b">${o.prot}g</div><div class="mm-l">Prot</div></div>
              <div class="meal-mac"><div class="mm-v" style="color:#ffa94d">${o.carbs}g</div><div class="mm-l">HC</div></div>
              <div class="meal-mac"><div class="mm-v" style="color:#74c0fc">${o.fat}g</div><div class="mm-l">Grasa</div></div>
              <div class="meal-mac"><div class="mm-v" style="color:var(--lime)">${o.kcal}</div><div class="mm-l">kcal</div></div>
            </div>
          </div>`).join("")}
      </div>`;
  }).join("");
}

function selectDietTab(idx, el) {
  dietIdx = idx;
  document.querySelectorAll(".day-tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  renderDiet();
}

function selectMealOpt(mi, oi) {
  const selKey = `${dietIdx}_${mi}`;
  Store.setDietSel(selKey, oi);
  renderDiet();
}

// ── SUPPLEMENTS ──────────────────────────────────────────────────
function renderSupps() {
  document.getElementById("supp-grid").innerHTML = SUPPLEMENTS.map(s => `
    <div class="supp-card">
      <div class="supp-icon">${s.icon}</div>
      <div class="supp-name">${s.name}</div>
      <div class="supp-dose">${s.dose}</div>
      <div class="supp-desc">${s.desc}</div>
    </div>`).join("");
}

// ── LOG / REGISTRO ───────────────────────────────────────────────
function addLog() {
  const fecha = document.getElementById("log-fecha").value;
  const tipo  = document.getElementById("log-tipo").value;
  const valor = document.getElementById("log-valor").value.trim();
  const kcal  = document.getElementById("log-kcal").value;
  const notas = document.getElementById("log-notas").value.trim();
  if (!fecha || !valor) { toast("Completa fecha y valor"); return; }
  Store.addLog({ fecha, tipo, valor, kcal, notas });
  renderLogs();
  loadChartJs().then(renderChart);
  document.getElementById("log-fecha").value  = today();
  document.getElementById("log-valor").value  = "";
  document.getElementById("log-kcal").value   = "";
  document.getElementById("log-notas").value  = "";
  toast("✓ Registro guardado");
}

function deleteLog(id) {
  Store.deleteLog(id);
  renderLogs();
  loadChartJs().then(renderChart);
  toast("Registro eliminado");
}

function renderLogs() {
  const logs = Store.getLogs();
  const tb   = document.getElementById("log-tbody");
  if (!logs.length) {
    tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--t2)">No hay registros aún.</td></tr>`;
    return;
  }
  const cls = { peso:"badge-pull", gym:"badge-push", comida:"badge-core", futbol:"badge-futbol" };
  const lbl = { peso:"⚖️ Peso", gym:"💪 Gym", comida:"🥗 Comida", futbol:"⚽ Fútbol" };
  tb.innerHTML = logs.map(l => `
    <tr>
      <td style="font-family:var(--f-mono);font-size:11px;white-space:nowrap">${l.fecha}</td>
      <td><span class="badge ${cls[l.tipo]||"badge-rest"}">${lbl[l.tipo]||l.tipo}</span></td>
      <td class="td-main">${l.valor}</td>
      <td style="font-family:var(--f-mono);font-size:11px">${l.kcal ? l.kcal+" kcal" : "—"}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--t1)">${l.notas||"—"}</td>
      <td><button class="btn btn-danger btn-sm btn-icon" onclick="deleteLog(${l.id})" style="padding:5px 10px;font-size:11px">✕</button></td>
    </tr>`).join("");
}

// ── CHART ────────────────────────────────────────────────────────
let chartInst = null;

function loadChartJs() {
  if (window.Chart) return Promise.resolve();
  return new Promise(res => {
    if (document.getElementById("chartjs-script")) { res(); return; }
    const s = document.createElement("script");
    s.id  = "chartjs-script";
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    s.onload = res;
    document.head.appendChild(s);
  });
}

function renderChart() {
  const logs   = Store.getLogs().filter(l => l.tipo === "peso").reverse();
  const canvas = document.getElementById("weight-chart");
  const empty  = document.getElementById("chart-empty");
  if (!canvas) return;

  if (!logs.length) {
    canvas.style.display = "none";
    if (empty) empty.style.display = "block";
    return;
  }
  canvas.style.display = "block";
  if (empty) empty.style.display = "none";

  const labels = logs.map(l => l.fecha);
  const data   = logs.map(l => parseFloat(l.valor));
  if (chartInst) chartInst.destroy();

  const ctx  = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, "rgba(200,255,0,.3)");
  grad.addColorStop(1, "rgba(200,255,0,0)");

  chartInst = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ label:"Peso (kg)", data, borderColor:"#c8ff00", backgroundColor:grad, borderWidth:2, pointBackgroundColor:"#c8ff00", pointRadius:4, tension:.3, fill:true }] },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor:"#18181f", borderColor:"rgba(255,255,255,.08)", borderWidth:1, titleColor:"#c8ff00", bodyColor:"#a0a0b8" }
      },
      scales: {
        x: { ticks:{ color:"#62627a", font:{ size:10 } }, grid:{ color:"rgba(255,255,255,.04)" } },
        y: { ticks:{ color:"#62627a", font:{ size:10 } }, grid:{ color:"rgba(255,255,255,.04)" }, min:55 }
      }
    }
  });
}

// ── UTILS ────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().split("T")[0];
}

// ── INIT ─────────────────────────────────────────────────────────
function init() {
  // Set today's date in log form
  const df = document.getElementById("log-fecha");
  if (df) df.value = today();

  // Initial renders
  renderDashboard();
  renderSupps();
  renderDiet();
  renderGym();
}

document.addEventListener("DOMContentLoaded", init);
