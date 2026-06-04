'use client'

import { useState } from 'react'
import { Check, Clock3, Flame } from 'lucide-react'
import { useLocale } from 'next-intl'
import GoogleSignInButton from './GoogleSignInButton'

const COPY = {
  en: {
    eyebrow: 'Limited launch offer',
    headline: 'Lock in the launch price before it changes.',
    sub: 'Small businesses move fast. This price is designed to get your catalog live today, not someday.',
    monthly: 'Monthly',
    annual: 'Annual',
    saveShort: 'Save $300',
    annualBadge: 'Best value',
    plan: 'Starter plan',
    audience: 'For local businesses in Mexico',
    included: 'Launch price',
    regular: 'Regular value',
    now: 'Today',
    unitMonth: 'month',
    unitYear: 'year',
    annualNote: 'Equivalent to $75/month. You save $300 per year.',
    monthlyNote: 'Pay monthly after your free launch period.',
    urgency: 'Launch offer: 7 days free. No credit card required.',
    urgencyFine: 'The discounted annual price is available only during this launch window.',
    valueTitle: 'What you avoid paying for',
    valueItems: [
      'No developer setup fee',
      'No marketplace commissions',
      'No extra tool to collect WhatsApp orders',
    ],
    features: [
      'Your own catalog link (catalog.mx/yourbusiness)',
      'Unlimited products with photo, description and price',
      'WhatsApp orders with pre-filled message',
      'Real-time price updates',
      'Categories and product filters',
      'Works on any phone',
      'WhatsApp support',
    ],
    guarantee: 'No contract. Cancel anytime.',
  },
  es: {
    eyebrow: 'Oferta de lanzamiento limitada',
    headline: 'Asegura el precio de lanzamiento antes de que cambie.',
    sub: 'Los negocios pequenos se mueven rapido. Este precio esta pensado para lanzar hoy, no algun dia.',
    monthly: 'Mensual',
    annual: 'Anual',
    saveShort: 'Ahorra $300',
    annualBadge: 'Mejor valor',
    plan: 'Plan Starter',
    audience: 'Para negocios locales en Mexico',
    included: 'Precio lanzamiento',
    regular: 'Valor regular',
    now: 'Hoy',
    unitMonth: 'mes',
    unitYear: 'ano',
    annualNote: 'Equivale a $75/mes. Ahorras $300 al ano.',
    monthlyNote: 'Paga mensual despues de tu periodo gratis.',
    urgency: 'Oferta de lanzamiento: 7 dias gratis. Sin tarjeta de credito.',
    urgencyFine: 'El precio anual con descuento esta disponible solo durante esta ventana de lanzamiento.',
    valueTitle: 'Lo que evitas pagar',
    valueItems: [
      'Sin costo de configuracion con desarrollador',
      'Sin comisiones por venta',
      'Sin herramienta extra para recibir pedidos por WhatsApp',
    ],
    features: [
      'Link propio para tu catalogo (catalog.mx/tunegocio)',
      'Productos ilimitados con foto, descripcion y precio',
      'Pedidos via WhatsApp con mensaje pre-llenado',
      'Actualizacion de precios en tiempo real',
      'Categorias y filtros para tus productos',
      'Compatible con cualquier telefono',
      'Soporte por WhatsApp',
    ],
    guarantee: 'Sin contrato. Cancela en cualquier momento.',
  },
}

