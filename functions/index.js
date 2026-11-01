const {onCall,HttpsError}=require('firebase-functions/v2/https');
const admin=require('firebase-admin');
admin.initializeApp();
const db=admin.firestore();
const normalize=s=>String(s||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toLowerCase();
const digits=s=>String(s||'').replace(/\D/g,'');
const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'');
const validTime=t=>/^\d{2}:\d{2}$/.test(t||'');
const checkedClient=request=>{if(!request.auth?.uid)throw new HttpsError('unauthenticated','Sign in required.');};
exports.checkSlot=onCall({region:'us-central1',enforceAppCheck:true},async request=>{
  checkedClient(request);
  const {barberId,date,time}=request.data||{};
  if(typeof barberId!=='string'||barberId.length>128||!validDate(date)||!validTime(time))throw new HttpsError('invalid-argument','Invalid slot.');
  const snapshot=await db.collection('appointments').doc(barberId+'_'+date+'_'+time).get();
  return {occupied:snapshot.exists};
});
exports.checkPhone=onCall({region:'us-central1',enforceAppCheck:true},async request=>{
  checkedClient(request);
  const phone=digits(request.data?.phone);
  if(phone.length!==10)throw new HttpsError('invalid-argument','Invalid phone.');
  // Returning existence for arbitrary numbers is susceptible to enumeration.
  // Require verified phone identity before exposing matches; never return client information.
  if(request.auth.token.firebase?.sign_in_provider!=='phone'||digits(request.auth.token.phone_number).slice(-10)!==phone)
    throw new HttpsError('failed-precondition','Phone verification required.');
  const snapshot=await db.collection('appointments').where('phone','in',[
    '('+phone.slice(0,3)+') '+phone.slice(3,6)+'-'+phone.slice(6),phone.slice(0,3)+'-'+phone.slice(3,6)+'-'+phone.slice(6)
  ]).limit(1).get();
  return {used:!snapshot.empty};
});
exports.findAppointments=onCall({region:'us-central1',enforceAppCheck:true},async request=>{
  checkedClient(request);
  const {first,last,phone}=request.data||{};
  if(!normalize(first)||!normalize(last)||digits(phone).length!==10)throw new HttpsError('invalid-argument','Invalid identity fields.');
  // Three fields are used for matching; proof of telephone possession is required
  // before disclosing appointments. Anonymous caller cannot enumerate PII.
  if(request.auth.token.firebase?.sign_in_provider!=='phone'||digits(request.auth.token.phone_number).slice(-10)!==digits(phone))
    throw new HttpsError('failed-precondition','Phone verification required.');
  const normalizedPhone=digits(phone);
  const candidatePhones=['('+normalizedPhone.slice(0,3)+') '+normalizedPhone.slice(3,6)+'-'+normalizedPhone.slice(6),normalizedPhone.slice(0,3)+'-'+normalizedPhone.slice(3,6)+'-'+normalizedPhone.slice(6)];
  const snap=await db.collection('appointments').where('phone','in',candidatePhones).limit(30).get();
  return {appointments:snap.docs.filter(d=>normalize(d.get('first'))===normalize(first)&&normalize(d.get('last'))===normalize(last)).map(d=>({id:d.id,date:d.get('date'),time:d.get('time'),service:d.get('service'),barberId:d.get('barberId')}))};
});
