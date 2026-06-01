import { getTranslations } from 'next-intl/server'

export default async function Footer() {
  const t = await getTranslations('footer')

  return (
    <footer className="border-t border-zinc-800 bg-zinc-900 py-8 px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="font-heading font-semibold text-zinc-500">catalog.mx</span>
        <nav className="flex items-center gap-6 text-sm text-zinc-600" aria-label="Footer">
          <a href="#" className="transition-colors hover:text-zinc-400">{t('privacy')}</a>
          <a href="#" className="transition-colors hover:text-zinc-400">{t('terms')}</a>
          <a href="#" className="transition-colors hover:text-zinc-400">{t('contact')}</a>
        </nav>
        <span className="text-xs text-zinc-700">{t('copyright')}</span>
      </div>
    </footer>
  )
}
