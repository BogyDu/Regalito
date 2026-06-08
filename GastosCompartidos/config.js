// ═══════════════════════════════════════════════
//  config.js — Firebase configuration
//  Replace with your own values from Firebase Console
// ═══════════════════════════════════════════════
export const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyD1BcozEbx1VwrhAmEmy_0WDm7IK9iKv-c",
  authDomain:        "nuestras-finanzas-2790a.firebaseapp.com",
  databaseURL:       "https://nuestras-finanzas-2790a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "nuestras-finanzas-2790a",
  storageBucket:     "nuestras-finanzas-2790a.firebasestorage.app",
  messagingSenderId: "1042142337044",
  appId:             "1:1042142337044:web:cccec689070392fb2cef01"
};

// ═══════════════════════════════════════════════
//  App configuration
// ═══════════════════════════════════════════════
export const APP_CONFIG = {
  name: "Nuestras Finanzas",
  version: "2.0.0",
  persons: ["Persona 1", "Persona 2"],   // ← Change these names
  currency: "EUR",
  locale: "es-ES"
};

export const DEFAULT_CATEGORIES = {
  ingresos: {
    label: "💰 Ingresos",
    type: "income",
    color: "#34d399",
    items: ["Sueldo Persona 1", "Sueldo Persona 2", "Otros ingresos"]
  },
  gastos_fijos: {
    label: "🏠 Gastos Fijos",
    type: "fixed",
    color: "#fb923c",
    items: ["Alquiler", "Seguro hogar", "Internet y teléfonos", "Suscripciones", "Cuota préstamo / coche"]
  },
  gastos_variables: {
    label: "🛒 Gastos Variables",
    type: "variable",
    color: "#818cf8",
    items: ["Alimentación", "Restaurantes y ocio", "Transporte", "Ropa y calzado", "Salud", "Hogar y limpieza", "Viajes", "Otros"]
  }
};