import { getTranslations } from 'next-intl/server'
import PhoneMockup from './PhoneMockup'

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:5173'

export default async function Hero() {
  const t = await getTranslations('hero')

  return (
    <section className="relative overflow-hidden pt-32 pb-20 px-6">
      {/* Ambient warm glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div
          className="absolute top-0 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, #FDE68A22 0%, transparent 65%)' }}
        />
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_auto]">

          {/* Copy */}
          <div className="hero-text max-w-lg">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              {t('badge')}
            </p>

            <h1 className="font-heading text-5xl font-bold leading-[1.06] tracking-tight text-zinc-900 sm:text-6xl">
              {t('headline1')}{' '}
              <span className="text-zinc-400">{t('headline2')}</span>
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-zinc-500">
              {t('sub')}
            </p>

            <p className="mt-2 text-sm font-medium text-amber-600">
              {t('free_tier')}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={`${ADMIN_URL}/register`}
                className="btn rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-700"
              >
                {t('cta_primary')}
              </a>
              <a
                href="/demo/heladeria-pinguino"
                className="text-sm font-medium text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-700 hover:underline"
              >
                {t('cta_secondary')} →
              </a>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="hero-visual flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
