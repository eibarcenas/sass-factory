'use client'

import { useState } from 'react'
import type { Item } from '@/types/catalog'
import type { CatalogData } from '@/lib/api'
import StorefrontHeader from './StorefrontHeader'
import CategoryFilter from './CategoryFilter'
import ProductModal from './ProductModal'

function ProductCard({ item, primaryColor, onSelect }: {
  item: Item
  primaryColor: string
  onSelect: (item: Item) => void
}) {
  return (
    <button
      className="w-full text-left bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow active:scale-95"
      onClick={() => onSelect(item)}
    >
      <div
        className="aspect-square bg-gray-100 flex items-center justify-center text-4xl"
        style={{ backgroundColor: primaryColor + '15' }}
      >
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          '🛍️'
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{item.name}</p>
        <p className="text-sm font-bold text-gray-900 mt-1">
          ${item.price.toLocaleString('es-MX')} MXN
        </p>
      </div>
    </button>
  )
}

function ViralFooter() {
  return (
    <footer className="mt-12 py-6 border-t border-gray-100 text-center">
      <a
        href="https://catalog.mx"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        🚀 Powered by <span className="font-semibold">catalog.mx</span> — Free for your business
      </a>
    </footer>
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
        <div className="sticky top-0 z-20 bg-indigo-600 text-white px-4 py-2.5 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">
            ✨ This is a demo — want this catalog for your business?
          </p>
          <button
            className="shrink-0 px-3 py-1 bg-white text-indigo-600 text-xs font-bold rounded-full hover:bg-indigo-50 transition-colors"
            onClick={() => setShowProspect(true)}
          >
            Yes, I want it →
          </button>
        </div>
      )}

      <StorefrontHeader business={data} />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {data.tagline && (
          <p className="text-center text-gray-500 text-sm mb-4">{data.tagline}</p>
        )}

        {categories.length > 0 && (
          <div className="mb-4">
            <CategoryFilter
              categories={categories}
              selected={activeCategory}
              onSelect={setActiveCategory}
            />
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(item => (
              <ProductCard
                key={item.id}
                item={item}
                primaryColor={data.theme.primary}
                onSelect={setSelectedItem}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-sm">No products in this category</p>
          </div>
        )}

        <ViralFooter />
      </main>

      <ProductModal
        item={selectedItem}
        whatsapp={data.whatsapp}
        onClose={() => setSelectedItem(null)}
      />

      {showProspect && (
        <ProspectModal businessId={data.id} onClose={() => setShowProspect(false)} />
      )}
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/prospects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, ...form }),
      })
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="font-bold text-gray-900 text-lg">Got it!</h2>
            <p className="text-sm text-gray-500 mt-1">We'll contact you shortly.</p>
            <button className="mt-4 text-sm text-indigo-600 hover:underline" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <h2 className="font-bold text-gray-900 text-lg mb-1">Tell us about you</h2>
            <p className="text-sm text-gray-500 mb-4">We'll contact you within 24 hours.</p>
            <div className="space-y-3">
              {['contactName', 'phone', 'email'].map(field => (
                <input
                  key={field}
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  placeholder={field === 'contactName' ? 'Your name' : field === 'phone' ? 'Phone / WhatsApp *' : 'Email (optional)'}
                  value={form[field as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ))}
            </div>
            <button
              className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              disabled={loading || (!form.phone && !form.email)}
              onClick={submit}
            >
              {loading ? 'Sending...' : 'I want my catalog →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
