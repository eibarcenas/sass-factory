import { getTranslations } from 'next-intl/server'
import LocaleSwitcher from './LocaleSwitcher'

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:5173'

export default async function Nav() {
  const t = await getTranslations('nav')

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-200/60 bg-[#FAF9F6]/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <span className="font-heading text-[17px] font-bold tracking-tight text-zinc-900">
          catalog.mx
        </span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <a
            href={`${ADMIN_URL}/register`}
            className="btn rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            {t('cta')}
          </a>
        </div>
      </nav>
    </header>
  )
}
