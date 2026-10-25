/** PWA de demostración para alojamiento en la subruta del repositorio. */
export function registerPWA() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL
    navigator.serviceWorker.register(base + 'sw.js', { scope: base })
      .catch(err => console.warn('PWA: service worker unavailable', err))
  }, { once: true })
}
