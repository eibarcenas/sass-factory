'use client'

import { useState } from 'react'
import type { Item } from '@/types/catalog'
import type { CatalogData } from '@/lib/api'
import StorefrontHeader from './StorefrontHeader'
import CategoryFilter from './CategoryFilter'
import ProductModal from './ProductModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

function ProductCard({ item, primaryColor, onSelect }: {
  item: Item; primaryColor: string; onSelect: (item: Item) => void
}) {
  return (
    <button
      className="w-full text-left bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow active:scale-95"
      onClick={() => onSelect(item)}
    >
      <div className="aspect-square bg-muted flex items-center justify-center text-4xl"
        style={{ backgroundColor: primaryColor + '15' }}>
        {item.image
          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
          : '🛍️'}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm leading-tight line-clamp-2">{item.name}</p>
        <p className="text-sm font-bold mt-1">${item.price.toLocaleString('es-MX')} MXN</p>
      </div>
    </button>
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
                <input key={f.key} type={f.type} placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
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

export default function CatalogView({ data, isDemo = false }: { data: CatalogData; isDemo?: boolean }) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [activeCategory, setActiveCategory] = useState('')
  const [showProspect, setShowProspect] = useState(false)

  const categories = [...new Set(
    data.items.filter(i => i.visible && i.category).map(i => i.category!)
  )]

  const filtered = data.items.filter(i =>
    i.visible && (!activeCategory || i.category === activeCategory)
  )

  return (
    <div>
      {isDemo && (
        <div className="sticky top-0 z-20 bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">✨ This is a demo — want this catalog for your business?</p>
          <Button size="sm" variant="secondary" className="shrink-0 rounded-full h-7 text-xs"
            onClick={() => setShowProspect(true)}>
            Yes →
          </Button>
        </div>
      )}

      <StorefrontHeader business={data} />

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
              <ProductCard key={item.id} item={item} primaryColor={data.theme.primary} onSelect={setSelectedItem} />
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

      <ProductModal item={selectedItem} whatsapp={data.whatsapp} onClose={() => setSelectedItem(null)} />
      {showProspect && <ProspectModal businessId={data.id} onClose={() => setShowProspect(false)} />}
    </div>
  )
}
