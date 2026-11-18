const CACHE_NAME = "ipe3-rewards-shell-v2";
const APP_ASSETS = [
  "./recompensas.html",
  "./recompensas.webmanifest",
  "./static/css/ipe3-theme.css?v=nav-20261117",
  "./static/css/recompensas.css?v=1",
  "./static/js/ipe3-header-stars.js?v=8ea5635",
  "./static/js/rewards/pwa.js?v=1",
  "./static/js/rewards/firebase-config.js",
  "./static/js/rewards/portal.js?v=1",
  "./static/pwa/icon-192.png",
  "./static/pwa/icon-512.png",
];

const APP_PATHS = new Set(
  APP_ASSETS.map((asset) => new URL(asset, self.registration.scope).pathname)
);
const REWARDS_PAGE_PATH = new URL("./recompensas.html", self.registration.scope).pathname;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_ASSETS.map((asset) => new URL(asset, self.registration.scope).href)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("ipe3-rewards-shell-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !APP_PATHS.has(url.pathname)) {
    return;
  }

  if (url.pathname === REWARDS_PAGE_PATH) {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            await caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) =>
          cached || caches.match(new URL("./recompensas.html", self.registration.scope).href)))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(async (response) => {
        if (response.ok) {
          await caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }))
  );
});
