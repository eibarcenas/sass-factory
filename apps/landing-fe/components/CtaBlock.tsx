import { getTranslations } from 'next-intl/server'

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:5173'

export default async function CtaBlock() {
  const t = await getTranslations('cta')

  return (
    <section className="bg-zinc-900 py-24 px-6">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {t('headline')}
        </h2>
        <p className="mt-4 text-zinc-400">{t('sub')}</p>

        <a
          href={`${ADMIN_URL}/register`}
          className="btn mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-zinc-900 hover:bg-zinc-100"
        >
          {t('button')}
          <svg
            viewBox="0 0 16 16"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        <p className="mt-4 text-xs text-zinc-600">{t('note')}</p>
      </div>
    </section>
  )
}
