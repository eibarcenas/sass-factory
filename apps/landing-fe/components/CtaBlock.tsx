import { getTranslations } from 'next-intl/server'
import GoogleSignInButton from './GoogleSignInButton'

export default async function CtaBlock() {
  const t = await getTranslations('cta')

  return (
    <section className="bg-zinc-900 py-24 px-6">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {t('headline')}
        </h2>
        <p className="mt-4 text-zinc-400">{t('sub')}</p>

        <div className="mt-8 flex justify-center">
          <GoogleSignInButton label={t('button')} size="large" />
        </div>

        <p className="mt-4 text-xs text-zinc-600">{t('note')}</p>
      </div>
    </section>
  )
}
