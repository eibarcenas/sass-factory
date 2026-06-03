import { getTranslations } from 'next-intl/server'

const STYLES = [
  { accent: '#FEF3C7', text: '#92400E' },
  { accent: '#D1FAE5', text: '#065F46' },
  { accent: '#FCE7F3', text: '#9D174D' },
]

export default async function Features() {
  const t = await getTranslations('features')
  const items = t.raw('items') as Array<{ n: string; title: string; body: string }>

  const features = items.map((item, i) => ({ ...item, ...STYLES[i] }))

  return (
    <section className="bg-white py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="scroll-reveal">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {t('headline')}
          </h2>
          <p className="mt-3 max-w-md text-zinc-500">{t('sub')}</p>
        </div>

        <div className="stagger mt-12 grid gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.n}
              className="scroll-reveal rounded-2xl border border-zinc-100 p-8 transition-colors duration-200 hover:border-zinc-200"
            >
              <div
                className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                style={{ background: f.accent, color: f.text }}
                aria-hidden="true"
              >
                {f.n}
              </div>
              <h3 className="font-heading mb-2 text-lg font-semibold leading-tight text-zinc-900">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
