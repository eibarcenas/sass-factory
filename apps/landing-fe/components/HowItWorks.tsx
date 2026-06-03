import { getTranslations } from 'next-intl/server'

export default async function HowItWorks() {
  const t = await getTranslations('how')
  const steps = t.raw('steps') as Array<{ n: string; title: string; body: string }>

  return (
    <section className="bg-[#FAF9F6] py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="scroll-reveal">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {t('headline')}
          </h2>
          <p className="mt-3 text-zinc-500">{t('sub')}</p>
        </div>

        <div className="stagger mt-14 grid gap-10 sm:grid-cols-3 sm:gap-12">
          {steps.map((s) => (
            <div key={s.n} className="scroll-reveal">
              <p className="font-heading mb-4 text-5xl font-bold leading-none text-zinc-200" aria-hidden="true">
                {s.n}
              </p>
              <h3 className="font-heading mb-2 text-lg font-semibold text-zinc-900">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
