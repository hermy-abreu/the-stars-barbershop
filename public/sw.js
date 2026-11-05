/* Cache only versioned static PWA assets. HTML and API calls remain network-only. */
const CACHE = 'the-stars-pwa-static-v2';
const SHELL = ['/icons/icon-192.png', '/icons/icon-512.png', '/manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
