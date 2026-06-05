import { useState } from 'react'
import { useCreateDemo } from '../../hooks/useBusinesses'
import { BusinessType } from '@eguru/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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

interface Props { onSuccess?: (slug: string) => void }

export default function CreateBusinessForm({ onSuccess }: Props) {
  const createDemo = useCreateDemo()
  const [form, setForm] = useState({
    type: '' as BusinessType | '',
    name: '',
    contactName: '',
    whatsapp: '',
    ownerEmail: '',
    city: '',
    state: 'Ciudad de México',
    tagline: '',
  })
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nameOk = form.name.trim().length >= 2
    const phoneOk = /^[0-9+]{7,15}$/.test(form.whatsapp.trim())
    const cityOk = form.city.trim().length >= 2
    const emailOk = !form.ownerEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail.trim())

    if (!form.type || !nameOk || !phoneOk || !cityOk || !emailOk) {
      const msgs = []
      if (!form.type) msgs.push('Selecciona el tipo de negocio')
      if (!nameOk) msgs.push('El nombre debe tener al menos 2 caracteres')
      if (!phoneOk) msgs.push('El WhatsApp debe ser un número válido')
      if (!cityOk) msgs.push('La ciudad debe tener al menos 2 caracteres')
      if (!emailOk) msgs.push('El email del dueño no es válido')
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
        state: form.state,
        tagline: form.tagline || undefined,
        contactName: form.contactName || undefined,
        ownerEmail: form.ownerEmail || undefined,
      })
      onSuccess?.(business.slug)
      setForm({ type: '', name: '', contactName: '', whatsapp: '', ownerEmail: '', city: '', state: 'Ciudad de México', tagline: '' })
    } catch (err: any) {
      setError(err.message ?? 'No se pudo crear el negocio')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Type selector */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo de negocio *
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Business data */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Datos del negocio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre del negocio *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={set('name')}
              placeholder="Ej. Barbería El Tigre"
            />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label htmlFor="tagline">
              Tagline <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="tagline"
              value={form.tagline}
              onChange={set('tagline')}
              placeholder="Los mejores cortes del sur de la ciudad"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contactName">
              Nombre del dueño <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="contactName"
              value={form.contactName}
              onChange={set('contactName')}
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input
              id="whatsapp"
              value={form.whatsapp}
              onChange={e => {
                const val = e.target.value.replace(/[^\d+]/g, '')
                setForm(f => ({ ...f, whatsapp: val }))
              }}
              placeholder="+52 55 1234 5678"
              type="tel"
              maxLength={16}
            />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label htmlFor="ownerEmail">
              Email del dueño <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="ownerEmail"
              value={form.ownerEmail}
              onChange={set('ownerEmail')}
              placeholder="dueno@gmail.com"
              type="email"
            />
            <p className="text-xs text-muted-foreground">
              Si lo proporcionas, el dueño quedará activado automáticamente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={form.city}
                onChange={set('city')}
                placeholder="Ej. Monterrey"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">Estado</Label>
              <select
                id="state"
                value={form.state}
                onChange={set('state')}
                className="w-full px-3.5 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background transition-shadow"
              >
                {MEXICO_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" disabled={createDemo.isPending} className="w-full">
        {createDemo.isPending ? 'Creando...' : 'Crear negocio'}
      </Button>
    </form>
  )
}
