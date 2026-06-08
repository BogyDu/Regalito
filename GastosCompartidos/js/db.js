// ═══════════════════════════════════════════════
//  js/db.js — Firebase database layer
//  All reads/writes go through here.
//  Data path: users/{uid}/...

// ═══════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged, signOut as fbSignOut
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  getDatabase, ref, set, get, onValue, remove, push, update
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

import { FIREBASE_CONFIG, DEFAULT_CATEGORIES } from "../config.js";

// ── Init ──
const fbApp   = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(fbApp);
export const db   = getDatabase(fbApp);
const gProvider   = new GoogleAuthProvider();

// ── Auth ──
export const signIn  = () => signInWithPopup(auth, gProvider);
export const signOut = () => fbSignOut(auth);

export const onAuth = (cb) => onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const idTokenResult = await user.getIdTokenResult();
      if (!idTokenResult.claims.appAccess) {
        // Usuario no autorizado
        await fbSignOut(auth);
        cb(null);
        return;
      }
    } catch (e) {
      console.error('Error verificando claims:', e);
      cb(null);
      return;
    }
  }
  cb(user);
});

export const uid     = () => auth.currentUser?.uid;

// ── Path helpers ──
// All user data lives under users/{uid}/
const P = {
  cats:    ()      => ref(db, `users/${uid()}/cats`),
  fixed:   ()      => ref(db, `users/${uid()}/fixed`),
  month:   (y, m)  => ref(db, `users/${uid()}/data/${y}/${m}`),
  budgets: (y, m)  => ref(db, `users/${uid()}/data/${y}/${m}/budgets`),
  txs:     (y, m)  => ref(db, `users/${uid()}/data/${y}/${m}/transactions`),
  tx:      (y,m,id)=> ref(db, `users/${uid()}/data/${y}/${m}/transactions/${id}`),
  year:    (y)     => ref(db, `users/${uid()}/data/${y}`),
};

// ── Categories ──
export async function loadCats() {
  const snap = await get(P.cats());
  if (snap.exists()) return snap.val();
  // First time — write defaults
  const defs = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  await set(P.cats(), defs);
  return defs;
}

export function watchCats(cb) {
  return onValue(P.cats(), snap => {
    cb(snap.exists() ? snap.val() : {});
  });
}

export function saveCats(cats) {
  return set(P.cats(), cats);
}

// ── Fixed expenses ──
export function watchFixed(cb) {
  return onValue(P.fixed(), snap => {
    const raw = snap.exists() ? snap.val() : {};
    cb(Object.entries(raw).map(([id, v]) => ({ id, ...v })));
  });
}

export function addFixed(data) {
  return set(push(P.fixed()), data);
}

export function deleteFixed(id) {
  return remove(ref(db, `users/${uid()}/fixed/${id}`));
}

// ── Budget (month overview table) ──
export function watchYear(year, cb) {
  return onValue(P.year(year), snap => {
    cb(snap.exists() ? snap.val() : {});
  });
}

export function saveBudgetField(year, month, catId, item, field, value) {
  const path = ref(db, `users/${uid()}/data/${year}/${month}/budgets/${catId}/${item}/${field}`);
  return set(path, value === '' ? null : value);
}

export async function applyFixedToMonth(year, month, fixedList, cats) {
  const updates = {};
  fixedList.forEach(fx => {
    if (fx.catId && fx.item) {
      updates[`users/${uid()}/data/${year}/${month}/budgets/${fx.catId}/${fx.item}/presup`] = fx.importe;
    }
  });
  if (Object.keys(updates).length) await update(ref(db), updates);
}

// ── Transactions ──
export function watchTxs(year, month, cb) {
  return onValue(P.txs(year, month), snap => {
    const raw = snap.exists() ? snap.val() : {};
    const arr = Object.entries(raw)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || (b.ts || 0) - (a.ts || 0));
    cb(arr);
  });
}

export function addTx(year, month, data) {
  return set(push(P.txs(year, month)), { ...data, ts: Date.now() });
}

export function deleteTx(year, month, id) {
  return remove(P.tx(year, month, id));
}

// ── Full year data for export ──
export async function getYearData(year) {
  const snap = await get(P.year(year));
  return snap.exists() ? snap.val() : {};
}

// ── Shared Features ──

// Calendar events
export function addCalendarEvent(data) {
  return set(push(ref(db, `users/${uid()}/shared/calendar`)), { ...data });
}

export async function getCalendarEvents() {
  const snap = await get(ref(db, `users/${uid()}/shared/calendar`));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }));
}

export function deleteCalendarEvent(id) {
  return remove(ref(db, `users/${uid()}/shared/calendar/${id}`));
}

// Shopping list
export function addShoppingItem(data) {
  return set(push(ref(db, `users/${uid()}/shared/shopping`)), { ...data });
}

export async function getShoppingItems() {
  const snap = await get(ref(db, `users/${uid()}/shared/shopping`));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }));
}

export function deleteShoppingItem(id) {
  return remove(ref(db, `users/${uid()}/shared/shopping/${id}`));
}

export async function toggleShoppingItem(id) {
  const snap = await get(ref(db, `users/${uid()}/shared/shopping/${id}`));
  if (snap.exists()) {
    const item = snap.val();
    return set(ref(db, `users/${uid()}/shared/shopping/${id}`), { ...item, checked: !item.checked });
  }
}

// Shared notes
export function saveSharedNotes(text) {
  return set(ref(db, `users/${uid()}/shared/notes`), { text, updatedAt: Date.now() });
}

export async function getSharedNotes() {
  const snap = await get(ref(db, `users/${uid()}/shared/notes`));
  if (!snap.exists()) return '';
  return snap.val().text || '';
}

// Shared photo (single, overwrites)
export function saveSharedPhoto(data) {
  return set(ref(db, `users/${uid()}/shared/photo`), { ...data });
}

export async function getSharedPhoto() {
  const snap = await get(ref(db, `users/${uid()}/shared/photo`));
  return snap.exists() ? snap.val() : null;
}