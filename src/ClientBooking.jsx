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
const to24=(hour,minutes,period)=>`${String((Number(hour)%12)+(period==='PM'?12:0)).padStart(2,'0')}:${minutes}`
const from24=value=>{const hour=Number((value||'10:00').split(':')[0]);return {hour:String(hour%12||12),minutes:(value||'10:00').split(':')[1]||'00',period:hour>=12?'PM':'AM'}}
const displayTime=value=>{if(!/^\d{2}:\d{2}$/.test(value||''))return value||'';const {hour,minutes,period}=from24(value);return `${hour}:${minutes} ${period}`}
const isOpenSlot=(day,value)=>{if(!day||!value)return false;const date=new Date(day+'T12:00:00');const weekday=date.getDay();return weekday!==0 && value>='10:00'&&value<='18:30'&&['00','30'].includes(value.slice(3))}

const i18n = {
  es: {
    title: 'Reserva tu próxima cita', demo: 'RESERVAS CONECTADAS A FIRESTORE',
    steps: ['Tus datos', 'Barbero', 'Fecha y hora', 'Servicio', 'Resumen'],
    next: 'Siguiente', back: 'Anterior', restart: 'Comenzar de nuevo',
    first: 'Nombre', last: 'Apellido', phone: 'Número de teléfono',
    help: 'Estos datos se usarán para identificar tu reserva cuando el sistema esté activo.',
    barberHelp: 'Selecciona uno de los perfiles activos de demostración.',
    date: 'Fecha', time: 'Hora', timeHelp: 'Horario de referencia: 6:00 a. m. a 10:00 p. m. Los horarios disponibles se confirmarán con el propietario.',
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
    barberError: 'Selecciona un barbero.', timeError: 'Selecciona una hora.',
    serviceError: 'Selecciona un servicio.',
    client: 'Cliente', barber: 'Barbero', service: 'Servicio',
    confirm: 'Confirmar cita', confirmed: '¡Tu cita ha sido confirmada!', warning: 'Tu cita se guardará en Firestore al confirmar.',
    imageAlt: 'Fotografía de ejemplo de', imageFallback: 'Imagen de ejemplo no disponible',
  },
  en: {
    title: 'Book your next appointment', demo: 'BOOKINGS SAVED TO FIRESTORE',
    steps: ['Your details', 'Barber', 'Date & time', 'Service', 'Summary'],
    next: 'Next', back: 'Back', restart: 'Start again',
    first: 'First name', last: 'Last name', phone: 'Phone number',
    help: 'These details will identify your booking when the system goes live.',
    barberHelp: 'Choose an active demo barber profile.',
    date: 'Date', time: 'Hour', timeHelp: 'Reference hours: 6:00 AM–10:00 PM. Actual availability will be confirmed with the owner.',
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
    barberError: 'Choose a barber.', timeError: 'Choose a time.',
    serviceError: 'Choose a service.',
    client: 'Customer', barber: 'Barber', service: 'Service',
    confirm: 'Confirm appointment', confirmed: 'Your appointment has been confirmed!', warning: 'Your booking is saved in Firestore after confirmation.',
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

export default function ClientBooking({ language = 'en', barbers=[], appointments=[], onCreateAppointment, onFindAppointments, onChangeAppointment, onCancelAppointment, latestBooking=null }) {
  const t = i18n[language] || i18n.en
  // Referencia al formulario para mantener visible la nueva pantalla tras cada giro.
  const bookingRef = useRef(null)
  const [mode,setMode] = useState('add')
  const [matches,setMatches] = useState([])
  const [selectedBooking,setSelectedBooking] = useState(null)
  const [searchBusy,setSearchBusy] = useState(false)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState('idle')
  const [direction, setDirection] = useState('forward')
  const [targetStep, setTargetStep] = useState(0)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [phone, setPhone] = useState('')
  const [barber, setBarber] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
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
      if (!first.trim() || !last.trim()) return t.required
      const digits = phone.replace(/\D/g, '')
      if (digits.length !== 10) return t.phoneError
    }
    if (step === 1 && !barber) return t.barberError
    if (step === 2) {
      if (!date || date < todayLocal()) return t.dateError
      if (!time || !isOpenSlot(date,time)) return language==='es'?'Negocio cerrado. Atendemos de lunes a sábado, de 10:00 AM a 7:00 PM. Última cita: 6:30 PM.':'Business closed. Open Monday–Saturday, 10:00 AM–7:00 PM. Last booking: 6:30 PM.'
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
    setDate(''); setTime('10:00'); setService('')
  }

  const chosenBarber = visibleBarbers.find((person) => person.id === barber)
  const shopPhone = '570-817-3470'
  const busyMessage = language==='es' ? `El barbero ${chosenBarber?.name||'seleccionado'} ya tiene una cita agendada para las ${displayTime(time)} del ${date}. Selecciona otro horario. Si tienes alguna inquietud, comunícate con el barbero o con la barbería.` : `${chosenBarber?.name||'The selected barber'} already has an appointment at ${displayTime(time)} on ${date}. Choose a different time. If you have questions, contact the barber or the barbershop.`
  const animationClass = phase === 'idle' ? '' : `cb-${phase}-${direction}`

  async function saveDemoAppointment(){
    if(saved || saveLock.current || !chosenBarber || !date || !isOpenSlot(date,time) || !service || !first.trim() || !last.trim() || phone.replace(/\D/g,'').length!==10) return
    if(appointments.some(a=>a.barberId===barber && a.date===date && a.time===time)) {setError(busyMessage);return}
    saveLock.current=true
    try {
      if(typeof onCreateAppointment!=='function') throw new Error('El guardado no está conectado al módulo principal.')
      const record=await onCreateAppointment({barberId:barber,first:first.trim(),last:last.trim(),phone:formatPhone(phone),date,time,service:i18n.en.names[service],walkIn:false})
      if(!record?.id) throw new Error('No se confirmó el almacenamiento de la cita.')
      setSavedRecord(record)
      setSaved(true)
      setError('')
    } catch (failure) {saveLock.current=false;const code=failure?.code||'';setError(code==='permission-denied'||code==='already-exists' ? busyMessage : (language==='es'?'No se pudo guardar esta cita. Vuelve a intentarlo.':'Could not save this booking. Please try again.'));console.error(failure)}
  }
  async function searchBooking(event){
    event.preventDefault()
    if(!first.trim()||!last.trim()||phone.replace(/\D/g,'').length!==10){setError(language==='es'?'Completa nombre, apellido y teléfono.':'Enter first name, last name and phone.');return}
    setSearchBusy(true);setError('');setMatches([]);setSelectedBooking(null)
    try{
      const result=await onFindAppointments({first:first.trim(),last:last.trim(),phone:formatPhone(phone)})
      setMatches(result)
      if(!result.length)setError(language==='es'?'No encontramos una cita en esta sesión del navegador.':'No booking found in this browser session.')
    }catch(err){setError(err.message)}
    finally{setSearchBusy(false)}
  }
  async function modifyBooking(event){
    event.preventDefault()
    if(!selectedBooking||!date||!time||date<todayLocal())return
    setSearchBusy(true);setError('')
    try {
      await onChangeAppointment(selectedBooking,{date,time})
      setSelectedBooking(null);setMatches([])
      setError(language==='es'?'Cita modificada correctamente.':'Booking updated successfully.')
    }catch(err){setError(err.message)}
    finally{setSearchBusy(false)}
  }
  async function cancelFoundBooking(){
    if(!selectedBooking||!window.confirm(language==='es'?'¿Cancelar esta cita?':'Cancel this booking?'))return
    setSearchBusy(true);setError('')
    try{
      await onCancelAppointment(selectedBooking)
      setSelectedBooking(null);setMatches(matches.filter(x=>x.id!==selectedBooking.id))
      setError(language==='es'?'Cita cancelada correctamente.':'Booking cancelled successfully.')
    }catch(err){setError(err.message)}
    finally{setSearchBusy(false)}
  }
  return (
    <section id="booking" ref={bookingRef} className="client-booking section">
      <div className="container cb-container">
        <p className="cb-eyebrow">THE STARS BARBERSHOP</p>
        <h2>{t.title}</h2>
        {mode==='find' && <div className="cb-search-panel">
          <button type="button" className="cb-back cb-search-back" onClick={()=>{setMode('add');setError('');setSelectedBooking(null)}}>← {language==='es'?'Agregar':'Add'}</button>
          <form className="cb-fields" onSubmit={searchBooking}>
            <label>{t.first} *<input value={first} autoComplete="given-name" onChange={e=>setFirst(e.target.value)}/></label>
            <label>{t.last} *<input value={last} autoComplete="family-name" onChange={e=>setLast(e.target.value)}/></label>
            <label>{t.phone} *<input type="tel" inputMode="tel" value={phone} placeholder="Ej. (570) 555-0100" onChange={e=>setPhone(formatPhone(e.target.value))}/></label>
            <button type="submit" className="cb-next cb-search-submit" disabled={searchBusy}>{language==='es'?'Buscar cita':'Find booking'}</button>
          </form>
          {matches.map(a=><div className="cb-summary" key={a.id}>
            <p><strong>{a.first} {a.last}</strong> · {barbers.find(b=>b.id===a.barberId)?.name||''}</p>
            <p>{a.date} · {displayTime(a.time)} · {a.service}</p>
            <button className="cb-next" type="button" onClick={()=>{setSelectedBooking(a);setDate(a.date);setTime(a.time)}}>{language==='es'?'Modificar cita':'Modify booking'}</button>
          </div>)}
          {error && <p role="status" className="cb-error">{error}</p>}
          {selectedBooking && <form className="cb-fields" onSubmit={modifyBooking}>
            <h3>{language==='es'?'Modificar cita':'Modify booking'}</h3>
            <label>{t.date}<input type="date" required min={todayLocal()} value={date} onChange={e=>setDate(e.target.value)}/></label>
            <label>{t.time}<input type="time" required value={time} onChange={e=>setTime(e.target.value)}/></label>
            <div className="cb-actions"><button className="cb-next" disabled={searchBusy}>{language==='es'?'Guardar cambios':'Save changes'}</button><button className="cb-back" type="button" disabled={searchBusy} onClick={cancelFoundBooking}>{language==='es'?'Cancelar cita':'Cancel booking'}</button></div>
          </form>}
        </div>}
        {mode==='add' && <>


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
                <label>{t.date}<input type="date" min={todayLocal()} value={date} onChange={(e) => { setDate(e.target.value); setTime('10:00'); setError('') }} /></label>
                <p className="cb-help">{language==='es'?'Lunes a sábado, 10:00 AM–7:00 PM. Última reserva a las 6:30 PM. Domingo cerrado.':'Monday–Saturday, 10:00 AM–7:00 PM. Last booking at 6:30 PM. Closed Sunday.'}</p>
                <div className="cb-time-selectors">
                  <label>{language==='es'?'Hora':'Hour'}<select value={from24(time).hour} onChange={e=>{setTime(to24(e.target.value,from24(time).minutes,from24(time).period));setError('')}}>{Array.from({length:12},(_,i)=><option value={String(i+1)} key={i}>{i+1}</option>)}</select></label>
                  <label>{language==='es'?'Minutos':'Minutes'}<select value={from24(time).minutes} onChange={e=>{setTime(to24(from24(time).hour,e.target.value,from24(time).period));setError('')}}><option value="00">00</option><option value="30">30</option></select></label>
                  <label>AM / PM<select value={from24(time).period} onChange={e=>{setTime(to24(from24(time).hour,from24(time).minutes,e.target.value));setError('')}}><option value="AM">AM</option><option value="PM">PM</option></select></label>
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
                  <div><dt>{t.time}</dt><dd>{displayTime(time)}</dd></div>
                  <div><dt>{t.service}</dt><dd>{t.names[service]}</dd></div>
                </dl>
                <p className="cb-warning">{saved ? t.confirmed : (language==='es'?'Verifica los datos antes de confirmar.':'Review the details before confirming.')}</p>


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
        {error && <div role="alert" className="cb-error"><p>{error}</p>{error===busyMessage && <p>{chosenBarber?.phone && <span>{language==='es'?'Barbero':'Barber'}: <a href={'tel:'+chosenBarber.phone}>{chosenBarber.phone}</a><br/></span>}{shopPhone && <span>{language==='es'?'Barbería':'Barbershop'}: <a href={'tel:'+shopPhone}>{shopPhone}</a></span>}</p>}</div>}
        <div className={`cb-actions ${step === 4 ? 'cb-actions-summary' : ''}`}>
          {step > 0 && <button type="button" className="cb-back" disabled={phase !== 'idle'} onClick={() => navigate(step - 1)}>← {t.back}</button>}
          {step < 4 ? <>
            <button type="button" className="cb-next" disabled={phase !== 'idle'} onClick={() => navigate(step + 1)}>{step===0?(language==='es'?'Agregar':'Add'):t.next} →</button>
            {step===0 && <button type="button" className="cb-back" disabled={phase !== 'idle'} onClick={()=>{setMode('find');setError('');setSelectedBooking(null);setMatches([])}}>{language==='es'?'Modificar':'Modify'}</button>}
          </> : <>
            <button type="button" className="cb-next cb-confirm" disabled={saved || phase !== 'idle' || !first.trim() || !last.trim() || phone.replace(/\D/g,'').length!==10 || !chosenBarber || !date || !isOpenSlot(date,time) || !service} onClick={saveDemoAppointment}>{saved ? '✓ ' + t.confirmed : t.confirm}</button>
            <button type="button" className="cb-back cb-restart" onClick={reset}>{t.restart} ↻</button>
          </>}
        </div>
        </>}
      </div>
    </section>
  )
}
