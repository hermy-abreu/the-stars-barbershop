import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, collection, onSnapshot, query, where, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
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
          await runTransaction(db,async tx=>{
            const target=doc(db,'appointments',slot)
            if((await tx.get(target)).exists())throw Error('El horario está ocupado')
            tx.set(target,{barberId:user.uid,first:a.first,last:a.last,phone:a.phone||'',date:a.date,time:a.time,service:a.service||'',walkIn:!!a.walkIn,createdAt:serverTimestamp()})
          })
        } else if(before.date!==a.date||before.time!==a.time){
          throw Error('El cambio de fecha y hora requiere habilitar las reglas de modificación.')
        }
      }
      for(const [id] of previous){
        if(!current.has(id))await deleteDoc(doc(db,'appointments',String(id)))
      }
    }catch(e){setError(e.message)}
  }
  if(role==='barber' && user && !loading) return <BarberDashboard language={language} onExit={onExit} onLogout={()=>signOut(auth)} authenticatedBarber={{id:user.uid,name:barbers.find(b=>b.id===user.uid)?.name||user.email,role:'barber'}} barbers={barbers} setBarbers={()=>{}} appointments={appointments} setAppointments={persistBarberAppointments}/>
  if(role==='owner' && user && !loading) return <OwnerDashboard language={language} onExit={onExit} onLogout={()=>signOut(auth)} barbers={barbers} appointments={appointments} staffPanel={<TestDashboard user={user} role={role} language={language}/>} />
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
