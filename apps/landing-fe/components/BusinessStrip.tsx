import { getTranslations } from 'next-intl/server'

export default async function BusinessStrip() {
  const t = await getTranslations('strip')
  const items = t.raw('items') as string[]

  return (
    <div className="border-y border-zinc-100 bg-white py-4 px-6">
      <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          {t('label')}
        </span>
        {items.map((item) => (
          <span key={item} className="text-sm text-zinc-500">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
