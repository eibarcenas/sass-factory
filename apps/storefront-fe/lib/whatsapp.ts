export function buildWhatsAppUrl(phone: string, productName: string, price: number): string {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('52') ? digits : `52${digits}`
  const text = encodeURIComponent(
    `Hola, quiero pedir ${productName} ($${price} MXN). ¿Está disponible?`
  )
  return `https://wa.me/${normalized}?text=${text}`
}

export function buildShareUrl(phone: string, catalogUrl: string): string {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('52') ? digits : `52${digits}`
  const text = encodeURIComponent(`¡Mira mi catálogo digital! 🛍️ ${catalogUrl}`)
  return `https://wa.me/${normalized}?text=${text}`
}