export default function PricingSection() {
  const locale = useLocale()
  const t = locale === 'es' ? COPY.es : COPY.en
  const [annual, setAnnual] = useState(true)

  const price    = annual ? 900 : 100
  const regular  = annual ? 1200 : 149
  const unit     = annual ? t.unitYear : t.unitMonth

  return (
    <section className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em]"
            style={{ background: 'rgba(37,211,102,0.13)', color: '#25D366' }}
          >
            <Flame size={14} fill="currentColor" aria-hidden="true" />
            {t.eyebrow}
          </div>
          <h2
            className="text-white font-black leading-tight tracking-[-0.02em] mb-3"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            {t.headline}
          </h2>
          <p className="mx-auto max-w-[620px] text-[1rem] leading-relaxed" style={{ color: '#888888' }}>
            {t.sub}
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setAnnual(false)}
              className="text-sm font-medium transition-colors duration-300 ease-out"
              style={{ color: annual ? '#888888' : 'white' }}
            >
              {t.monthly}
            </button>

            <button
              onClick={() => setAnnual(!annual)}
              role="switch"
              aria-checked={annual}
              aria-label="Cambiar a facturacion anual"
              className="relative w-12 h-6 rounded-full overflow-hidden transition-colors duration-500 ease-out shrink-0"
              style={{ background: annual ? '#25D366' : 'rgba(255,255,255,0.15)', flexShrink: 0 }}
            >
              <span
                className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-500 ease-out will-change-transform"
                style={{ transform: annual ? 'translateX(22px)' : 'translateX(0)' }}
              />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAnnual(true)}
                className="text-sm font-medium transition-colors duration-300 ease-out"
                style={{ color: annual ? 'white' : '#888888' }}
              >
                {t.annual}
              </button>
              <span className="inline-flex w-[78px] justify-start">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap transition-[opacity,transform] duration-500 ease-out ${
                    annual ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-0.5'
                  }`}
                  style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}
                  aria-hidden={!annual}
                >
                  {t.saveShort}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Pricing card */}
        <div className="max-w-md mx-auto">
          <div
            className="rounded-2xl p-8"
            style={{
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Plan name */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[#25D366] text-xs font-bold uppercase tracking-widest mb-1">
                  {t.plan}
                </p>
                <p className="text-[#888888] text-sm">{t.audience}</p>
              </div>
              <div
                className="px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}
              >
                {annual ? t.annualBadge : t.included}
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-sm" style={{ color: '#888888' }}>
                <span>{t.regular}</span>
                <span className="font-bold line-through decoration-[#25D366] decoration-2">
                  ${regular} MXN
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.08em]"
                  style={{ background: 'rgba(37,211,102,0.14)', color: '#25D366' }}
                >
                  {t.now}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span
                  className="font-black leading-none"
                  style={{ fontSize: 'clamp(3rem, 8vw, 4rem)', color: 'white' }}
                >
                  ${price}
                </span>
                <div className="mb-2">
                  <p className="text-[#888888] text-sm leading-tight">MXN</p>
                  <p className="text-[#888888] text-sm leading-tight">
                    / {unit}
                  </p>
                </div>
              </div>
              <p className="text-sm mt-2" style={{ color: '#888888' }}>
                {annual ? t.annualNote : t.monthlyNote}
              </p>
            </div>

            <div
              className="mb-6 rounded-xl p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(37,211,102,0.14), rgba(37,211,102,0.04))',
                border: '1px solid rgba(37,211,102,0.24)',
              }}
            >
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 shrink-0" size={18} color="#25D366" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-white">{t.urgency}</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
                    {t.urgencyFine}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.12em]" style={{ color: '#25D366' }}>
                {t.valueTitle}
              </p>
              <div className="grid gap-2">
                {t.valueItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg px-3 py-2 text-sm font-medium"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#d4d4d8' }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mb-6 flex justify-center">
              <GoogleSignInButton size="large" />
            </div>

            {/* Features */}
            <div className="flex flex-col gap-3">
              {t.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check
                    size={16}
                    className="shrink-0 mt-0.5"
                    color="#25D366"
                    strokeWidth={2.5}
                  />
                  <span className="text-sm leading-snug" style={{ color: '#cccccc' }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Guarantee */}
            <div
              className="mt-6 pt-5 flex items-center gap-2 text-xs"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.07)',
                color: '#888888',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1L8.854 4.757l4.146.604-3 2.924.708 4.129L7 10.25l-3.708 2.164.708-4.129-3-2.924 4.146-.604L7 1z"
                  fill="rgba(37,211,102,0.5)" />
              </svg>
              {t.guarantee}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
