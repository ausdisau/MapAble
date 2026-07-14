/**
 * MapAble PWA service worker — shell cache only.
 * Does NOT cache participant records or communication passport API responses.
 */
const SHELL_CACHE = "mapable-shell-v1";

const SHELL_ASSETS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const EXCLUDED_PREFIXES = [
  "/api/participant/",
  "/api/v1/participants",
  "/api/intelligence/",
  "/api/auth/",
];

function shouldExclude(url) {
  const pathname = new URL(url).pathname;
  return EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (shouldExclude(request.url)) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response.ok) return response;
        if (SHELL_ASSETS.includes(url.pathname)) {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }),
  );
});
