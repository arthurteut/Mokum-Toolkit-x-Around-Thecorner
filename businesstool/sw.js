/* Heat · plan de afaceri: service worker (aplicație pe ecranul principal + notificări push).
   Generat de build.py din src/sw.js; VERSION se schimbă la fiecare publicare a paginii. */
const VERSION = "fd9f3f8f2a";
const CACHE = "heat-plan-" + VERSION;
const PRECACHE = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./assets/app/icon-192.png", "./assets/app/badge-96.png",
  "./assets/heat/heat-logo-red.png", "./assets/heat/ht-monogram.png", "./assets/heat/favicon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => null)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Fișierele paginii: întâi rețeaua (mereu versiunea publicată), cache-ul doar când nu e internet.
   Supabase, fonturile și CDN-ul nu trec pe aici. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => null); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === "navigate" ? caches.match("./index.html") : Response.error()))));
});

/* Notificări push: { title, body, url, tag } */
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : "" }; }
  const opts = { body: d.body || "", icon: "./assets/app/icon-192.png", badge: "./assets/app/badge-96.png", tag: d.tag || "heat-plan", renotify: true, data: { url: d.url || "./" } };
  e.waitUntil(self.registration.showNotification(d.title || "Heat · Plan de afaceri", opts));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || "./", self.location.href).href;
  const page = (u) => u.split("#")[0].split("?")[0];
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if (page(c.url) === page(target) && "focus" in c) { if (target.includes("#") && c.navigate) c.navigate(target); return c.focus(); } }
    return self.clients.openWindow(target);
  }));
});
