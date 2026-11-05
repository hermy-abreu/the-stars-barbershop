import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc, query, where, runTransaction } from 'firebase/firestore'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from './firebase'

const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
const loginEmail=name=>name.toLowerCase()+'@the-stars-barbershop.firebaseapp.com'
const alphabetic=value=>value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'')
export default function TestDashboard({user,role,language='es'}) {
 const owner=role==='owner'
 const [barbers,setBarbers]=useState([])
 const [appointments,setAppointments]=useState([])
 const [first,setFirst]=useState('')
 const [last,setLast]=useState('')
 const [pass,setPass]=useState('')
 const [barberId,setBarberId]=useState('')
 const [client,setClient]=useState('')
 const [surname,setSurname]=useState('')
 const [date,setDate]=useState(today)
 const [time,setTime]=useState('10:00')
 const [service,setService]=useState('Classic Haircut')
 const [walkIn,setWalkIn]=useState(false)
 const [message,setMessage]=useState('')
 const [busy,setBusy]=useState(false)
 useEffect(()=>{
  if(!user)return
  const a=onSnapshot(collection(db,'barbers'),s=>setBarbers(s.docs.map(d=>({id:d.id,...d.data()}))),e=>setMessage(e.message))
  const source=owner?collection(db,'appointments'):query(collection(db,'appointments'),where('barberId','==',user.uid))
  const b=onSnapshot(source,s=>setAppointments(s.docs.map(d=>({id:d.id,...d.data()}))),e=>setMessage(e.message))
  return ()=>{a();b()}
 },[user,owner])
 async function createBarber(e){
  e.preventDefault()
  const username=alphabetic(first)
  if(!owner||!username||!alphabetic(last)||pass.length<6)return
  setBusy(true);setMessage('')
  const secondary=initializeApp(auth.app.options,'new-staff-'+Date.now())
  try {
   const credentials=await createUserWithEmailAndPassword(getAuth(secondary),loginEmail(username),pass)
   const uid=credentials.user.uid
   const displayName=first.trim()+' '+last.trim()
   await setDoc(doc(db,'staff',uid),{role:'barber',name:displayName,username,active:true,createdAt:serverTimestamp()})
   await setDoc(doc(db,'barbers',uid),{name:displayName,username,active:true,createdAt:serverTimestamp()})
   setFirst('');setLast('');setPass('');setMessage('Barber created: '+username)
  } catch(err){setMessage('Create barber failed: '+err.code)}
  finally{await deleteApp(secondary);setBusy(false)}
 }
 async function createAppointment(e){
  e.preventDefault()
  const uid=owner?barberId:user.uid
  if(!uid||!client.trim()||!surname.trim())return
  if(walkIn && date!==today()){setMessage('Walk-in can only be created today');return}
  const slot=uid+'_'+date+'_'+time
  setBusy(true);setMessage('')
  try{
   await runTransaction(db,async transaction=>{
    const target=doc(db,'appointments',slot)
    if((await transaction.get(target)).exists()) throw new Error('This time is already booked')
    transaction.set(target,{
    barberId:uid,first:client.trim(),last:surname.trim(),phone:'',
    date,time,service:walkIn?'':service,walkIn,createdAt:serverTimestamp()
    })
   })
   setClient('');setSurname('');setMessage('Saved in Firestore')
  }catch(err){setMessage('Saving failed: '+err.code)}
  finally{setBusy(false)}
 }
 async function remove(id){if(!window.confirm('Delete appointment?'))return;try{await deleteDoc(doc(db,'appointments',id))}catch(err){setMessage(err.message)}}
 return <div style={{maxWidth:950,margin:'24px auto',padding:20}}>
   <h2>{owner?'Owner test dashboard':'My appointments'}</h2>
   <p>Firebase testing environment — real records, not demo storage.</p>
   {message&&<p role="status">{message}</p>}
   {owner&&<form onSubmit={createBarber}><h3>Create barber account</h3>
     <label>First name <input required value={first} onChange={e=>setFirst(e.target.value)}/></label>
     <label>Last name <input required value={last} onChange={e=>setLast(e.target.value)}/></label>
     <label>Initial password <input type="password" required minLength={6} value={pass} onChange={e=>setPass(e.target.value)}/></label>
     <button disabled={busy}>Create barber</button>
   </form>}
   {!owner&&<form onSubmit={createAppointment}><h3>Register appointment</h3>
     {owner&&<label>Barber <select value={barberId} required onChange={e=>setBarberId(e.target.value)}>
       <option value="">Select barber</option>{barbers.filter(b=>b.active).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
     </select></label>}
     <label>First name <input value={client} required onChange={e=>setClient(e.target.value)}/></label>
     <label>Last name <input value={surname} required onChange={e=>setSurname(e.target.value)}/></label>
     <label>Date <input type="date" min={today()} value={date} required disabled={walkIn} onChange={e=>setDate(e.target.value)}/></label>
     <label>Time <input type="time" value={time} required onChange={e=>setTime(e.target.value)}/></label>
     <label>Service <input value={service} onChange={e=>setService(e.target.value)}/></label>
     <label>Walk-in <input type="checkbox" checked={walkIn} onChange={e=>{setWalkIn(e.target.checked);if(e.target.checked)setDate(today())}}/></label>
     <button disabled={busy}>Save in Firestore</button>
   </form>}
   {!owner&&<h3>Saved appointments</h3>}
   {!owner&&<div style={{overflowX:'auto'}}><table><thead><tr><th>Date</th><th>Time</th><th>Customer</th><th>Service</th><th></th></tr></thead><tbody>
     {appointments.map(a=><tr key={a.id}><td>{a.date}</td><td>{a.time}</td><td>{a.first} {a.last}</td><td>{a.service}</td>
      <td><button onClick={()=>remove(a.id)}>Delete</button></td></tr>)}
   </tbody></table></div>}
 </div>
}
