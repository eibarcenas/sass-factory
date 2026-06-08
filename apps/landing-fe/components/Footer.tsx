import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import LocaleSwitcher from './LocaleSwitcher'

export default async function Footer() {
  const t = await getTranslations('footer')

  return (
    <footer className="border-t border-zinc-800 bg-zinc-900 py-8 px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 lg:flex-row">
        <Link href="/" className="font-heading font-semibold text-zinc-500">
          catalog.mx
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-zinc-600" aria-label="Footer">
          <Link href="/legal/privacy" className="transition-colors hover:text-zinc-400">
            {t('privacy')}
          </Link>
          <Link href="/legal/terms" className="transition-colors hover:text-zinc-400">
            {t('terms')}
          </Link>
          <Link href="/legal/cookies" className="transition-colors hover:text-zinc-400">
            {t('cookies')}
          </Link>
          <a
            href="mailto:hola@catalog.mx"
            className="transition-colors hover:text-zinc-400"
          >
            {t('contact')}
          </a>
        </nav>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <LocaleSwitcher label={t('language')} theme="dark" />
          <span className="text-center text-xs text-zinc-700">
            {t('copyright', { year: new Date().getFullYear() })}
          </span>
        </div>
      </div>
    </footer>
  )
}
