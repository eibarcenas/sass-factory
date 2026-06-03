import { getTranslations } from 'next-intl/server'

const PRODUCT_BG = ['bg-amber-100', 'bg-rose-100', 'bg-orange-100', 'bg-stone-200']

export default async function PhoneMockup() {
  const t = await getTranslations('mockup')
  const products = t.raw('products') as Array<{ name: string; price: string }>

  return (
    <div className="relative mx-auto w-[240px] sm:w-[256px] select-none">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse at center, #FDE68A44 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Device frame */}
      <div className="relative overflow-hidden rounded-[2.25rem] border-[7px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-zinc-900/25">
        {/* Dynamic island */}
        <div className="absolute left-1/2 top-0 z-10 h-5 w-[88px] -translate-x-1/2 rounded-b-2xl bg-zinc-900" aria-hidden="true" />

        {/* Screen */}
        <div className="overflow-hidden rounded-[1.75rem] bg-white">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-7 pb-1">
            <span className="text-[10px] font-semibold text-zinc-800">{t('time')}</span>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <div className="flex items-end gap-[2px]">
                {[4, 6, 8, 10].map((h, i) => (
                  <div key={i} style={{ height: h, width: 2 }} className="rounded-sm bg-zinc-800" />
                ))}
              </div>
              <div className="flex items-center gap-[1px]">
                <div className="h-[9px] w-[14px] rounded-[2px] border border-zinc-800 p-[1.5px]">
                  <div className="h-full w-3/4 rounded-[1px] bg-zinc-800" />
                </div>
                <div className="h-[5px] w-[2px] rounded-r-sm bg-zinc-800" />
              </div>
            </div>
          </div>

          {/* Business header */}
          <div className="flex items-center gap-2.5 px-4 pt-2 pb-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[11px] font-bold text-amber-700" aria-hidden="true">
              HP
            </div>
            <div>
              <p className="text-[13px] font-semibold leading-tight text-zinc-900">{t('business_name')}</p>
              <p className="text-[10px] leading-tight text-zinc-500">{t('business_sub')}</p>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-1.5 px-4 pb-2.5">
            <span className="rounded-full bg-zinc-900 px-2.5 py-[3px] text-[10px] font-medium text-white">{t('category_all')}</span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-[3px] text-[10px] font-medium text-zinc-500">{t('category_1')}</span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-[3px] text-[10px] font-medium text-zinc-500">{t('category_2')}</span>
          </div>

          {/* Products 2×2 */}
          <div className="grid grid-cols-2 gap-2 px-4 pb-3">
            {products.map((p, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-zinc-100">
                <div className={`h-[52px] ${PRODUCT_BG[i]}`} aria-hidden="true" />
                <div className="p-1.5">
                  <p className="text-[10px] font-medium leading-tight text-zinc-800">{p.name}</p>
                  <p className="text-[10px] text-zinc-500">{p.price}</p>
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <div className="px-4 pb-5">
            <div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-[11px] font-semibold text-white">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              {t('wa_button')}
            </div>
          </div>
        </div>
      </div>

      {/* Home indicator */}
      <div className="absolute -bottom-0.5 left-1/2 h-[3px] w-20 -translate-x-1/2 rounded-full bg-zinc-700" aria-hidden="true" />
    </div>
  )
}
