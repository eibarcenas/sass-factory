import { getTranslations } from 'next-intl/server'
import LocaleSwitcher from './LocaleSwitcher'
import GoogleSignInButton from './GoogleSignInButton'

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
          <GoogleSignInButton label={t('cta')} />
        </div>
      </nav>
    </header>
  )
}
