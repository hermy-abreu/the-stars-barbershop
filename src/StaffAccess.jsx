import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import './BarberDashboard.css'
import TestDashboard from './TestDashboard'

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
