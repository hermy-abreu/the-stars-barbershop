/**
 * THE STARS BARBERSHOP — ClientBooking.jsx (v1.0)
 * Flujo de demostración: datos → barbero → fecha/hora → servicio → resumen.
 * No almacena datos ni consulta horarios reales. Ninguna cita se confirma.
 * Al integrar backend, validar allí disponibilidad, horarios y conflictos.
 */
import { useRef, useState } from 'react'
import './ClientBooking.css'
import {formatPhone} from './demoStore'

const GROUPS = [
  { id: 'adults', ids: ['classic', 'fade', 'haircutBeard', 'fadeBeard', 'beard', 'lineup', 'shave'] },
  { id: 'kids', ids: ['kidscut', 'kidsfade', 'kidslineup'] },
  { id: 'other', ids: ['other'] },
]
const DEMO_TIMES = Array.from({length: 33}, (_, i) => { const minutes=6*60+i*30; return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}` })

const i18n = {
  es: {
    title: 'Reserva tu próxima cita', demo: 'DEMOSTRACIÓN LOCAL: SIN RESERVAS REALES NI SERVIDOR',
    steps: ['Tus datos', 'Barbero', 'Fecha y hora', 'Servicio', 'Resumen'],
    next: 'Siguiente', back: 'Anterior', restart: 'Comenzar de nuevo',
    first: 'Nombre', last: 'Apellido', phone: 'Número de celular',
    help: 'Estos datos se usarán para identificar tu reserva cuando el sistema esté activo.',
    barberHelp: 'Selecciona uno de los perfiles activos de demostración.',
    date: 'Fecha', time: 'Horario de ejemplo', timeHelp: 'Horario de referencia: 6:00 a. m. a 10:00 p. m. Los horarios disponibles se confirmarán con el propietario.',
    groups: { adults: 'Cortes y arreglos', kids: 'Servicios para niños', other: 'Otras opciones' },
    names: {
      classic: 'Corte clásico', fade: 'Degradado / Skin Fade', haircutBeard: 'Corte y barba',
      fadeBeard: 'Degradado y barba', beard: 'Recorte de barba', lineup: 'Perfilado',
      shave: 'Afeitado con toalla caliente', kidscut: 'Corte para niños',
      kidsfade: 'Degradado para niños', kidslineup: 'Perfilado para niños',
      other: 'Otro / No estoy seguro',
    },
    required: 'Completa los campos obligatorios para continuar.',
    phoneError: 'Introduce un celular válido de 10 dígitos.',
    dateError: 'Selecciona una fecha de hoy en adelante.',
    barberError: 'Selecciona un barbero.', timeError: 'Selecciona un horario de ejemplo.',
    serviceError: 'Selecciona un servicio.',
    client: 'Cliente', barber: 'Barbero', service: 'Servicio',
    confirm: 'Confirmar cita', confirmed: '¡Tu cita ha sido confirmada!', warning: 'Esta es una demostración local, no una reserva real.',
    imageAlt: 'Fotografía de ejemplo de', imageFallback: 'Imagen de ejemplo no disponible',
  },
  en: {
    title: 'Book your next appointment', demo: 'LOCAL DEMO: NO REAL BOOKINGS OR SERVER',
    steps: ['Your details', 'Barber', 'Date & time', 'Service', 'Summary'],
    next: 'Next', back: 'Back', restart: 'Start again',
    first: 'First name', last: 'Last name', phone: 'Mobile number',
    help: 'These details will identify your booking when the system goes live.',
    barberHelp: 'Choose an active demo barber profile.',
    date: 'Date', time: 'Sample time', timeHelp: 'Reference hours: 6:00 AM–10:00 PM. Actual availability will be confirmed with the owner.',
    groups: { adults: 'Haircuts & grooming', kids: "Kids' services", other: 'Other' },
    names: {
      classic: 'Classic Haircut', fade: 'Skin Fade / Bald Fade', haircutBeard: 'Haircut & Beard',
      fadeBeard: 'Skin Fade & Beard', beard: 'Beard trimmer', lineup: 'Line Up',
      shave: 'Hot Towel Shave', kidscut: 'Kids Haircut', kidsfade: 'Kids Skin Fade',
      kidslineup: 'Kids Line Up', other: 'Other / Not sure',
    },
    required: 'Complete all required fields to continue.',
    phoneError: 'Enter a valid 10 to 15 digit mobile number.',
    dateError: 'Choose today or a future date.',
    barberError: 'Choose a barber.', timeError: 'Choose a sample time.',
    serviceError: 'Choose a service.',
    client: 'Customer', barber: 'Barber', service: 'Service',
    confirm: 'Confirm appointment', confirmed: 'Your appointment has been confirmed!', warning: 'This is a local demo, not a real booking.',
    imageAlt: 'Sample photograph of', imageFallback: 'Sample image unavailable',
  },
}

function todayLocal() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** Imagen opcional: si el archivo JPG aún no existe, se muestran iniciales. */
function BarberCard({ barber, selected, onSelect, onProfile, t }) {
  return (
    <label className={`cb-barber ${selected ? 'selected' : ''}`}>
      <input type="radio" name="bookingBarber" checked={selected} onChange={onSelect} />
      <span className="cb-portrait">
        <span aria-hidden="true">{barber.name[0]}</span>
      </span>
      <span className="cb-barber-name">{barber.name}</span>
      <span className="cb-radio-dot" aria-hidden="true" />
    </label>
  )
}

export default function ClientBooking({ language = 'en', barbers=[], appointments=[], onCreateAppointment, latestBooking=null }) {
  const t = i18n[language] || i18n.en
  // Referencia al formulario para mantener visible la nueva pantalla tras cada giro.
  const bookingRef = useRef(null)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState('idle')
  const [direction, setDirection] = useState('forward')
  const [targetStep, setTargetStep] = useState(0)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [phone, setPhone] = useState('')
  const [barber, setBarber] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [service, setService] = useState('')
  const [error, setError] = useState('')
  const [profileToView,setProfileToView] = useState(null)
  const saveLock = useRef(false)
  const [saved,setSaved] = useState(false)
  const [savedRecord,setSavedRecord] = useState(null)
  const visibleBarbers = barbers.filter(b=>b.active!==false)

  // Se valida solo la pantalla actual; nunca se envía información a un servidor.
  function validateCurrent() {
    if (step === 0) {
      if (!first.trim() || !last.trim() || !phone.trim()) return t.required
      const digits = phone.replace(/\D/g, '')
      if (digits.length !== 10) return t.phoneError
    }
    if (step === 1 && !barber) return t.barberError
    if (step === 2) {
      if (!date || date < todayLocal()) return t.dateError
      if (!time) return t.timeError
    }
    if (step === 3 && !service) return t.serviceError
    return ''
  }

  function navigate(next) {
    if (phase !== 'idle') return
    if (next > step) {
      const message = validateCurrent()
      if (message) { setError(message); return }
    }
    setError('')
    setDirection(next > step ? 'forward' : 'backward')
    setTargetStep(next)
    setPhase('out')
  }

  /** Dos mitades: la tarjeta gira para ocultarse, cambiamos contenido en 90°,
   * y la nueva cara entra hasta completar una sensación de giro de 180°.
   * onAnimationEnd evita temporizadores que puedan quedar pendientes.
   */
  function onCardAnimationEnd(event) {
    if (event.target !== event.currentTarget) return
    if (phase === 'out') {
      setStep(targetStep)
      setPhase('in')
    } else if (phase === 'in') {
      setPhase('idle')
      // En pantallas pequeñas, el giro puede variar la altura del contenido.
      // Volvemos al inicio del formulario para no dejar los controles fuera de vista.
      bookingRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })
    }
  }

  function reset() {
    saveLock.current=false; setSaved(false); setSavedRecord(null); setStep(0); setPhase('idle'); setError('')
    setFirst(''); setLast(''); setPhone(''); setBarber('')
    setDate(''); setTime(''); setService('')
  }

  const chosenBarber = visibleBarbers.find((person) => person.id === barber)
  const animationClass = phase === 'idle' ? '' : `cb-${phase}-${direction}`

  function saveDemoAppointment(){
    if(saved || saveLock.current || !chosenBarber || !date || !time || !service || !first.trim() || !last.trim() || phone.replace(/\D/g,'').length!==10) return
    if(appointments.some(a=>a.barberId===barber && a.date===date && a.time===time && !a.walkIn)) {setError(language==='es'?'Horario ya ocupado para este barbero.':'Time already reserved for this barber.');return}
    saveLock.current=true
    try {
      if(typeof onCreateAppointment!=='function') throw new Error('El guardado no está conectado al módulo principal.')
      const record=onCreateAppointment({barberId:barber,first:first.trim(),last:last.trim(),phone:formatPhone(phone),date,time,service:i18n.en.names[service],walkIn:false})
      if(!record?.id) throw new Error('No se confirmó el almacenamiento de la cita.')
      setSavedRecord(record)
      setSaved(true)
      setError('')
    } catch (failure) {saveLock.current=false;setError(language==='es'?'No pudimos guardar esta cita de prueba. Vuelve a intentarlo.':'Could not save this demo booking. Please try again.');console.error(failure)}
  }
  return (
    <section id="booking" ref={bookingRef} className="client-booking section">
      <div className="container cb-container">
        <p className="cb-eyebrow">THE STARS BARBERSHOP</p>
        <h2>{t.title}</h2>
        <p className="cb-demo" role="note">{t.demo}</p>

        <nav className="cb-progress" aria-label={t.title}>
          {t.steps.map((label, index) => (
            <div className={`cb-progress-item ${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`} key={label} aria-current={index === step ? 'step' : undefined}>
              <span className="cb-progress-number">{index + 1}</span>
              <span className="cb-progress-label">{label}</span>
            </div>
          ))}
        </nav>

        <div className="cb-perspective">
          <div className={`cb-panel ${animationClass}`} onAnimationEnd={onCardAnimationEnd}>
            <h3>{step + 1}. {t.steps[step]}</h3>

            {step === 0 && (
              <div className="cb-fields">
                <label>{t.first} *<input value={first} autoComplete="given-name" maxLength={80} onChange={(e) => { setFirst(e.target.value); setError('') }} /></label>
                <label>{t.last} *<input value={last} autoComplete="family-name" maxLength={80} onChange={(e) => { setLast(e.target.value); setError('') }} /></label>
                <label>{t.phone} *<input type="tel" value={phone} autoComplete="tel" inputMode="tel" maxLength={14} placeholder="Ej. (570) 555-0100" onChange={(e) => { setPhone(formatPhone(e.target.value)); setError('') }} /></label>
                <p className="cb-help">{t.help}</p>
              </div>
            )}

            {step === 1 && (
              <>
                <p className="cb-help">{t.barberHelp}</p>
                <div className="cb-barber-grid">
                  {visibleBarbers.map((person) => <div key={person.id} className="cb-person-card"><BarberCard barber={person} selected={barber===person.id} onSelect={()=>{setBarber(person.id);setError('')}} t={t}/><button className="cb-profile-link" type="button" onClick={()=>setProfileToView(person)}>{language==='es'?'Ver perfil':'View profile'}</button></div>)}
                  {!visibleBarbers.length && <p>{language==='es'?'No hay barberos activos.':'No active barbers.'}</p>}
                </div>
              </>
            )}

            {step === 2 && (
              <div className="cb-fields">
                <label>{t.date}<input type="date" min={todayLocal()} value={date} onChange={(e) => { setDate(e.target.value); setTime(''); setError('') }} /></label>
                <p className="cb-help">{t.timeHelp}</p>
                <div className="cb-time-grid" aria-label={t.time}>
                  {DEMO_TIMES.map((slot) => <button key={slot} type="button" aria-pressed={time === slot} className={time === slot ? 'selected' : ''} onClick={() => { setTime(slot); setError('') }}>{slot}</button>)}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="cb-service-groups">
                {GROUPS.map((group) => <div key={group.id}>
                  <h4>{t.groups[group.id]}</h4>
                  <div className="cb-service-grid">
                    {group.ids.map((id) => <label key={id} className={`cb-service ${service === id ? 'selected' : ''}`}>
                      <input type="radio" name="bookingService" checked={service === id} onChange={() => { setService(id); setError('') }} />
                      <span>{t.names[id]}</span>
                    </label>)}
                  </div>
                </div>)}
              </div>
            )}

            {step === 4 && (
              <div className="cb-summary">
                <dl>
                  <div><dt>{t.client}</dt><dd>{first.trim()} {last.trim()}</dd></div>
                  <div><dt>{t.phone}</dt><dd>{phone}</dd></div>
                  <div><dt>{t.barber}</dt><dd>{chosenBarber?.name}</dd></div>
                  <div><dt>{t.date}</dt><dd>{date}</dd></div>
                  <div><dt>{t.time}</dt><dd>{time}</dd></div>
                  <div><dt>{t.service}</dt><dd>{t.names[service]}</dd></div>
                </dl>
                <p className="cb-warning">{saved ? t.confirmed + ' ' + (language==='es'?'(Demostración local, no es una reserva real).':'(Local demo, not a real booking).') : t.warning}</p>
                {saved && savedRecord && <p role="status" className="cb-warning"><strong>{language==='es'?'Reserva de prueba registrada':'Demo booking registered'} · #{savedRecord.id}</strong><br/>{chosenBarber?.name} · {savedRecord.date} · {savedRecord.time}<br/>{language==='es'?'Consulta esa misma fecha en Staff y en el panel del propietario.':'Check this date in Staff and the owner dashboard.'}</p>}

              </div>
            )}
          </div>
        </div>

        {profileToView && <div className="cb-profile-overlay"><section className="cb-profile-modal" role="dialog" aria-modal="true" aria-label="Perfil profesional">
          <button className="cb-profile-close" type="button" onClick={()=>setProfileToView(null)}>✕</button>
          {profileToView.photo && <img className="cb-profile-photo" src={profileToView.photo} alt=""/>}
          <h3>{profileToView.name}</h3>
          {profileToView.alias && <p>“{profileToView.alias}”</p>}
          {profileToView.phone && <p>☎ <a href={'tel:'+profileToView.phone}>{profileToView.phone}</a></p>}
          {['instagram','facebook','tiktok','youtube'].filter(k=>profileToView[k]).map(k=><p key={k}><strong>{k[0].toUpperCase()+k.slice(1)}:</strong> {profileToView[k]}</p>)}
          <button type="button" className="cb-next" onClick={()=>{setBarber(profileToView.id);setProfileToView(null)}}>{language==='es'?'Elegir este barbero':'Choose this barber'}</button>
        </section></div>}
        {error && <p role="alert" className="cb-error">{error}</p>}
        <div className={`cb-actions ${step === 4 ? 'cb-actions-summary' : ''}`}>
          {step > 0 && <button type="button" className="cb-back" disabled={phase !== 'idle'} onClick={() => navigate(step - 1)}>← {t.back}</button>}
          {step < 4 ? <button type="button" className="cb-next" disabled={phase !== 'idle'} onClick={() => navigate(step + 1)}>{t.next} →</button> : <>
            <button type="button" className="cb-next cb-confirm" disabled={saved || phase !== 'idle' || !first.trim() || !last.trim() || phone.replace(/\D/g,'').length!==10 || !chosenBarber || !date || !time || !service} onClick={saveDemoAppointment}>{saved ? '✓ ' + t.confirmed : t.confirm}</button>
            <button type="button" className="cb-back cb-restart" onClick={reset}>{t.restart} ↻</button>
          </>}
        </div>
      </div>
    </section>
  )
}
