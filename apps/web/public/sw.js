/* MapAble offline service worker — Cache API strategy (no Workbox runtime dep).
 * Caches: app shell paths, /api/venues/search, OSM raster tiles.
 * Does not cache authenticated or PII-bearing endpoints
 * (e.g. /api/participant/* communication and passport routes).
 */
/* eslint-disable no-restricted-globals */

const VERSION = "mapable-offline-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const API_CACHE = `${VERSION}-api`;
const TILE_CACHE = `${VERSION}-tiles`;

const PRECACHE_URLS = [
  "/",
  "/accessibility-map",
  "/provider-finder",
  "/offline",
  "/data/demo-access-venues.json",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("mapable-offline-") && !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isVenueSearch(url) {
  return url.pathname === "/api/venues/search";
}

function isOsmTile(url) {
  return (
    url.hostname.endsWith("tile.openstreetmap.org") ||
    url.hostname.endsWith("api.maptiler.com")
  );
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error("Network and cache miss");
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (isVenueSearch(url) || url.pathname === "/data/demo-access-venues.json") {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (isOsmTile(url)) {
    event.respondWith(cacheFirst(request, TILE_CACHE));
    return;
  }

  if (url.origin === self.location.origin && request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE);
          return (
            (await cache.match(request)) ||
            (await cache.match("/offline")) ||
            (await cache.match("/accessibility-map")) ||
            Response.error()
          );
        }),
    );
  }
});
