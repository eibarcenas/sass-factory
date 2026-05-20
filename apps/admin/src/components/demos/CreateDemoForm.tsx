import { useState } from 'react'
import { useCreateDemo } from '../../hooks/useBusinesses'
import type { BusinessType } from '@/types/catalog'

const TYPES: { key: BusinessType; label: string; emoji: string }[] = [
  { key: 'heladeria',  label: 'Ice cream', emoji: '🍦' },
  { key: 'barberia',   label: 'Barbershop', emoji: '💈' },
  { key: 'estetica',   label: 'Beauty salon', emoji: '💅' },
  { key: 'restaurante',label: 'Restaurant', emoji: '🍽️' },
  { key: 'panaderia',  label: 'Bakery', emoji: '🥐' },
  { key: 'gym',        label: 'Gym', emoji: '💪' },
  { key: 'mecanico',   label: 'Mechanic', emoji: '🔧' },
  { key: 'otro',       label: 'Other', emoji: '🏪' },
]

interface Props { onSuccess?: (slug: string) => void }

export default function CreateDemoForm({ onSuccess }: Props) {
  const createDemo = useCreateDemo()
  const [form, setForm] = useState({
    name: '', type: '' as BusinessType | '', whatsapp: '', city: '', tagline: '',
  })
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.type || !form.whatsapp || !form.city) {
      setError('Name, type, WhatsApp and city are required')
      return
    }
    setError('')
    try {
      const business = await createDemo.mutateAsync({
        name: form.name, type: form.type, whatsapp: form.whatsapp,
        city: form.city, tagline: form.tagline || undefined,
      })
      onSuccess?.(business.slug)
      setForm({ name: '', type: '', whatsapp: '', city: '', tagline: '' })
    } catch (err: any) {
      setError(err.message ?? 'Failed to create demo')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Business type grid */}
      <div className="grid grid-cols-4 gap-2">
        {TYPES.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setForm(f => ({ ...f, type: t.key }))}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
              form.type === t.key
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-xl">{t.emoji}</span>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">{t.label}</span>
          </button>
        ))}
      </div>

      <input
        value={form.name} onChange={set('name')}
        placeholder="Business name *"
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          value={form.whatsapp} onChange={set('whatsapp')}
          placeholder="+52... WhatsApp *" type="tel"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          value={form.city} onChange={set('city')}
          placeholder="City *"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <input
        value={form.tagline} onChange={set('tagline')}
        placeholder="Tagline (optional)"
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={createDemo.isPending}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
      >
        {createDemo.isPending ? 'Creating...' : 'Create demo'}
      </button>
    </form>
  )
}
