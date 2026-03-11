/* StackScore SW — installable + offline viewer (token-aware) */
const VERSION = 'v1';
const SHELL = `ss-shell-${VERSION}`;
const PAGES = `ss-pages-${VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/assets/css/print-v2.css',
  '/assets/fonts/Inter-Variable.woff2',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

const isGuide = (url) => /^\/guide\/[a-z0-9]{6}$/i.test(new URL(url).pathname);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then(c => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![SHELL, PAGES].includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;

  // Static assets: stale-while-revalidate
  if (SHELL_ASSETS.some(a => url.pathname === a)) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const cached = await cache.match(req);
      const network = fetch(req).then(res => { cache.put(req, res.clone()); return res; }).catch(() => null);
      return cached || network || new Response('', { status: 504 });
    })());
    return;
  }

  // Guide HTML: network-first; cache 200s only
  if (isGuide(url)) {
    event.respondWith((async () => {
      const pages = await caches.open(PAGES);
      try {
        const res = await fetch(req, { cache: 'no-store' });
        if (res.ok) pages.put(req, res.clone());
        return res;
      } catch {
        const cached = await pages.match(req);
        if (cached) return cached;
        return new Response(
          '<!doctype html><meta charset="utf-8"><title>Offline</title><body><h1>Offline</h1><p>Your last saved copy is not available yet. Open the guide once while online.</p></body>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }
});

// Optional: targeted purge when token rotates
self.addEventListener('message', async (event) => {
  const msg = event.data || {};
  if (msg.type === 'PURGE_GUIDE' && typeof msg.path === 'string') {
    const pages = await caches.open(PAGES);
    const keys = await pages.keys();
    await Promise.all(
      keys
        .filter(r => new URL(r.url).pathname === new URL(msg.path, location.origin).pathname)
        .map(r => pages.delete(r))
    );
  }
});
