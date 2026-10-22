/** PWA demo: register a service worker when browser allows it. */
export function registerPWA() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .catch(err => console.warn('PWA: service worker unavailable', err))
  }, { once: true })
}
