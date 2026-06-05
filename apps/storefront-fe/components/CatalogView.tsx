'use client'

import { useEffect, useMemo, useState } from 'react'

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.catalog.mx'
import type { Item } from '@eguru/core'
import type { CatalogData } from '@/lib/api'
import StorefrontHeader from './StorefrontHeader'
import CategoryFilter from './CategoryFilter'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'

type CartLine = {
  productId: string
  name: string
  price: number
  quantity: number
}

function ProductCard({
  item,
  primaryColor,
  quantity,
  showPrices,
  onAdd,
  onIncrease,
  onDecrease,
}: {
  item: Item
  primaryColor: string
  quantity: number
  showPrices: boolean
  onAdd: () => void
  onIncrease: () => void
  onDecrease: () => void
}) {
  return (
    <div className="w-full bg-card rounded-2xl border overflow-hidden shadow-sm">
      <div className="aspect-square bg-muted flex items-center justify-center text-4xl"
        style={{ backgroundColor: primaryColor + '15' }}>
        {item.image
          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
          : '🛍️'}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm leading-tight line-clamp-2">{item.name}</p>
        {item.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}
        {showPrices && (
          <p className="text-sm font-bold mt-1">${item.price.toLocaleString('es-MX')} MXN</p>
        )}
        {quantity > 0 ? (
          <div className="mt-3 flex items-center justify-between rounded-full border px-2 py-1">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              onClick={onDecrease}
              aria-label={`Quitar ${item.name}`}
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="text-sm font-bold">{quantity}</span>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              onClick={onIncrease}
              aria-label={`Agregar otro ${item.name}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <Button className="mt-3 h-9 w-full rounded-full gap-1.5" onClick={onAdd}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar
          </Button>
        )}
      </div>
    </div>
  )
}

function ViralFooter() {
  return (
    <footer className="mt-12 py-6 text-center">
      <Separator className="mb-6" />
      <a
        href="https://catalog.mx"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        🚀 Powered by <span className="font-semibold">catalog.mx</span> — Free for your business
      </a>
    </footer>
  )
}

function DemoAcceptModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!form.email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/demo-accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email: form.email, name: form.name }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative bg-background w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6 shadow-xl"
        onClick={e => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="font-bold text-lg">Your catalog is reserved!</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Go to{' '}
              <a href={ADMIN_URL} className="font-medium underline" target="_blank" rel="noopener noreferrer">
                {ADMIN_URL.replace(/^https?:\/\//, '')}
              </a>{' '}
              and sign in with Google using this email to activate your account.
            </p>
            <Button className="mt-4 w-full" onClick={onClose}>Got it</Button>
          </div>
        ) : (
          <>
            <h2 className="font-bold text-lg mb-1">Activate your catalog</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the email you'll use to sign in with Google.
            </p>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
              <Input
                type="email"
                placeholder="Email (Google account) *"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            <Button
              className="mt-4 w-full"
              disabled={loading || !form.email}
              onClick={submit}
            >
              {loading ? 'Saving...' : 'Activate →'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function ProspectModal({ businessId, onClose }: { businessId: string; onClose: () => void }) {
  const [form, setForm] = useState({ contactName: '', phone: '', email: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!form.phone && !form.email) return
    setLoading(true)
    try {
      await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, ...form }),
      })
      setSubmitted(true)
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative bg-background w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6 shadow-xl"
        onClick={e => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="font-bold text-lg">Got it!</h2>
            <p className="text-sm text-muted-foreground mt-1">We'll contact you shortly.</p>
            <Button className="mt-4 w-full" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <h2 className="font-bold text-lg mb-1">Tell us about you</h2>
            <p className="text-sm text-muted-foreground mb-4">We'll contact you within 24 hours.</p>
            <div className="space-y-3">
              {[
                { key: 'contactName', type: 'text', placeholder: 'Your name' },
                { key: 'phone', type: 'tel', placeholder: 'Phone / WhatsApp *' },
                { key: 'email', type: 'email', placeholder: 'Email (optional)' },
              ].map(f => (
                <Input key={f.key} type={f.type} placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                />
              ))}
            </div>
            <Button
              className="mt-4 w-full"
              disabled={loading || (!form.phone && !form.email)}
              onClick={submit}
            >
              {loading ? 'Sending...' : 'I want my catalog →'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('52') ? digits : `52${digits}`
}

function createRequestHash() {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(36).padStart(2, '0')).join('').slice(0, 12)
}

function getShowPrices(data: CatalogData) {
  const config = data as CatalogData & { show_prices?: boolean; showPrices?: boolean }
  return config.show_prices ?? config.showPrices ?? true
}

export default function CatalogView({ data, isDemo = false }: { data: CatalogData; isDemo?: boolean }) {
  const [activeCategory, setActiveCategory] = useState('')
  const [showDemoAccept, setShowDemoAccept] = useState(false)
  const [showProspect, setShowProspect] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartMessage, setCartMessage] = useState('')
  const [cartError, setCartError] = useState('')

  const showPrices = getShowPrices(data)
  const cartKey = `catalog.mx.cart.${data.slug}`

  const categories = [...new Set(
    data.items.filter(i => i.visible && i.category).map(i => i.category!)
  )]

  const filtered = data.items.filter(i =>
    i.visible && (!activeCategory || i.category === activeCategory)
  )

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const cartTotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0)

  const cartByProductId = useMemo(() => {
    return new Map(cart.map(line => [line.productId, line.quantity]))
  }, [cart])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(cartKey)
      if (raw) setCart(JSON.parse(raw))
    } catch {}
  }, [cartKey])

  useEffect(() => {
    try {
      window.localStorage.setItem(cartKey, JSON.stringify(cart))
    } catch {}
  }, [cart, cartKey])

  function addToCart(item: Item) {
    setCartError('')
    setCart(current => {
      const existing = current.find(line => line.productId === item.id)
      if (existing) {
        return current.map(line =>
          line.productId === item.id ? { ...line, quantity: line.quantity + 1 } : line
        )
      }
      return [...current, { productId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  function decreaseItem(productId: string) {
    setCart(current => current.flatMap(line => {
      if (line.productId !== productId) return [line]
      if (line.quantity <= 1) return []
      return [{ ...line, quantity: line.quantity - 1 }]
    }))
  }

  function removeItem(productId: string) {
    setCart(current => current.filter(line => line.productId !== productId))
  }

  function sendCartRequest() {
    setCartError('')
    if (!cart.length) return
    if (!data.whatsapp) {
      setCartError('Este negocio aún no tiene WhatsApp configurado.')
      return
    }

    const hash = createRequestHash()
    const origin = window.location.origin
    const requestUrl = `${origin}/requests/${hash}`
    const request = {
      hash,
      business_id: data.id,
      storefront_slug: data.slug,
      items: cart.map(line => ({
        product_id: line.productId,
        product_name: line.name,
        quantity: line.quantity,
        ...(showPrices ? { unit_price: line.price, total: line.price * line.quantity } : {}),
      })),
      ...(showPrices ? { total: cartTotal } : {}),
      customer_message: cartMessage,
      created_at: new Date().toISOString(),
      status: 'pending',
    }

    try {
      window.localStorage.setItem(`catalog.mx.request.${hash}`, JSON.stringify(request))
    } catch {}

    // Persist to backend (fire-and-forget; localStorage is fallback)
    fetch(`/api/requests/${data.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hash,
        items: request.items,
        ...(showPrices ? { total: cartTotal } : {}),
        customer_message: cartMessage || undefined,
      }),
    }).catch(() => {})

    const itemLines = cart.map(line => {
      const price = showPrices ? ` — $${(line.price * line.quantity).toLocaleString('es-MX')} MXN` : ''
      return `- ${line.name} x${line.quantity}${price}`
    }).join('\n')
    const totalLine = showPrices ? `\n\nTotal: $${cartTotal.toLocaleString('es-MX')} MXN` : ''
    const noteLine = cartMessage.trim() ? `\n\nNota: ${cartMessage.trim()}` : ''
    const message = `Hola, quiero solicitar estos productos:\n\n${itemLines}${totalLine}${noteLine}\n\nDetalle de solicitud:\n${requestUrl}`
    window.open(`https://wa.me/${normalizePhone(data.whatsapp)}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div>
      {isDemo && (
        <div className="sticky top-0 z-20 bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">✨ This is your demo — ready to activate?</p>
          <Button size="sm" variant="secondary" className="shrink-0 rounded-full h-7 text-xs"
            onClick={() => setShowDemoAccept(true)}>
            Yes →
          </Button>
        </div>
      )}

      <StorefrontHeader business={data} cartCount={cartCount} onOpenCart={() => setShowCart(true)} />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {data.tagline && (
          <p className="text-center text-muted-foreground text-sm mb-4">{data.tagline}</p>
        )}

        {categories.length > 0 && (
          <div className="mb-4">
            <CategoryFilter categories={categories} selected={activeCategory} onSelect={setActiveCategory} />
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(item => (
              <ProductCard
                key={item.id}
                item={item}
                primaryColor={data.theme.primary}
                quantity={cartByProductId.get(item.id) ?? 0}
                showPrices={showPrices}
                onAdd={() => addToCart(item)}
                onIncrease={() => addToCart(item)}
                onDecrease={() => decreaseItem(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-sm">No products in this category</p>
          </div>
        )}

        <ViralFooter />
      </main>

      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar carrito"
            onClick={() => setShowCart(false)}
          />
          <div className="relative w-full max-w-md rounded-t-3xl bg-background p-5 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Carrito</h2>
                <p className="text-sm text-muted-foreground">{cartCount} productos seleccionados</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}>
                Cerrar
              </Button>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-3">
                <div className="max-h-[42dvh] space-y-3 overflow-auto pr-1">
                  {cart.map(line => (
                    <div key={line.productId} className="rounded-2xl border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{line.name}</p>
                          {showPrices && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              ${(line.price * line.quantity).toLocaleString('es-MX')} MXN
                            </p>
                          )}
                        </div>
                        <button
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(line.productId)}
                          aria-label={`Eliminar ${line.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center rounded-full border px-2 py-1">
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                            onClick={() => decreaseItem(line.productId)}
                            aria-label={`Restar ${line.name}`}
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{line.quantity}</span>
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                            onClick={() => {
                              const item = data.items.find(product => product.id === line.productId)
                              if (item) addToCart(item)
                            }}
                            aria-label={`Sumar ${line.name}`}
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Input
                  value={cartMessage}
                  onChange={event => setCartMessage(event.target.value)}
                  placeholder="Mensaje opcional para el negocio"
                />

                {showPrices && (
                  <div className="flex items-center justify-between border-t pt-3 font-bold">
                    <span>Total</span>
                    <span>${cartTotal.toLocaleString('es-MX')} MXN</span>
                  </div>
                )}

                {cartError && <p className="text-sm text-destructive">{cartError}</p>}

                <Button className="h-11 w-full rounded-full bg-green-500 hover:bg-green-600" onClick={sendCartRequest}>
                  Enviar por WhatsApp
                </Button>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-4xl">🛒</p>
                <p className="mt-3 text-sm font-medium">Tu carrito está vacío</p>
                <p className="mt-1 text-xs text-muted-foreground">Agrega productos para enviar tu solicitud.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {showDemoAccept && <DemoAcceptModal slug={data.slug} onClose={() => setShowDemoAccept(false)} />}
      {showProspect && <ProspectModal businessId={data.id} onClose={() => setShowProspect(false)} />}
    </div>
  )
}
