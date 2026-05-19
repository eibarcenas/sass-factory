export function buildWhatsAppUrl(phone: string, productName: string, price: number): string {
  const text = encodeURIComponent(
    `Hola, quiero pedir ${productName} ($${price} MXN). ¿Está disponible?`
  )
  // Normalize phone: strip non-digits, add 52 prefix if Mexican
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('52') ? digits : `52${digits}`
  return `https://wa.me/${normalized}?text=${text}`
}
