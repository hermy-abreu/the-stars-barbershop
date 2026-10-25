/* The Stars Barbershop demo: only static icon assets are cached. */
const CACHE = 'the-stars-pwa-shell-gh-pages-v1';
const BASE = '/the-stars-barbershop/';
const SHELL = [BASE+'icons/icon-192.png', BASE+'icons/icon-512.png', BASE+'manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Pages are network-only, and appointments are not synchronized between devices. */
