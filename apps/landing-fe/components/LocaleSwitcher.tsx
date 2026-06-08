'use client'

import { ChevronDown, Languages } from 'lucide-react'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

type LocaleSwitcherProps = {
  label?: string
  theme?: 'light' | 'dark'
}

export default function LocaleSwitcher({
  label = 'Language',
  theme = 'light',
}: LocaleSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function changeLocale(nextLocale: 'es' | 'en') {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <label
      className={`relative flex items-center rounded-md border transition-colors focus-within:ring-2 focus-within:ring-emerald-500/50 ${
        theme === 'dark'
          ? 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
      }`}
    >
      <span className="sr-only">{label}</span>
      <Languages aria-hidden="true" className="pointer-events-none ml-2.5 h-4 w-4" strokeWidth={1.75} />
      <select
        aria-label={label}
        value={locale}
        onChange={(event) => changeLocale(event.target.value as 'es' | 'en')}
        className="cursor-pointer appearance-none bg-transparent py-2 pl-2 pr-8 text-xs font-medium outline-none"
      >
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
        strokeWidth={1.75}
      />
    </label>
  )
}
