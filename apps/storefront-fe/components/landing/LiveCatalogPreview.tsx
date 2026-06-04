import { ExternalLink } from 'lucide-react'

const CATALOG_URL = '/heladeria-el-pinguino'

export default function LiveCatalogPreview() {
  return (
    <div className="relative w-full max-w-[380px] overflow-hidden rounded-[2rem] border border-white/10 bg-white text-zinc-950 shadow-[0_32px_90px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
        <span className="ml-2 min-w-0 flex-1 truncate rounded-full bg-white px-3 py-1 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200">
          catalog.mx/heladeria-el-pinguino
        </span>
        <a
          href={CATALOG_URL}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-[#25D366]"
          aria-label="Abrir sitio completo de Heladeria El Pinguino"
        >
          <ExternalLink size={15} strokeWidth={1.8} aria-hidden="true" />
        </a>
      </div>

      <div className="h-[560px] bg-white">
        <iframe
          src={CATALOG_URL}
          title="Sitio real de Heladeria El Pinguino"
          className="h-full w-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  )
}
