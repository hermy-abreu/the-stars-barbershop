/* PWA DEMO — no caching of reservations or user data. */
const CACHE = 'the-stars-pwa-shell-v1';
const SHELL = ['/icons/icon-192.png','/icons/icon-512.png','/manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Pages stay network-only. This demo cannot make or read appointments offline. */
