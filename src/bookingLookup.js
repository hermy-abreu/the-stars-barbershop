export const normalizeBookingField = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
export const normalizeBookingPhone = value => String(value || '').replace(/\D/g, '')
export const lookupKey = async (first, last, phone) => {
  const input = [normalizeBookingField(first), normalizeBookingField(last), normalizeBookingPhone(phone)].join('|')
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('')
}
