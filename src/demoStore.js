/** Almacenamiento local de prueba. Nunca es un backend ni autentica usuarios. */
export const STARTER_BARBERS = []
export function getStored(key,fallback) {
 try {const raw=localStorage.getItem('stars-demo-v18-'+key); const value=raw ? JSON.parse(raw) : fallback; return Array.isArray(value)?value:fallback} catch{return fallback}
}
export function putStored(key,value) {try {localStorage.setItem('stars-demo-v18-'+key,JSON.stringify(value))}catch(e){console.warn('Almacenamiento demo no disponible:',e)}}
/** Guarda con guiones, incluso si el usuario pega un teléfono sin formato. */
export function formatPhone(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
  digits = digits.slice(0, 10)
  if (!digits) return ''
  if (digits.length <= 3) return '(' + digits
  if (digits.length <= 6) return '(' + digits.slice(0, 3) + ') ' + digits.slice(3)
  return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6)
}
