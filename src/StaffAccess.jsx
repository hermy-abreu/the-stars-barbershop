import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, collection, onSnapshot, getDocs, query, where, deleteDoc, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { lookupKey } from './bookingLookup'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import './BarberDashboard.css'
import TestDashboard from './TestDashboard'
import OwnerDashboard from './OwnerDashboard'
import BarberDashboard from './BarberDashboard'

// The legacy demo dashboards are intentionally not exposed here.
// Only server-authorized roles may be used when real dashboards are connected.
export default function StaffAccess({language='es',onExit}) {
  const es=language==='es'
  const [user,setUser]=useState(null)
  const [role,setRole]=useState(null)
  const [loading,setLoading]=useState(true)
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const [barbers,setBarbers]=useState([])
  const [appointments,setAppointments]=useState([])
  useEffect(()=>{
    if(!role||!user||user.isAnonymous)return
    const stopBarbers=onSnapshot(collection(db,'barbers'),snap=>setBarbers(snap.docs.map(d=>({id:d.id,...d.data()}))),err=>setError(err.message))
    const source=role==='owner'?collection(db,'appointments'):query(collection(db,'appointments'),where('barberId','==',user.uid))
    const stopBookings=onSnapshot(source,snap=>setAppointments(snap.docs.map(d=>({id:d.id,...d.data()}))),err=>setError(err.message))
    return ()=>{stopBarbers();stopBookings()}
  },[role,user])
  // Backfill older appointments independently of availability markers.
  useEffect(()=>{
    if(role!=='owner'||!appointments.length)return
    let cancelled=false
    ;(async()=>{
      const failures=[]
      for(const a of appointments){
        if(cancelled)break
        if(a.walkIn)continue
        const slot=String(a.id)
        if(a.phone && a.first && a.last && a.phone.replace(/\\D/g,'').length===10){
          try{
            const key=await lookupKey(a.first,a.last,a.phone)
            const index=doc(db,'bookingLookup',key,'items',slot)
            const metadata={barberId:a.barberId,date:a.date,time:a.time,service:a.service||''}
            const existing=await getDoc(index)
            if(!existing.exists())await setDoc(index,metadata)
            else if(['barberId','date','time','service'].some(field=>existing.data()[field]!==metadata[field]))
              await updateDoc(index,metadata)
          }catch(e){failures.push('Índice '+slot+': '+(e.code||e.message))}
        }
        if(/^[0-9]{2}:(00|30)$/.test(a.time||'')){
          try{
            const marker=doc(db,'occupiedSlots',slot)
            if(!(await getDoc(marker)).exists())await setDoc(marker,{occupied:true})
          }catch(e){failures.push('Horario '+slot+': '+(e.code||e.message))}
        }
      }
      if(!cancelled && failures.length)setError('Sincronización incompleta: '+failures.join('; '))
    })()
    return ()=>{cancelled=true}
  },[role,appointments])
  useEffect(()=>{
    let alive=true
    const unsubscribe=onAuthStateChanged(auth,async candidate=>{
      if (!alive) return
      setUser(candidate);setRole(null);setLoading(true);setError('')
      if(candidate) {
        try {
          const snapshot=await getDoc(doc(db,'staff',candidate.uid))
          if(alive && snapshot.exists() && snapshot.data().active===true &&
            ['owner','barber'].includes(snapshot.data().role)) setRole(snapshot.data().role)
        } catch {
          if(alive) setError(es?'Permisos de Staff pendientes de configurar.':'Staff permissions are not configured yet.')
        }
      }
      if(alive) setLoading(false)
    },()=>{if(alive){setLoading(false);setError('Authentication unavailable')}})
    return ()=>{alive=false;unsubscribe()}
  },[es])
  async function login(event) {
    event.preventDefault();setError('')
    try { await signInWithEmailAndPassword(auth,(email.trim().includes('@') ? email.trim() : email.trim().toLowerCase()+'@the-stars-barbershop.firebaseapp.com'),password) }
    catch { setError(es?'Credenciales incorrectas o acceso no disponible.':'Invalid credentials or sign-in unavailable.') }
    finally { setPassword('') }
  }
  async function persistBarberAppointments(updater){
    if(role!=='barber'||!user) return
    const next=updater(appointments)
    const previous=new Map(appointments.map(a=>[a.id,a]))
    const current=new Map(next.map(a=>[a.id,a]))
    try {
      for(const [id,a] of current){
        const before=previous.get(id)
        if(!before){
          const slot=user.uid+'_'+a.date+'_'+a.time
          await setDoc(doc(db,'appointments',slot),{barberId:user.uid,first:a.first,last:a.last,phone:a.phone||'',date:a.date,time:a.time,service:a.service||'',walkIn:!!a.walkIn,createdAt:serverTimestamp()})
        } else if(before.date!==a.date||before.time!==a.time){
          throw Error('El cambio de fecha y hora requiere habilitar las reglas de modificación.')
        }
      }
      for(const [id] of previous){
        if(!current.has(id))await deleteDoc(doc(db,'appointments',String(id)))
      }
    }catch(e){setError(e.message)}
  }
  if(role==='barber' && user && !loading) return <BarberDashboard language={language} onExit={onExit} onLogout={()=>signOut(auth)} authenticatedBarber={{id:user.uid,name:barbers.find(b=>b.id===user.uid)?.name||user.email,role:'barber'}} barbers={barbers} setBarbers={async updater=>{try{const updated=updater(barbers).find(b=>b.id===user.uid);if(!updated)throw Error('Perfil no encontrado');await updateDoc(doc(db,'barbers',user.uid),{alias:updated.alias||'',phone:updated.phone||'',photo:updated.photo||'',instagram:updated.instagram||'',facebook:updated.facebook||'',tiktok:updated.tiktok||'',youtube:updated.youtube||''})}catch(err){setError(err.message)}}} appointments={appointments} setAppointments={persistBarberAppointments} staffError={error}/>
  async function createBarber(profile){
    if(role!=='owner')throw Error('Acceso restringido')
    const secondary=initializeApp(auth.app.options,'barber-'+Date.now())
    try{
      const credential=await createUserWithEmailAndPassword(getAuth(secondary),profile.username.toLowerCase()+'@the-stars-barbershop.firebaseapp.com',profile.password)
      const uid=credential.user.uid
      const common={name:profile.name,firstName:profile.firstName,lastName:profile.lastName,username:profile.username,phone:profile.phone||'',active:true,createdAt:serverTimestamp()}
      await setDoc(doc(db,'staff',uid),{...common,role:'barber'})
      await setDoc(doc(db,'barbers',uid),{...common,displayId:profile.id})
    }finally{await deleteApp(secondary)}
  }
  async function updateBarber(id,patch){
    if(role!=='owner')throw Error('Acceso restringido')
    await updateDoc(doc(db,'barbers',id),patch)
  }
  async function deleteBarber(id){
    if(role!=='owner')throw Error('Acceso restringido')
    const source=barbers.find(b=>b.id===id)
    if(!source)throw Error('Barbero no encontrado.')
    const snapshot=await getDocs(query(collection(db,'appointments'),where('barberId','==',id)))
    const entries=snapshot.docs
    const replacements=barbers.filter(b=>b.id!==id&&b.active!==false)
    // Preserve reservations: transfer only when a unique destination exists.
    if(entries.length>0 && replacements.length!==1)
      throw Error('No se puede eliminar: hay citas y no existe un único barbero receptor. No se eliminó nada.')
    if(entries.length>180)throw Error('Hay demasiadas citas para transferirlas de forma segura. No se eliminó nada.')
    const destinationId=replacements.length===1?replacements[0].id:null
    await runTransaction(db,async tx=>{
      const sourceRef=doc(db,'barbers',id)
      const sourceStaff=doc(db,'staff',id)
      const profile=await tx.get(sourceRef)
      if(!profile.exists())throw Error('El barbero ya no existe.')
      let destinationRef=null
      if(entries.length){
        destinationRef=doc(db,'barbers',destinationId)
        const destination=await tx.get(destinationRef)
        if(!destination.exists()||destination.data().active===false)throw Error('No hay barbero receptor disponible.')
      }
      const targetRefs=entries.map(entry=>doc(db,'appointments',destinationId+'_'+entry.data().date+'_'+entry.data().time))
      const existing=await Promise.all(targetRefs.map(ref=>tx.get(ref)))
      if(existing.some(s=>s.exists()))throw Error('El barbero receptor ya tiene citas en ese horario. No se eliminó nada.')
      for(let i=0;i<entries.length;i++){
        const appointment=entries[i].data()
        tx.set(targetRefs[i],{
          ...appointment,barberId:destinationId,createdAt:serverTimestamp()
        })
        tx.delete(entries[i].ref)
      }
      tx.delete(sourceStaff)
      tx.delete(sourceRef)
    })
  }
  if(role==='owner' && user && !loading) return <OwnerDashboard language={language} onExit={onExit} onLogout={()=>signOut(auth)} barbers={barbers} appointments={appointments} onCreateBarber={createBarber} onUpdateBarber={updateBarber} onDeleteBarber={deleteBarber}/>

  return <section className="barber-area"><div className="barber-login-card">
    <button type="button" className="barber-simple-link" onClick={onExit}>← {es?'Volver a la web':'Back to website'}</button>
    <img src="/images/logo-oficial.png" className="barber-official-logo" alt="The Stars Barbershop"/>
    <h2>Staff</h2>
    {loading ? <p>{es?'Verificando acceso…':'Checking access…'}</p>
    : (!user || user.isAnonymous) ? <form onSubmit={login}>
      <label>{es?'Usuario o correo':'Username or email'}<input type="text" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>{es?'Contraseña':'Password'}<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <button type="submit" className="barber-gold-button">{es?'Entrar':'Sign in'}</button>
    </form>
    : <div>{role && <TestDashboard user={user} role={role} language={language}/>}<p>{role ? (es?'Acceso verificado.':'Verified access.')
      : (es?'Acceso restringido: falta un rol autorizado.':'Access restricted: authorized role missing.')}</p>
      <button type="button" onClick={()=>signOut(auth)}>{es?'Cerrar sesión':'Sign out'}</button>
    </div>}
    {error && <p className="barber-error" role="alert">{error}</p>}
  </div></section>
}
