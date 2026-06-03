import { useState } from 'react'
import { useCreateDemo } from '../../hooks/useBusinesses'
import { BusinessType } from '@eguru/core'

const TYPES: { key: BusinessType; label: string; emoji: string }[] = [
  { key: BusinessType.Heladeria,   label: 'Heladería',  emoji: '🍦' },
  { key: BusinessType.Barberia,    label: 'Barbería',   emoji: '💈' },
  { key: BusinessType.Estetica,    label: 'Estética',   emoji: '💅' },
  { key: BusinessType.Restaurante, label: 'Restaurante',emoji: '🍽️' },
  { key: BusinessType.Panaderia,   label: 'Panadería',  emoji: '🥐' },
  { key: BusinessType.Gym,         label: 'Gimnasio',   emoji: '💪' },
  { key: BusinessType.Mecanico,    label: 'Mecánico',   emoji: '🔧' },
  { key: BusinessType.Otro,        label: 'Otro',       emoji: '🏪' },
]

const MEXICO_STATES = [
  'Ciudad de México', 'Estado de México', 'Jalisco', 'Nuevo León', 'Puebla',
  'Guanajuato', 'Chihuahua', 'Baja California', 'Veracruz', 'Sonora',
  'Tamaulipas', 'Coahuila', 'Michoacán', 'Oaxaca', 'Chiapas',
  'Guerrero', 'Hidalgo', 'Sinaloa', 'San Luis Potosí', 'Tabasco',
  'Yucatán', 'Querétaro', 'Morelos', 'Durango', 'Zacatecas',
  'Aguascalientes', 'Quintana Roo', 'Tlaxcala', 'Nayarit', 'Campeche',
  'Colima', 'Baja California Sur',
]

const inputClass = 'w-full px-3.5 py-2.5 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background transition-shadow'

interface Props { onSuccess?: (slug: string) => void }

export default function CreateDemoForm({ onSuccess }: Props) {
  const createDemo = useCreateDemo()
  const [form, setForm] = useState({
    type: '' as BusinessType | '',
    name: '',
    contactName: '',
    whatsapp: '',
    city: '',
    state: 'Ciudad de México',
    tagline: '',
  })
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nameOk = form.name.trim().length >= 2
    const phoneOk = /^[0-9+]{7,15}$/.test(form.whatsapp.trim())
    const cityOk = form.city.trim().length >= 2
    if (!form.type || !nameOk || !phoneOk || !cityOk) {
      const msgs = []
      if (!form.type) msgs.push('Selecciona el tipo de negocio')
      if (!nameOk) msgs.push('El nombre debe tener al menos 2 caracteres')
      if (!phoneOk) msgs.push('El WhatsApp debe ser un número válido')
      if (!cityOk) msgs.push('La ciudad debe tener al menos 2 caracteres')
      setError(msgs.join(' · '))
      return
    }
    setError('')
    try {
      const business = await createDemo.mutateAsync({
        name: form.name,
        type: form.type,
        whatsapp: form.whatsapp,
        city: form.city,
        tagline: form.tagline || undefined,
        contactName: form.contactName || undefined,
      })
      onSuccess?.(business.slug)
      setForm({ type: '', name: '', contactName: '', whatsapp: '', city: '', state: 'Ciudad de México', tagline: '' })
    } catch (err: any) {
      setError(err.message ?? 'No se pudo crear la demo')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Niche selector */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2.5">Tipo de negocio *</p>
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setForm(f => ({ ...f, type: t.key }))}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                form.type === t.key
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30 hover:bg-muted/50'
              }`}
            >
              <span className="text-xl">{t.emoji}</span>
              <span className="text-xs font-medium text-center leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Business data */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Datos del negocio</p>
        <input
          value={form.name}
          onChange={set('name')}
          placeholder="Nombre del negocio *"
          className={inputClass}
        />
      </div>

      {/* Contact data */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Contacto</p>
        <input
          value={form.contactName}
          onChange={set('contactName')}
          placeholder="Nombre del dueño / contacto"
          className={inputClass}
        />
        <input
          value={form.whatsapp}
          onChange={e => {
            const val = e.target.value.replace(/[^\d+]/g, '')
            setForm(f => ({ ...f, whatsapp: val }))
          }}
          placeholder="WhatsApp +52 55 1234 5678 *"
          type="tel"
          maxLength={16}
          className={inputClass}
        />
      </div>

      {/* Location */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Ubicación</p>
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.city}
            onChange={set('city')}
            placeholder="Ciudad *"
            className={inputClass}
          />
          <select
            value={form.state}
            onChange={set('state')}
            className={inputClass}
          >
            {MEXICO_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tagline — optional */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Tagline <span className="font-normal">(opcional)</span></p>
        <input
          value={form.tagline}
          onChange={set('tagline')}
          placeholder="Los mejores cortes del sur de la ciudad"
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">
          Frase corta visible en la página del negocio.
        </p>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={createDemo.isPending}
        className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
      >
        {createDemo.isPending ? 'Creando...' : 'Crear demo'}
      </button>
    </form>
  )
}
