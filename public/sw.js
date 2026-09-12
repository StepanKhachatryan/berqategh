/*
 * Exists for two reasons, in this order.
 *
 * Chrome will not offer to install a site that has no service worker with a
 * fetch handler, and installing is the whole point of this file. Offline
 * support is the bonus: a farmer in a field with one bar can reopen the app and
 * still see the map shell and the last listings they loaded.
 *
 * Network first, always. A cache-first worker is how a site gets stuck serving
 * a build from three deploys ago, with no way for the user to break out. Here
 * the network wins whenever it answers; the cache only speaks when it does not.
 */

const CACHE = 'berqategh-v1';

self.addEventListener('install', () => {
  // Take over straight away rather than waiting for every tab to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever GET, and only this origin. Listings, map tiles and fonts all live
  // elsewhere; caching somebody else's API would serve stale produce prices,
  // which is the one thing this platform promises not to do.
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        // A navigation with nothing cached for that exact URL still has the
        // shell to fall back on — the app is a single page either way.
        if (request.mode === 'navigate') {
          const shell = await caches.match('/');
          if (shell) return shell;
        }
        throw new Error('offline and not cached');
      }
    })(),
  );
});
