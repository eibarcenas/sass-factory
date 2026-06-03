'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const nextLocale = locale === 'es' ? 'en' : 'es'

  function toggle() {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <button
      onClick={toggle}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
    >
      {locale === 'es' ? 'EN' : 'ES'}
    </button>
  )
}
