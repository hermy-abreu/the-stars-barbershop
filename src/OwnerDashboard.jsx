/**
 * THE STARS BARBERSHOP — OwnerDashboard.jsx (v1.7)
 * Panel del propietario con datos DEMO; no conectado a servidor.
 * Exportación PDF: vista imprimible usando window.print(), donde el usuario
 * selecciona "Guardar como PDF". Cuatro campos, sin números telefónicos.
 */
import { useMemo, useState } from 'react'
import './OwnerDashboard.css'

const words = {
  es: { title: 'Panel del propietario', demo: 'DEMOSTRACIÓN — Citas y cuentas ficticias. No hay almacenamiento real.', back: 'Volver a la web', logout:'Cerrar sesión', appointments:'Agenda del negocio', filter:'Barbero', all:'Todos los barberos', period:'Periodo', day:'Diario', week:'Semanal', month:'Mensual', date:'Fecha de referencia', pdf:'Exportar / Guardar como PDF', empty:'No hay citas en el periodo seleccionado.', barber:'Barbero', client:'Nombre y apellido del cliente', when:'Fecha y hora', service:'Servicio', walkin:'Sin cita', rows:'Citas encontradas', notice:'El navegador abrirá la impresión; selecciona «Guardar como PDF».' },
  en: { title: 'Owner dashboard', demo: 'DEMO — Sample accounts and appointments only. No real storage.', back:'Back to website', logout:'Sign out', appointments:'Business appointments', filter:'Barber', all:'All barbers', period:'Period', day:'Daily', week:'Weekly', month:'Monthly', date:'Reference date', pdf:'Export / Save as PDF', empty:'No appointments in the selected period.', barber:'Barber', client:'Customer full name', when:'Date and time', service:'Service', walkin:'Walk-in', rows:'Matching appointments', notice:'The print dialog will open; choose «Save as PDF».' },
}
function todayISO() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function parseISO(value) { const [y,m,d]=value.split('-').map(Number); return new Date(y,m-1,d) }
function dateTimeLabel(entry, locale) { const d=parseISO(entry.date); const [h,m]=entry.time.split(':').map(Number); d.setHours(h,m); return d.toLocaleString(locale,{year:'numeric',month:'2-digit',day:'2-digit',hour:'numeric',minute:'2-digit'}) }
function isWithinPeriod(value, reference, period) {
  const d=parseISO(value), r=parseISO(reference)
  if(period==='day') return value===reference
  if(period==='month') return d.getFullYear()===r.getFullYear() && d.getMonth()===r.getMonth()
  const day=(r.getDay()+6)%7
  const start=new Date(r.getFullYear(),r.getMonth(),r.getDate()-day)
  const end=new Date(start.getFullYear(),start.getMonth(),start.getDate()+7)
  return d>=start && d<end
}
export default function OwnerDashboard({language='es',onExit,onLogout,appointments=[],barbers=[],onBarbersChange=()=>{}}) {
  const t=words[language]||words.en
  const locale=language==='es'?'es-US':'en-US'
  const [tab,setTab]=useState('agenda')
  const [first,setFirst]=useState('')
  const [last,setLast]=useState('')
  const [profileError,setProfileError]=useState('')
  const [profileMessage,setProfileMessage]=useState('')
  const [temporaryPassword,setTemporaryPassword]=useState('')
  // ID del perfil que se edita; vacío significa creación.
  const [editingId,setEditingId]=useState('')
  const [barber,setBarber]=useState('all')
  const [period,setPeriod]=useState('month')
  const [reference,setReference]=useState(()=>{const records=appointments.filter(a=>!a.walkIn);return records.length?records[records.length-1].date:todayISO()})
  const filtered=useMemo(()=>appointments.filter(a=>(barber==='all'||a.barberId===barber)&&isWithinPeriod(a.date,reference,period)).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)),[appointments,barber,reference,period])
  const getBarber=id=>barbers.find(b=>b.id===id)?.name||id
  function clean(value) {
    return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z ]/g,'').toLowerCase().replace(/\s+/g,'')
  }
  // El contador del ID es global, nunca reinicia por iniciales.
  // La futura base de datos deberá generar el contador transaccionalmente.
  function nextSequence() {
    return Math.max(0,...barbers.map(b=>Number(b.id.match(/-(\d+)$/)?.[1]||0)))+1
  }
  // Genera un usuario único. Si otro barbero comparte nombre,
  // añade letras del apellido y, finalmente, un número.
  function uniqueUsername(givenName, familyName, excludedId='') {
    const taken=value=>barbers.some(b=>b.id!==excludedId&&b.username?.toLowerCase()===value)
    let candidate=givenName
    if (!taken(candidate)) return candidate
    for(let length=1;length<=familyName.length;length++) {
      candidate=givenName+familyName.slice(0,length)
      if(!taken(candidate)) return candidate
    }
    let suffix=2
    while(taken(givenName+familyName+suffix)) suffix++
    return givenName+familyName+suffix
  }
  const validFirst=clean(first)
  const validLast=clean(last)
  const proposedId=validFirst&&validLast
    ? `${validFirst[0]}${validLast[0]}`.toUpperCase()+`-${String(nextSequence()).padStart(3,'0')}`
    : '—'
  const proposedUsername=validFirst&&validLast
    ?uniqueUsername(validFirst,validLast,editingId):'—'

  function resetProfileForm() {
    setFirst('');setLast('');setTemporaryPassword('');setEditingId('')
    setProfileError('');setProfileMessage('')
  }
  function startEdit(b) {
    const parts=b.name.trim().split(/\s+/)
    setFirst(b.firstName||parts[0]||'')
    setLast(b.lastName||parts.slice(1).join(' ')||'')
    setEditingId(b.id)
    setTemporaryPassword('')
    setProfileError('');setProfileMessage('')
  }
  function createBarber(event) {
    event.preventDefault()
    const f=clean(first),l=clean(last)
    if(!f||!l) {
      setProfileError(language==='es'?'Nombre y apellido son obligatorios.':'First and last name are required.')
      return
    }
    if(editingId) {
      // No modificamos ID ni usuario: son identificadores estables.
      onBarbersChange(old=>old.map(b=>b.id===editingId
        ?{...b,name:`${first.trim()} ${last.trim()}`,firstName:first.trim(),lastName:last.trim()}
        :b))
      setProfileMessage(language==='es'?'Perfil actualizado. El ID y el usuario permanecen iguales.':'Profile updated. ID and username remain unchanged.')
      setEditingId('');setFirst('');setLast('');setProfileError('')
      return
    }
    if(!/^(?:[0-9]{6}|(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])[A-Za-z0-9]{6})$/.test(temporaryPassword)) {
      setProfileError(language==='es'?'Introduce una contraseña temporal de 6 dígitos o 6 caracteres con mayúscula, minúscula y número.':'Enter a 6-digit temporary password or 6 mixed-case alphanumeric characters.')
      return
    }
    const id=proposedId
    const username=proposedUsername
    // La contraseña la establece el barbero en el portal Staff (demo).
    onBarbersChange(old=>[...old,{id,name:`${first.trim()} ${last.trim()}`,
      firstName:first.trim(),lastName:last.trim(),username,password:temporaryPassword,active:true}])
    setProfileMessage((language==='es'?'Perfil creado: ':'Profile created: ')+id+' · '+username)
    setFirst('');setLast('');setTemporaryPassword('');setProfileError('')
  }
  function toggleBarber(id) {
    onBarbersChange(old=>old.map(b=>b.id===id?{...b,active:b.active===false}:b))
  }
  return <section className="owner-dashboard">
    <header className="owner-header print-hide">
      <img src="/images/logo-oficial.png" alt="The Stars Barbershop" />
      <div><p className="owner-eyebrow">THE STARS BARBERSHOP · STAFF</p><h1>{t.title}</h1></div>
      <div className="owner-actions"><button onClick={onExit}>{t.back}</button><button onClick={onLogout}>{t.logout}</button></div>
    </header>
    <p className="owner-demo print-hide">{t.demo}</p>
    <nav className="owner-tabs print-hide" aria-label={language==='es'?'Secciones del propietario':'Owner sections'}>
      <button type="button" className={tab==='agenda'?'active':''} onClick={()=>setTab('agenda')}>{language==='es'?'Agenda y reportes':'Schedule & reports'}</button>
      <button type="button" className={tab==='staff'?'active':''} onClick={()=>setTab('staff')}>{language==='es'?'Administrar barberos':'Manage barbers'}</button>
    </nav>
    <button type="button" className="owner-jump print-hide" onClick={() => {
      const target = document.getElementById(tab === 'staff' ? 'owner-profile-list-anchor' : 'owner-report-anchor')
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }}>{tab === 'staff' ? (language === 'es' ? '↓ Ver barberos registrados' : '↓ View registered barbers') : (language === 'es' ? '↓ Ver agenda del negocio' : '↓ View business schedule')}</button>
    {tab==='staff' ? <section className="owner-profiles print-hide">
      <h2>{language==='es'?'Perfiles de barberos (demo)':'Barber profiles (demo)'}</h2>
      <p>{language==='es'?'Los perfiles se guardan solo en este navegador (demo), no se sincronizan entre dispositivos. No ingreses información real.':'Profiles are stored only in this browser (demo), not synced across devices. Do not enter real details.'}</p>
      <div className="owner-profile-editor">
      <h3>{editingId?(language==='es'?'Editar perfil':'Edit profile'):(language==='es'?'Crear nuevo barbero':'Create new barber')}</h3>
      <form className="owner-profile-form" onSubmit={createBarber}>
        <label>{language==='es'?'Nombre':'First name'} *<input value={first} maxLength={70} onChange={e=>setFirst(e.target.value)} required /></label>
        <label>{language==='es'?'Apellido':'Last name'} *<input value={last} maxLength={70} onChange={e=>setLast(e.target.value)} required /></label>
        {!editingId && <label>{language==='es'?'Contraseña temporal (6 caracteres)':'Temporary password (6 characters)'} *<input type="password" autoComplete="new-password" maxLength={6} value={temporaryPassword} onChange={e=>setTemporaryPassword(e.target.value)} required /></label>}
        <div className="owner-profile-preview" aria-live="polite">
          <strong>{editingId?(language==='es'?'Editando perfil':'Editing profile'):(language==='es'?'Vista previa automática':'Automatic preview')}</strong>
          <span>ID: {editingId || proposedId}</span>
          <span>{language==='es'?'Usuario':'Username'}: {editingId?(barbers.find(b=>b.id===editingId)?.username||'—'):proposedUsername}</span>
        </div>
        <button type="submit" className="owner-create-button">{editingId?(language==='es'?'Guardar cambios':'Save changes'):(language==='es'?'Crear perfil':'Create profile')}</button>
        {editingId && <button type="button" onClick={resetProfileForm}>{language==='es'?'Cancelar edición':'Cancel editing'}</button>}
      </form>
      {profileError&&<p role="alert" className="owner-profile-error">{profileError}</p>}
      {profileMessage&&<p role="status" className="owner-profile-success">{profileMessage}</p>}
      <p>{language==='es'?'El ID es consecutivo. El propietario asigna una contraseña temporal ficticia al crear el barbero; no existe activación pública en Staff.':'IDs increase globally. The owner assigns a demo temporary password; no public activation form is shown.'}</p>
      </div>
      <div className="owner-profile-list" id="owner-profile-list-anchor">
        {barbers.map(b=><article key={b.id} className="owner-profile-card">
          {b.photo?<img src={b.photo} alt="" />:<span className="owner-profile-avatar" aria-hidden="true">{b.name.slice(0,1)}</span>}
          <div><strong>{b.name}</strong><small>{b.id} · @{b.username}</small><small>{!b.password?(language==='es'?'Pendiente de contraseña':'Password pending'):(b.active===false?(language==='es'?'Inactivo':'Inactive'):(language==='es'?'Activo':'Active'))}</small></div>
          <div className="owner-profile-actions">
            <button type="button" onClick={()=>startEdit(b)}>{language==='es'?'Editar':'Edit'}</button>
            <button type="button" onClick={()=>toggleBarber(b.id)}>{b.active===false?(language==='es'?'Activar':'Activate'):(language==='es'?'Desactivar':'Deactivate')}</button>
          </div>
        </article>)}
      </div>
    </section> : <>
    <div className="owner-agenda-content">
    <div className="owner-filters print-hide">
      <label>{t.filter}<select value={barber} onChange={e=>setBarber(e.target.value)}><option value="all">{t.all}</option>{barbers.map(b=><option key={b.id} value={b.id}>{b.name} · {b.id}</option>)}</select></label>
      <label>{t.period}<select value={period} onChange={e=>setPeriod(e.target.value)}><option value="day">{t.day}</option><option value="week">{t.week}</option><option value="month">{t.month}</option></select></label>
      <label>{t.date}<input type="date" value={reference} onChange={e=>setReference(e.target.value)}/></label>
      <button className="owner-print-button" type="button" onClick={()=>window.print()}>{t.pdf}</button>
    </div>
    <p className="owner-print-hint print-hide">{t.notice}</p>
    <article className="owner-report" id="owner-report-anchor">
      <div className="owner-report-heading"><img src="/images/logo-oficial.png" alt="The Stars Barbershop"/><div><h2>{t.appointments}</h2><p>{t.period}: {period==='day'?t.day:period==='week'?t.week:t.month} · {t.filter}: {barber==='all'?t.all:getBarber(barber)} · {t.date}: {reference}</p><p>{t.rows}: {filtered.length}</p></div></div>
      <div className="owner-table-scroll"><table><thead><tr><th>{t.barber}</th><th>{t.client}</th><th>{t.when}</th><th>{t.service}</th></tr></thead><tbody>
        {filtered.map(a=><tr key={a.id}><td data-label={t.barber}>{getBarber(a.barberId)}</td><td data-label={t.client}>{a.first} {a.last}</td><td data-label={t.when}>{dateTimeLabel(a,locale)}</td><td data-label={t.service}>{a.walkIn?t.walkin:(a.service||'—')}</td></tr>)}
        {!filtered.length&&<tr><td colSpan="4" className="owner-empty">{t.empty}</td></tr>}
      </tbody></table></div>
    </article>
    </div>
    </>}
  </section>
}
