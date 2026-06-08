import { useState, useEffect, useRef } from 'react'
import { BusinessType } from '@eguru/core'

const API_URL = import.meta.env.VITE_IDENTITY_API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type BusinessFormMode = 'register' | 'create' | 'edit' | 'seller'
export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export interface BusinessFormValues {
  logo: string
  type: BusinessType | ''
  name: string
  contactName: string
  whatsapp: string
  ownerEmail: string
  city: string
  state: string
}

export interface BusinessFormDefaults {
  logo?: string
  type?: BusinessType
  name?: string
  contactName?: string
  whatsapp?: string
  ownerEmail?: string
  ownerId?: string
  city?: string
  state?: string
  slug?: string
}

export function useBusinessFormState(mode: BusinessFormMode, defaultValues?: BusinessFormDefaults) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const [logo,        setLogo]        = useState(defaultValues?.logo        ?? '')
  const [type,        setType]        = useState<BusinessType | ''>(defaultValues?.type ?? '')
  const [name,        setName]        = useState(defaultValues?.name        ?? '')
  const [contactName, setContactName] = useState(defaultValues?.contactName ?? '')
  const [whatsapp,    setWhatsapp]    = useState(defaultValues?.whatsapp    ?? '')
  const [ownerEmail,  setOwnerEmail]  = useState(defaultValues?.ownerEmail  ?? '')
  const [city,        setCity]        = useState(defaultValues?.city        ?? '')
  const [state,       setState]       = useState(defaultValues?.state       ?? 'Ciudad de México')
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [slug,       setSlug]       = useState('')
  const [error,      setError]      = useState('')

  // Sync form fields when defaultValues change (edit/seller modes after query refetch)
  useEffect(() => {
    if (!defaultValues || mode === 'register' || mode === 'create') return
    setLogo(defaultValues.logo             ?? '')
    setType(defaultValues.type             ?? '')
    setName(defaultValues.name             ?? '')
    setContactName(defaultValues.contactName ?? '')
    setWhatsapp(defaultValues.whatsapp     ?? '')
    setCity(defaultValues.city             ?? '')
    setState(defaultValues.state           ?? 'Ciudad de México')
  }, [defaultValues]) // eslint-disable-line react-hooks/exhaustive-deps

  // Slug availability check — register mode only
  useEffect(() => {
    if (mode !== 'register') return
    clearTimeout(debounceRef.current)
    if (!name.trim()) { setSlugStatus('idle'); setSlug(''); return }
    setSlugStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/business-slugs/${encodeURIComponent(name.trim())}/availability`)
        const data = await res.json()
        setSlug(data.slug ?? '')
        if (data.reason === 'invalid_name') setSlugStatus('invalid')
        else setSlugStatus(data.available ? 'available' : 'taken')
      } catch { setSlugStatus('idle') }
    }, 250)
    return () => clearTimeout(debounceRef.current)
  }, [name, mode])

  function validate(): string[] {
    const msgs: string[] = []
    if (!type) msgs.push('Selecciona el tipo de negocio')
    if (name.trim().length < 2) msgs.push('El nombre debe tener al menos 2 caracteres')
    if (mode === 'register' && !logo) msgs.push('Agrega el logo de tu negocio')
    if (mode === 'register' && contactName.trim().length < 2) msgs.push('Escribe tu nombre')
    if (mode === 'register' && !whatsapp.trim()) msgs.push('Escribe tu WhatsApp')
    if (mode === 'register' && city.trim().length < 2) msgs.push('Escribe tu ciudad')
    if (mode === 'register' && !state) msgs.push('Selecciona tu estado')
    if (mode === 'register' && slugStatus === 'taken')   msgs.push('Ese nombre ya está en uso')
    if (mode === 'register' && slugStatus === 'invalid') msgs.push('El nombre no es válido')
    if (whatsapp && !/^[0-9+]{7,15}$/.test(whatsapp.trim())) msgs.push('WhatsApp debe ser un número válido')
    if (mode === 'create' && ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim()))
      msgs.push('El email del vendedor no es válido')
    return msgs
  }

  function reset() {
    setLogo(''); setType(''); setName('')
    setContactName(''); setWhatsapp(''); setOwnerEmail('')
    setCity(''); setState('Ciudad de México')
    setSlugStatus('idle'); setSlug(''); setError('')
  }

  return {
    values: { logo, type, name, contactName, whatsapp, ownerEmail, city, state } as BusinessFormValues,
    setters: { setLogo, setType, setName, setContactName, setWhatsapp, setOwnerEmail, setCity, setState },
    slugStatus,
    slug,
    error,
    setError,
    validate,
    reset,
  }
}
