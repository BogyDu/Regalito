// ═══════════════════════════════════════════════
//  sw.js — Service Worker for PWA
// ═══════════════════════════════════════════════
const CACHE = "finanzas-v1";

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => 
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  // No cachear Firebase, Google, o peticiones POST/PUT/DELETE
  const url = e.request.url;
  const isCacheable = e.request.method === "GET" && 
                     !url.includes("firebase") && 
                     !url.includes("googleapis") &&
                     !url.includes("gapi");
  
  if (!isCacheable) {
    e.respondWith(fetch(e.request));
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then(r => {
      if (r) return r;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200) return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    }).catch(() => caches.match("/index.html"))
  );
});
