/**
 * THE STARS BARBERSHOP — BarberDashboard.jsx (v1.3)
 * DEMOSTRACIÓN LOCAL: no hay servidor, autenticación real ni persistencia.
 * Las cuentas, contraseñas y citas de esta pantalla son FICTICIAS.
 * NO usar datos personales reales. El aislamiento se simula filtrando barberId.
 * En producción, la autorización se aplicará EN EL SERVIDOR.
 */
import { useMemo, useState, useRef } from 'react'
import './BarberDashboard.css'
import OwnerDashboard from './OwnerDashboard'
import {formatPhone} from './demoStore'


function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function fromIso(value) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function shiftDate(value, offset) {
  const date = fromIso(value)
  date.setDate(date.getDate() + offset)
  return isoDate(date)
}
function timeLabel(value, language) {
  return new Date(`2000-01-01T${value}:00`).toLocaleTimeString(language === 'es' ? 'es-US' : 'en-US', { hour: 'numeric', minute: '2-digit' })
}
function initialAppointments() {
  const today = isoDate(new Date())
  // Cada cita tiene un identificador único y el ID de SU barbero.
  return [
    { id: 1, barberId: 'HA-001', first: 'Juan', last: 'Pérez', phone: '570-555-0101', date: today, time: '09:00', service: 'Classic Haircut', walkIn: false },
    { id: 2, barberId: 'HA-001', first: 'María', last: 'López', phone: '(570) 555-0102', date: today, time: '10:30', service: 'Line Up', walkIn: false },
    { id: 3, barberId: 'HA-001', first: 'Carlos', last: 'Ruiz', phone: '(570) 555-0103', date: shiftDate(today, 1), time: '11:00', service: 'Skin Fade', walkIn: false },
    { id: 4, barberId: 'AH-002', first: 'Ana', last: 'Torres', phone: '(570) 555-0104', date: today, time: '09:30', service: 'Haircut', walkIn: false },
    { id: 5, barberId: 'MR-003', first: 'Luis', last: 'Díaz', phone: '(570) 555-0105', date: today, time: '14:00', service: 'Beard trim', walkIn: false },
  ]
}

const WORDS = {
  es: {
    heading: 'Acceso de barberos', demo: 'DEMO: usuarios y citas ficticios. No hay acceso seguro ni almacenamiento real.',
    username: 'Usuario', password: 'Contraseña', login: 'Entrar', invalid: 'Usuario o contraseña de demostración incorrectos.',
    dashboard: 'Mi agenda', logout: 'Cerrar sesión', today: 'Hoy', monthBack: 'Mes anterior', monthNext: 'Mes siguiente',
    days: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], appointments: 'Clientes del día', empty: 'No tienes citas para este día.',
    walkin: '+ Agregar Walk-in', first: 'Nombre', last: 'Apellido', phone: 'Teléfono',
    cancel: 'Cancelar', save: 'Guardar', close: 'Cerrar', edit: 'Modificar fecha/hora', remove: 'Eliminar cita',
    time: 'Hora', date: 'Fecha', service: 'Servicio', appointment: 'Datos del cliente',
    walkinTitle: 'Cliente sin cita', required: 'Debes introducir el nombre y apellido del cliente.',
    removeAsk: '¿Eliminar esta cita ficticia?', overlap: 'Ese horario coincide con otra cita de este barbero.',
    conflict: 'Selecciona otro horario antes de guardar.',
    walkinNote: 'Los Walk-in se registran hoy a la hora actual, aunque haya una cita cercana.', walkinOnlyToday: 'Solo puedes registrar Walk-in en el día actual.',
    example: 'Cuentas de prueba: hermy / Ab1234 · alex / 123456 · miguel / Mr1234 · owner / Ow1234',
    reserved: 'Con cita', walkinType: 'Sin cita', notSaved: 'Los datos de prueba se conservan únicamente en este navegador.',
    back: 'Volver a la web', saveChanges: 'Guardar cambios', noWorkingSchedule: 'La jornada laboral real se configurará con el propietario.',
  },
  en: {
    heading: 'Barber access', demo: 'DEMO: fictitious accounts and appointments. No secure access or real storage.',
    username: 'Username', password: 'Password', login: 'Sign in', invalid: 'Incorrect demo username or password.',
    dashboard: 'My schedule', logout: 'Sign out', today: 'Today', monthBack: 'Previous month', monthNext: 'Next month',
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], appointments: 'Appointments for the day', empty: 'No appointments for this day.',
    walkin: '+ Add walk-in', first: 'First name', last: 'Last name', phone: 'Phone',
    cancel: 'Cancel', save: 'Save', close: 'Close', edit: 'Change date/time', remove: 'Delete appointment',
    time: 'Time', date: 'Date', service: 'Service', appointment: 'Customer details',
    walkinTitle: 'Walk-in customer', required: 'Enter the customer’s first and last name.',
    removeAsk: 'Delete this fictitious appointment?', overlap: 'Another appointment already uses this time for this barber.',
    conflict: 'Choose another time before saving.',
    walkinNote: 'Walk-ins are recorded today at the current time, even near booked appointments.', walkinOnlyToday: 'Walk-ins can only be added for today.',
    example: 'Demo accounts: hermy / Ab1234 · alex / 123456 · miguel / Mr1234 · owner / Ow1234',
    reserved: 'Booked', walkinType: 'Walk-in', notSaved: 'Demo data remains in this browser only.',
    back: 'Back to website', saveChanges: 'Save changes', noWorkingSchedule: 'Real working schedules will be configured with the owner.',
  },
}

