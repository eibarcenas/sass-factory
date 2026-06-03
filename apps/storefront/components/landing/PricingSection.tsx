'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import GoogleSignInButton from './GoogleSignInButton'

const FEATURES = [
  'Link propio para tu catalogo (catalog.mx/tunegocio)',
  'Productos ilimitados con foto, descripcion y precio',
  'Pedidos via WhatsApp con mensaje pre-llenado',
  'Actualizacion de precios en tiempo real',
  'Categorias y filtros para tus productos',
  'Compatible con cualquier telefono',
  'Soporte por WhatsApp',
]

export default function PricingSection() {
  const [annual, setAnnual] = useState(false)

  const price    = annual ? 900 : 100
  const perMonth = annual ? 75 : 100
  const saving   = annual ? 300 : 0

  return (
    <section className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h2
            className="text-white font-black leading-tight tracking-[-0.02em] mb-3"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Precio simple. Sin sorpresas.
          </h2>
          <p className="text-[1rem]" style={{ color: '#888888' }}>
            Un plan. Todo incluido. Cancela cuando quieras.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setAnnual(false)}
              className="text-sm font-medium transition-colors"
              style={{ color: annual ? '#888888' : 'white' }}
            >
              Mensual
            </button>

            <button
              onClick={() => setAnnual(!annual)}
              role="switch"
              aria-checked={annual}
              aria-label="Cambiar a facturacion anual"
              className="relative w-12 h-6 rounded-full overflow-hidden transition-colors duration-200 shrink-0"
              style={{ background: annual ? '#25D366' : 'rgba(255,255,255,0.15)', flexShrink: 0 }}
            >
              <span
                className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200"
                style={{ transform: annual ? 'translateX(22px)' : 'translateX(0)' }}
              />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAnnual(true)}
                className="text-sm font-medium transition-colors"
                style={{ color: annual ? 'white' : '#888888' }}
              >
                Anual
              </button>
              {annual && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}
                >
                  Ahorra $300
                </span>
              )}
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
                  Plan Starter
                </p>
                <p className="text-[#888888] text-sm">Para negocios locales en Mexico</p>
              </div>
              <div
                className="px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}
              >
                Todo incluido
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
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
                    / {annual ? 'año' : 'mes'}
                  </p>
                </div>
              </div>
              {annual && (
                <p className="text-sm mt-1" style={{ color: '#888888' }}>
                  Equivale a{' '}
                  <span className="font-bold" style={{ color: '#25D366' }}>
                    $75/mes
                  </span>
                  . Ahorras ${saving} al ano.
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="mb-6 flex justify-center">
              <GoogleSignInButton size="large" />
            </div>

            {/* Features */}
            <div className="flex flex-col gap-3">
              {FEATURES.map((feature) => (
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
              Sin contrato. Cancela en cualquier momento.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
