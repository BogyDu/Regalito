/* ═══════════════════════════════════════════════════════════════
   FITCORE — store.js
   LocalStorage wrapper + global state
═══════════════════════════════════════════════════════════════ */

const Store = (() => {
  const PREFIX = "fc_";
  const get = (k, fallback = null) => {
    try { const v = localStorage.getItem(PREFIX + k); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  };
  const set = (k, v) => { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch {} };
  const del = (k) => localStorage.removeItem(PREFIX + k);

  return {
    // Peso corporal
    getPeso:      ()  => parseFloat(get("peso", 60)),
    setPeso:      (v) => set("peso", v),

    // Semana (array de índices marcados)
    getWeek:      ()  => get("week", []),
    setWeek:      (v) => set("week", v),

    // Workout activo: single id o array de ids (combo)
    getActiveDay:   ()  => get("active_day", null),
    setActiveDay:   (v) => set("active_day", v),
    getActiveCombo: ()  => get("active_combo", null),
    setActiveCombo: (v) => set("active_combo", v),
    clearActive:    ()  => { del("active_day"); del("active_combo"); },

    // Sets data: key → { weights:[], reps:[], done:[] }
    getSets: ()  => get("sets", {}),
    setSets: (v) => set("sets", v),

    saveSet(key, si, field, val) {
      const d = this.getSets();
      if (!d[key]) d[key] = {};
      if (!d[key].weights) d[key].weights = [];
      if (!d[key].reps)    d[key].reps    = [];
      if (field === "w") d[key].weights[si] = val;
      else               d[key].reps[si]    = val;
      this.setSets(d);
    },

    tickSet(key, si) {
      const d = this.getSets();
      if (!d[key]) d[key] = {};
      if (!d[key].done) d[key].done = [];
      d[key].done[si] = !d[key].done[si];
      this.setSets(d);
      return d[key].done[si];
    },

    getSetKey(wtId, today, globalIdx) {
      return `${wtId}_${today}_${globalIdx}`;
    },

    isExDone(key, totalSets) {
      const d = this.getSets()[key] || {};
      return totalSets > 0 && (d.done || []).slice(0, totalSets).filter(Boolean).length >= totalSets;
    },

    // Log entries
    getLogs:  ()  => get("logs", []),
    setLogs:  (v) => set("logs", v),
    addLog(entry) {
      const logs = this.getLogs();
      logs.unshift({ ...entry, id: Date.now() });
      this.setLogs(logs);
    },
    deleteLog(id) {
      this.setLogs(this.getLogs().filter(l => l.id !== id));
    },

    // Diet selections: { dayIdx_mealIdx: optionIdx }
    getDietSel: ()  => get("diet_sel", {}),
    setDietSel: (k, v) => {
      const d = get("diet_sel", {});
      d[k] = v;
      set("diet_sel", d);
    },
  };
})();
