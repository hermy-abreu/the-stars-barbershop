/**
 * THE STARS BARBERSHOP — Página principal (versión de diseño 0.7)
 * React + Vite. Actualización: idioma automático sin selector visible.
 * No requiere paquetes adicionales.
 * Logotipo oficial integrado; reservas reales pendientes.
 */
import { useEffect, useState } from 'react'
import './App.css'
import ClientBooking from './ClientBooking'
import BarberDashboard from './BarberDashboard'
import {STARTER_BARBERS,getStored,putStored} from './demoStore'

// Datos editables: confirmar la dirección con el cliente antes de publicar.
const SHOP = {
  name: 'THE STARS BARBERSHOP',
  address: '1 W Broad St, Nanticoke, PA 18634',
}
const mapQuery = encodeURIComponent(SHOP.address)
const mapEmbed = `https://www.google.com/maps?q=${mapQuery}&output=embed`
const directions = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`

// Imágenes temporales recortadas de la referencia suministrada por el cliente.
const services = [
  { id: 'classic', image: '/images/classic.jpg' },
  { id: 'fade', image: '/images/fade.jpg' },
  { id: 'beard', image: '/images/beard.jpg' },
  { id: 'kids', image: '/images/kids.jpg' },
  { id: 'shave', image: '/images/shave.jpg' },
]

// Diccionarios: todos los textos de la interfaz tienen versión ES/EN.
const copy = {
  es: {
    nav: ['Inicio', 'Servicios', 'Ubicación', 'Reseñas'], reserve: 'Reservar cita',
    welcome: 'BIENVENIDO A', headline: 'MÁS QUE UN CORTE,', accent: 'ES UNA EXPERIENCIA.',
    tagline: 'Tu estilo, nuestras manos.', discover: 'Ver servicios',
    benefits: [['Reservación fácil', 'En pocos pasos'], ['Cortes de calidad', 'Siempre'], ['Ambiente cómodo', 'Para toda la familia'], ['Estilo profesional', 'Con confianza']],
    servicesEyebrow: 'NUESTROS SERVICIOS', servicesTitle: 'Cortes y estilo para todos',
    serviceNames: { classic: 'Corte clásico', fade: 'Degradado / Skin Fade', beard: 'Corte y barba', kids: 'Corte para niños', shave: 'Afeitado con toalla caliente' },
    allServices: 'Catálogo completo próximamente',
    locationEyebrow: 'ENCUÉNTRANOS', locationTitle: 'Visita nuestra barbería',
    directions: 'Cómo llegar', mapTitle: 'Mapa de la barbería',
    reviewsEyebrow: 'OPINIONES', reviewsTitle: 'Reseñas en Google',
    reviewsText: 'Próximamente mostraremos reseñas auténticas de nuestra ficha de Google.',
    bookingEyebrow: 'PRÓXIMAMENTE', bookingTitle: 'Reserva tu próximo corte',
    bookingText: 'Estamos preparando el sistema de citas en línea.', bookingStatus: 'Reservaciones próximamente',
    rights: 'Todos los derechos reservados.', language: 'Idioma', reviewFuture: 'Próxima integración', reviewDetail: 'Las reseñas reales se mostrarán después de verificar la ficha de Google del negocio.',
  },
  en: {
    nav: ['Home', 'Services', 'Location', 'Reviews'], reserve: 'Book appointment',
    welcome: 'WELCOME TO', headline: 'MORE THAN A HAIRCUT,', accent: "IT'S AN EXPERIENCE.",
    tagline: 'Your style, our hands.', discover: 'Explore services',
    benefits: [['Easy booking', 'Just a few steps'], ['Quality haircuts', 'Every time'], ['Comfortable space', 'For the whole family'], ['Professional style', 'With confidence']],
    servicesEyebrow: 'OUR SERVICES', servicesTitle: 'Cuts and style for everyone',
    serviceNames: { classic: 'Classic Haircut', fade: 'Skin Fade / Bald Fade', beard: 'Haircut & Beard', kids: 'Kids Haircut', shave: 'Hot Towel Shave' },
    allServices: 'Full catalog coming soon',
    locationEyebrow: 'FIND US', locationTitle: 'Visit our barbershop',
    directions: 'Get directions', mapTitle: 'Barbershop map',
    reviewsEyebrow: 'CUSTOMER FEEDBACK', reviewsTitle: 'Google Reviews',
    reviewsText: 'Authentic reviews from our Google business profile will appear here in the future.',
    bookingEyebrow: 'COMING SOON', bookingTitle: 'Book your next cut',
    bookingText: 'Our online appointment system is under development.', bookingStatus: 'Online booking coming soon',
    rights: 'All rights reserved.', language: 'Language', reviewFuture: 'Future integration', reviewDetail: 'Real reviews will appear after the business Google listing is verified.',
  },
}

/**
 * Iconos SVG propios del proyecto (sin librerías externas).
 * stroke=currentColor permite conservar el color del tema.
 */
function Icon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 18h2" /></>,
    award: <><path d="M12 2 4 12l8 10 8-10-8-10Z" /><path d="M4 12h16M8 3l4 9 4-9M12 12v10" /></>,
    users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M15 14a5 5 0 0 1 6 5v1" /></>,
    shield: <><path d="m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-4Z" /><path d="m8 12 3 3 5-6" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    message: <><path d="M20 11a8 8 0 0 1-8 8 9 9 0 0 1-4-.9L3 20l1.8-5A8 8 0 1 1 20 11Z" /><path d="M8 11h8" /></>,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" {...common}>{paths[name]}</svg>
}

/** Detecta el primer idioma soportado según las preferencias del navegador. */
function detectLanguage() {
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language || 'en']
  for (const item of preferred) {
    const code = item.toLowerCase().split('-')[0]
    if (code === 'es' || code === 'en') return code
  }
  return 'en'
}

export default function App() {
  // Única fuente demo de barberos y citas para sitio, propietario y Staff.
  const [barbers,setBarbers]=useState(()=>getStored('barbers',STARTER_BARBERS))
  const [appointments,setAppointments]=useState(()=>getStored('appointments',[]))
  const [latestBooking,setLatestBooking]=useState(null)
  useEffect(()=>putStored('barbers',barbers),[barbers])
  useEffect(()=>putStored('appointments',appointments),[appointments])
  // El idioma se detecta automáticamente al cargar la PWA.
  // La interfaz ya no ofrece un selector manual EN/ES.
  const [language, setLanguage] = useState(detectLanguage)

  // Actualiza el idioma si el navegador informa un cambio de preferencias.
  // Algunos navegadores requieren recargar la página para aplicar ese cambio.
  useEffect(() => {
    const updateLanguage = () => setLanguage(detectLanguage())
    window.addEventListener('languagechange', updateLanguage)
    return () => window.removeEventListener('languagechange', updateLanguage)
  }, [])
  // Menú móvil accesible; se cierra al seleccionar una sección.
  const [menuOpen, setMenuOpen] = useState(false)
  // Acceso independiente al panel DEMO. No cambia el Home ni las reservas del cliente.
  // Ruta de personal independiente. El enlace Staff conserva el texto en inglés.
  // Esto es navegación de demostración, NO autenticación ni seguridad real.
  const [barberView, setBarberView] = useState(() => window.location.pathname === `${import.meta.env.BASE_URL}staff`)

  // Sin React Router: usa History API y mantiene actualizada la ruta al volver atrás.
  useEffect(() => {
    const syncRoute = () => setBarberView(window.location.pathname === `${import.meta.env.BASE_URL}staff`)
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  function openStaff(event) {
    event.preventDefault()
    window.history.pushState({}, '', `${import.meta.env.BASE_URL}staff`)
    setMenuOpen(false)
    setBarberView(true)
    window.scrollTo(0, 0)
  }

  function closeStaff() {
    window.history.pushState({}, '', import.meta.env.BASE_URL)
    setBarberView(false)
    window.scrollTo(0, 0)
  }
  const t = copy[language]
  useEffect(() => { document.documentElement.lang = language }, [language])
  const anchors = ['home', 'services', 'location', 'reviews']

  if (barberView) return <BarberDashboard language={language} onExit={closeStaff} barbers={barbers} setBarbers={setBarbers} appointments={appointments} setAppointments={setAppointments} />

  return (
    <div className="site">
      {/* Cabecera: marca provisional hasta aprobar el logo oficial. */}
      <header className="header">
        <div className="header-inner">
          <a href="#home" className="brand" aria-label={SHOP.name}>
            <img src="/images/logo-oficial.png" className="official-logo-header" alt="The Stars Barbershop" />
          </a>
          <nav id="main-navigation" className={`nav ${menuOpen ? 'nav-open' : ''}`} aria-label={language === 'es' ? 'Navegación principal' : 'Main navigation'}>
            {anchors.map((id, index) => <a href={`#${id}`} key={id} onClick={() => setMenuOpen(false)}>{t.nav[index]}</a>)}
            {/* Staff no se traduce y abre el acceso exclusivo del personal. */}
            <a href="/staff" className="nav-staff" onClick={openStaff}>Staff</a>
            {/* En móvil, reservar cita aparece dentro del menú desplegable. */}
            <a href="#booking" className="mobile-nav-booking" onClick={() => setMenuOpen(false)}>{t.reserve}</a>
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="mobile-menu-toggle"
              aria-label={language === 'es' ? 'Abrir o cerrar menú' : 'Open or close menu'}
              aria-controls="main-navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
            </button>
            <a href="#booking" className="gold-button top-booking"><Icon name="calendar" /> {t.reserve}</a>
          </div>
        </div>
      </header>

      <main>
        {/*
          Bloque de bienvenida: en móvil se ajusta al alto visible.
          Hero + 4 beneficios ocupan preferentemente la primera pantalla.
        */}
        <div className="mobile-first-screen">
        <section className="hero" id="home">
          <div className="hero-photo" aria-hidden="true" />
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">{t.welcome}</p>
              <div className="hero-mark"><img src="/images/logo-oficial.png" className="official-logo-hero" alt="The Stars Barbershop" /></div>
              <h1>{t.headline}<strong>{t.accent}</strong></h1>
              <p className="tagline">{t.tagline}</p>
              <div className="hero-buttons">
                <a className="gold-button" href="#booking"><Icon name="calendar" /> {t.reserve} <Icon name="arrow" /></a>
                <a className="text-link" href="#services">{t.discover} ↓</a>
              </div>
            </div>
          </div>
        </section>

        {/* Franja de atributos; son mensajes de diseño provisionales. */}
        <section className="benefits" aria-label={language === 'es' ? 'Beneficios' : 'Benefits'}>
          <div className="benefits-inner">
            {['calendar', 'award', 'users', 'shield'].map((symbol, i) => (
              <div className="benefit" key={symbol}>
                <span className="benefit-icon"><Icon name={symbol} /></span>
                <span><b>{t.benefits[i][0]}</b><small>{t.benefits[i][1]}</small></span>
              </div>
            ))}
          </div>
        </section>
        </div>

        {/* Servicios destacados: imágenes provisionales de la referencia. */}
        <section className="section services" id="services">
          <div className="container">
            <p className="eyebrow">{t.servicesEyebrow}</p>
            <h2>{t.servicesTitle}</h2>
            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.id}>
                  <img src={service.image} alt={t.serviceNames[service.id]} loading="lazy" />
                  <div className="service-name">{t.serviceNames[service.id]}</div>
                </article>
              ))}
            </div>
            <p className="section-note">{t.allServices}</p>
          </div>
        </section>

        {/* Ubicación: mapa básico sin clave API; confirmar dirección antes de publicar. */}
        <section className="section location" id="location">
          <div className="container">
            <p className="eyebrow">{t.locationEyebrow}</p><h2>{t.locationTitle}</h2>
            <div className="location-grid">
              <div className="address-card">
                <span className="address-icon"><Icon name="pin" /></span><h3>{SHOP.name}</h3>
                <address>{SHOP.address}</address>
                <a href={directions} target="_blank" rel="noopener noreferrer" className="gold-button">{t.directions} ↗</a>
              </div>
              <div className="map-frame">
                <iframe title={t.mapTitle} src={mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
              </div>
            </div>
          </div>
        </section>

        {/* Reserva de espacio; no se muestran reseñas ficticias. */}
        <section className="section reviews" id="reviews">
          <div className="container">
            <p className="eyebrow">{t.reviewsEyebrow}</p><h2>{t.reviewsTitle}</h2>
            <div className="review-panel">
              <span className="review-panel-icon"><Icon name="message" /></span>
              <div>
                <strong>{t.reviewFuture}</strong>
                <p>{t.reviewsText}</p>
                <small>{t.reviewDetail}</small>
              </div>
            </div>
          </div>
        </section>

        {/* Formulario de prueba sin backend ni reservas reales. */}
        <ClientBooking language={language} barbers={barbers} appointments={appointments} latestBooking={latestBooking} onCreateAppointment={item=>{ const current=getStored('appointments',appointments); const record={...item,id:Math.max(Date.now(), ...current.map(a=>Number(a.id)||0))+1}; const next=[...current,record]; putStored('appointments',next); setAppointments(next); setLatestBooking(record); return record }} />
      </main>
      <footer className="footer"><img className="official-logo-footer" src="/images/logo-oficial.png" alt="The Stars Barbershop" /> {SHOP.address}<small>© {new Date().getFullYear()} · {t.rights}</small></footer>
    </div>
  )
}
