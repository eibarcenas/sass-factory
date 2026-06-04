import { ExternalLink, IceCreamBowl, ShoppingCart } from 'lucide-react'

const DEMO_URL = '/demo/heladeria-pinguino'

const PRODUCTS = [
  { name: 'Helado de Vainilla', price: '$35 MXN' },
  { name: 'Helado de Chocolate', price: '$35 MXN' },
  { name: 'Nieve de Limon', price: '$30 MXN' },
  { name: 'Copa Especial Pinguino', price: '$75 MXN' },
]

export default function LiveCatalogPreview() {
  return (
    <a
      href={DEMO_URL}
      className="group relative block w-full max-w-[380px] overflow-hidden rounded-3xl border border-white/10 bg-white text-zinc-950 shadow-[0_32px_90px_rgba(0,0,0,0.5)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_38px_100px_rgba(37,211,102,0.2)]"
      aria-label="Visitar el sitio real de Helados Pinguinos"
    >
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
        <span className="ml-2 min-w-0 flex-1 truncate rounded-full bg-white px-3 py-1 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200">
          catalog.mx/demo/heladeria-pinguino
        </span>
      </div>

      <div className="bg-[#fbfbf8] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25D366] text-zinc-950">
              <IceCreamBowl size={23} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
              Sitio real
            </p>
            <h2 className="mt-1 text-2xl font-black leading-tight text-zinc-950">
              Helados Pinguinos
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Los mejores helados artesanales de la ciudad.
            </p>
          </div>
          <ExternalLink
            size={19}
            strokeWidth={1.8}
            className="mt-1 text-zinc-400 transition-colors group-hover:text-emerald-600"
            aria-hidden="true"
          />
        </div>

        <div className="mt-6 grid gap-2">
          {PRODUCTS.map((product) => (
            <div
              key={product.name}
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-3"
            >
              <span className="min-w-0 truncate text-sm font-semibold text-zinc-800">
                {product.name}
              </span>
              <span className="shrink-0 text-sm font-black text-zinc-950">
                {product.price}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition-colors group-hover:bg-[#25D366] group-hover:text-zinc-950">
          <ShoppingCart size={17} strokeWidth={1.9} aria-hidden="true" />
          Visitar sitio real
        </div>
      </div>
    </a>
  )
}
