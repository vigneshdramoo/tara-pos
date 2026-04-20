const CACHE_NAME = "tara-pos-shell-v1";
const APP_SHELL = [
  "/",
  "/pos",
  "/customers",
  "/orders",
  "/assistant",
  "/manifest.webmanifest",
  "/icons/tara-mark.svg",
  "/icons/tara-mark-maskable.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) return;
  if (requestUrl.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) =>
      fetch(event.request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return networkResponse;
        })
        .catch(() => cachedResponse || caches.match("/")),
    ),
  );
});