export default function BarberDashboard({ language = 'es', onExit, barbers, setBarbers, appointments, setAppointments }) {
  const t = WORDS[language] || WORDS.en
  const locale = language === 'es' ? 'es-US' : 'en-US'
  // Perfiles ficticios compartidos por las pantallas Staff y propietario.
  // Al recargar vuelven a su estado inicial (no existe base de datos).
  const [account, setAccount] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const appointmentListRef = useRef(null)
  function revealList(){ if(window.matchMedia('(max-width:950px)').matches) requestAnimationFrame(()=>appointmentListRef.current?.scrollIntoView({behavior:'smooth',block:'start'})) }
  const [selectedDay, setSelectedDay] = useState(() => isoDate(new Date()))
  const [viewMonth, setViewMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draftDate, setDraftDate] = useState('')
  const [draftTime, setDraftTime] = useState('')
  const [addingWalkin, setAddingWalkin] = useState(false)
  const [walkinFirst, setWalkinFirst] = useState('')
  const [walkinLast, setWalkinLast] = useState('')
  const [modalError, setModalError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [profileOpen,setProfileOpen] = useState(false)
  const currentBarber = barbers.find(b=>b.id===account?.id)
  const [profileDraft,setProfileDraft] = useState(null)
  function openProfile(){setProfileDraft({...currentBarber});setProfileOpen(true)}
  function saveProfile(event){event.preventDefault();if(profileDraft.phone && formatPhone(profileDraft.phone).replace(/\D/g,'').length!==10){alert(language==='es'?'El teléfono debe tener 10 dígitos o quedar vacío.':'Use 10 phone digits or leave blank.');return}setBarbers(old=>old.map(b=>b.id===account.id?{...b,alias:profileDraft.alias||'',phone:formatPhone(profileDraft.phone)}:b));setProfileOpen(false)}

  const ownAppointments = useMemo(() => appointments.filter((a) => a.barberId === account?.id), [appointments, account])
  const appointmentsForDay = useMemo(() => ownAppointments.filter(a => a.date === selectedDay).sort((a, b) => a.time.localeCompare(b.time) || a.id - b.id), [ownAppointments, selectedDay])
  const selectedAppointment = ownAppointments.find(a => a.id === selectedId)
  // Outlook: semanas de domingo a sábado, con celdas completas de otros meses.
  const monthStartOffset = viewMonth.getDay()
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  // Siempre se dibuja la cuadrícula completa de semanas (5 o 6) como Outlook.
  const rowCount = Math.ceil((monthStartOffset + daysInMonth) / 7)
  const calendarDays = Array.from({ length: rowCount * 7 }, (_, index) => {
    const cellDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index - monthStartOffset + 1)
    return { date: isoDate(cellDate), label: cellDate.getDate(), outside: cellDate.getMonth() !== viewMonth.getMonth() }
  })
  // Comparación con la zona horaria de la barbería (Pensilvania).
  function shopToday() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date())
  }
  const isTodaySelected = selectedDay === shopToday()

  function login(event) {
    event.preventDefault()
    if (username.trim().toLowerCase() === 'owner' && password === 'Ow1234') {
      setAccount({ id: 'OWNER', name: 'Propietario (demo)', username: 'owner', role: 'owner' })
      setLoginError(''); setPassword(''); return
    }
    const barber = barbers.find(b => b.active !== false && b.username === username.trim().toLowerCase() && b.password === password)
    if (!barber) { setLoginError(t.invalid); return }
    setAccount({ id: barber.id, name: barber.name, username: barber.username, role: 'barber' })
    setLoginError('')
    setPassword('')
  }
  function monthMove(delta) {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1))
  }
  function openAppointment(id) {
    const appointment = ownAppointments.find(a => a.id === id)
    if (!appointment) return
    setSelectedId(id)
    setDraftDate(appointment.date)
    setDraftTime(appointment.time)
    setEditing(false)
    setConfirmDelete(false)
    setModalError('')
  }
  function closeModal() { setSelectedId(null); setAddingWalkin(false); setConfirmDelete(false); setModalError('') }
  function saveEdit(event) {
    event.preventDefault()
    if (!draftDate || !draftTime) { setModalError(t.conflict); return }
    // Esta demo evita dos RESERVAS a la misma hora. No mueve automáticamente otras citas.
    const overlap = ownAppointments.some(a => a.id !== selectedId && !a.walkIn && a.date === draftDate && a.time === draftTime)
    if (overlap && !selectedAppointment.walkIn) { setModalError(t.overlap); return }
    setAppointments(current => current.map(a => a.id === selectedId && a.barberId === account.id ? { ...a, date: draftDate, time: draftTime } : a))
    setSelectedDay(draftDate)
    setViewMonth(new Date(fromIso(draftDate).getFullYear(), fromIso(draftDate).getMonth(), 1))
    closeModal()
  }
  function deleteAppointment() {
    if (!selectedAppointment || !confirmDelete) return
    setAppointments(current => current.filter(a => !(a.id === selectedId && a.barberId === account.id)))
    closeModal()
  }
  function createWalkin(event) {
    event.preventDefault()
    // Ambos campos son obligatorios: nunca identificar una cita solo por el nombre.
    if (!walkinFirst.trim() || !walkinLast.trim()) { setModalError(t.required); return }
    const now = new Date()
    if (selectedDay !== shopToday()) { setModalError(t.walkinOnlyToday); setAddingWalkin(false); return }
    // El Walk-in queda asociado al barbero conectado y a la hora REAL de registro.
    setAppointments(current => [...current, {
      id: Math.max(0, ...current.map(a => a.id)) + 1,
      barberId: account.id, first: walkinFirst.trim(), last: walkinLast.trim(), phone: '',
      date: shopToday(), time: new Intl.DateTimeFormat('en-GB', {timeZone: 'America/New_York', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).format(now),
      service: '', walkIn: true,
    }])
    setSelectedDay(shopToday())
    setViewMonth(new Date(fromIso(shopToday()).getFullYear(), fromIso(shopToday()).getMonth(), 1))
    setWalkinFirst(''); setWalkinLast(''); closeModal()
  }
  function signOut() { setAccount(null); setUsername(''); setPassword(''); closeModal() }

  if (!account) return (
    <section className="barber-area" aria-label={t.heading}>
      <div className="barber-login-card">
        <button className="barber-simple-link" type="button" onClick={onExit}>← {t.back}</button>
        <img src="/images/logo-oficial.png" className="barber-official-logo" alt="The Stars Barbershop" />
        <h2>{t.heading}</h2>
        <p className="barber-demo-banner">{t.demo}</p>
        <form onSubmit={login}>
          <label>{t.username}<input required autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} /></label>
          <label>{t.password}<input required type="password" autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} /></label>
          {loginError && <p role="alert" className="barber-error">{loginError}</p>}
          <button type="submit" className="barber-gold-button">{t.login}</button>
        </form>
        <p className="barber-demo-hint">{t.example}</p>
      </div>
    </section>
  )

  if (account.role === 'owner') return (
    <OwnerDashboard language={language} onExit={onExit} onLogout={signOut} appointments={appointments} barbers={barbers} onBarbersChange={setBarbers} />
  )

  return (
    <section className="barber-area" aria-label={t.dashboard}>
      {profileOpen && profileDraft && <div className="profile-overlay" role="presentation"><section className="profile-dialog" role="dialog" aria-modal="true" aria-label="Mi perfil profesional">
        <h3>{language==='es'?'Editar perfil profesional':'Edit professional profile'}</h3>
        <p>{language==='es'?'El nombre y apellido los administra el propietario. Todos los demás datos son opcionales y visibles al público.':'Name is managed by the owner. Other fields are optional and public.'}</p>
        <form onSubmit={saveProfile} className="profile-fields">
          <label>{language==='es'?'Nombre y apellido':'Full name'}<input value={currentBarber?.name||''} disabled /></label>
          <label>{language==='es'?'Fotografía':'Photo'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadProfilePhoto}/></label>
          {profileDraft.photo && <img className="profile-photo-preview" alt="Vista previa" src={profileDraft.photo} />}
          {profileDraft.photo && <button type="button" onClick={()=>setProfileDraft(old=>({...old,photo:''}))}>{language==='es'?'Quitar fotografía':'Remove photo'}</button>}
          <label>{language==='es'?'Alias profesional':'Professional nickname'}<input maxLength={60} value={profileDraft.alias||''} onChange={e=>setProfileDraft(old=>({...old,alias:e.target.value}))}/></label>
          <label>{language==='es'?'Teléfono público':'Public phone'}<input type="tel" inputMode="tel" placeholder="Ej. (570) 555-0100" value={profileDraft.phone||''} onChange={e=>setProfileDraft(old=>({...old,phone:formatPhone(e.target.value)}))}/></label>
          {['instagram','facebook','tiktok','youtube'].map(network=><label key={network}>{network[0].toUpperCase()+network.slice(1)}<input maxLength={200} value={profileDraft[network]||''} placeholder="@usuario o https://..." onChange={e=>setProfileDraft(old=>({...old,[network]:e.target.value}))}/></label>)}
          <div className="profile-dialog-actions"><button type="button" onClick={()=>setProfileOpen(false)}>{t.cancel}</button><button type="submit" className="barber-gold-button">{t.save}</button></div>
        </form></section></div>}

      <div className="barber-shell">
        <header className="barber-panel-header">
          <div><img src="/images/logo-oficial.png" className="barber-official-logo barber-logo-small" alt="The Stars Barbershop" /><p className="barber-kicker">STAFF · DEMO</p><h2>{t.dashboard}</h2><p>{account.name} · {account.id}</p></div>
          <div className="barber-header-actions"><button type="button" onClick={openProfile} aria-label="Editar mi perfil profesional">👤 {language === 'es' ? 'Mi perfil' : 'My profile'}</button><button type="button" onClick={onExit}>{t.back}</button><button type="button" onClick={signOut}>{t.logout}</button></div>
        </header>
        <p className="barber-demo-banner">{t.demo} {t.notSaved}</p>
        {/* Calendario Outlook: vista del mes completo, sin mini-cuadrícula. */}
        <div className="barber-calendar-layout">
          <article className="barber-card barber-calendar-card">
            <div className="barber-month-controls">
              <button type="button" className="barber-today" onClick={() => {
                const current = shopToday()
                setSelectedDay(current)
                const date = fromIso(current)
                setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1))
              }}>{t.today}</button>
              <div className="barber-month-navigation">
                <button type="button" onClick={() => monthMove(-1)} aria-label={t.monthBack}>‹</button>
                <button type="button" onClick={() => monthMove(1)} aria-label={t.monthNext}>›</button>
              </div>
              <h3 className="barber-month-title">{viewMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</h3>
            </div>
            <div className="barber-calendar-grid" aria-label={t.dashboard}>
              {t.days.map((day, index) => <div className="barber-weekday" key={`${day}-${index}`}>{day}</div>)}
              {calendarDays.map(cell => {
                const count = ownAppointments.filter(a => a.date === cell.date).length
                return <button key={cell.date} type="button"
                  className={`barber-day ${cell.outside ? 'outside' : ''} ${cell.date === selectedDay ? 'selected' : ''} ${cell.date === shopToday() ? 'today' : ''}`}
                  aria-label={`${cell.date}, ${count} ${t.appointments}`}
                  aria-pressed={cell.date === selectedDay}
                  onClick={() => {
                    setSelectedDay(cell.date)
                    revealList()
                    if (cell.outside) { const d = fromIso(cell.date); setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1)) }
                  }}>
                  <span className="barber-day-number">{cell.label}</span>
                  {count > 0 && <span className="barber-day-count">{count}</span>}
                </button>
              })}
            </div>
          </article>
          {/* En desktop esta lista aparece a la derecha; en móvil, debajo. */}
          <article className="barber-card barber-appointments" ref={appointmentListRef} id="barber-client-list">
            <div className="barber-day-heading"><div><h3>{t.appointments}</h3><p>{fromIso(selectedDay).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
              {isTodaySelected && <button type="button" className="barber-add" onClick={() => { setAddingWalkin(true); setModalError('') }}>{t.walkin}</button>}
            </div>
            {appointmentsForDay.length ? <ul className="barber-appointment-list">{appointmentsForDay.map(a => <li key={a.id}>
              <button type="button" className="barber-client-row" onClick={() => openAppointment(a.id)}>
                <time>{timeLabel(a.time, language)}</time><span><strong>{a.first} {a.last}</strong><small>{a.walkIn ? t.walkinType : t.reserved}{a.phone ? ` · ${a.phone}` : ''}</small></span><span className="barber-arrow">›</span>
              </button>
            </li>)}</ul> : <p className="barber-empty">{t.empty}</p>}
            <p className="barber-small-note">{t.noWorkingSchedule}</p>
          </article>
        </div>
      </div>

      {/* El modal se cierra con el botón y sin alterar datos si no se guardan. */}
      {(selectedAppointment || addingWalkin) && <div className="barber-modal-overlay" onMouseDown={event => { if (event.target === event.currentTarget) closeModal() }}>
        <div className="barber-modal" role="dialog" aria-modal="true" aria-label={addingWalkin ? t.walkinTitle : t.appointment}>
          <button type="button" className="barber-modal-close" onClick={closeModal} aria-label={t.close}>✕</button>
          {addingWalkin ? <>
            <h3>{t.walkinTitle}</h3><p className="barber-small-note">{t.walkinNote}</p>
            <form onSubmit={createWalkin} className="barber-modal-form">
              <label>{t.first} *<input autoFocus required maxLength={80} value={walkinFirst} onChange={e => setWalkinFirst(e.target.value)} /></label>
              <label>{t.last} *<input required maxLength={80} value={walkinLast} onChange={e => setWalkinLast(e.target.value)} /></label>
              {modalError && <p role="alert" className="barber-error">{modalError}</p>}
              <div className="barber-modal-actions"><button type="button" onClick={closeModal}>{t.cancel}</button><button type="submit" className="barber-gold-button">{t.save}</button></div>
            </form>
          </> : <>
            <h3>{t.appointment}</h3>
            <dl className="barber-client-details">
              <div><dt>{t.first}</dt><dd>{selectedAppointment.first}</dd></div>
              <div><dt>{t.last}</dt><dd>{selectedAppointment.last || '—'}</dd></div>
              <div><dt>{t.phone}</dt><dd>{selectedAppointment.phone || '—'}</dd></div>
              <div><dt>{t.service}</dt><dd>{selectedAppointment.service || '—'}</dd></div>
            </dl>
            {editing ? <form className="barber-modal-form" onSubmit={saveEdit}>
              <label>{t.date}<input type="date" required value={draftDate} onChange={e => setDraftDate(e.target.value)} /></label>
              <label>{t.time}<input type="time" required value={draftTime} onChange={e => setDraftTime(e.target.value)} /></label>
              {modalError && <p role="alert" className="barber-error">{modalError}</p>}
              <div className="barber-modal-actions"><button type="button" onClick={() => { setEditing(false); setModalError('') }}>{t.cancel}</button><button type="submit" className="barber-gold-button">{t.saveChanges}</button></div>
            </form> : confirmDelete ? <div className="barber-confirm-delete"><p>{t.removeAsk}</p><div className="barber-modal-actions"><button type="button" onClick={() => setConfirmDelete(false)}>{t.cancel}</button><button type="button" className="barber-danger" onClick={deleteAppointment}>{t.remove}</button></div></div> : <div className="barber-modal-actions"><button type="button" onClick={() => setEditing(true)}>{t.edit}</button><button type="button" className="barber-danger-outline" onClick={() => setConfirmDelete(true)}>{t.remove}</button></div>}
          </>}
        </div>
      </div>}
    </section>
  )
}
