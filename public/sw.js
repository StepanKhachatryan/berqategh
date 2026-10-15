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

/*
 * Notifications. The payload is JSON from the push-send Edge Function:
 * { title, body, url, tag }. A tap opens (or focuses) the site at that url,
 * which the app reads - ?listing=<id> opens a listing, ?open=mine the
 * seller's own listings.
 */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'ԲերքաՏեղ', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/favicon-96.png',
      tag: data.tag,
      data: { url: data.url || '/' },
      lang: 'hy',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && 'navigate' in client) {
          await client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
