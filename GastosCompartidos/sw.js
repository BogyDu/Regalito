// ═══════════════════════════════════════════════
//  sw.js — Service Worker for PWA
// ═══════════════════════════════════════════════
const CACHE = "finanzas-v3";
const STATIC = ["./", "./index.html", "./css/app.css", "./js/app.js", "./js/db.js", "./js/export.js", "./config.js", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC)
        .catch(() => {
          // Fallback: cachea lo que pueda
          return Promise.all(
            STATIC.map(url => 
              fetch(url).then(r => r.ok ? c.put(url, r) : Promise.reject())
                .catch(() => null)
            )
          );
        })
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // Skip Firebase y Google APIs
  if (e.request.url.includes("firebase") || e.request.url.includes("googleapis") || e.request.url.includes("gapi")) return;
  
  e.respondWith(
    caches.match(e.request)
      .then(r => r || fetch(e.request).then(res => {
        if (res.ok && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match("./index.html")))
  );
});
