import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function PrivacyPage() {
  const t = await getTranslations('privacy')

  const sections = [
    { title: t('s1_title'), body: t('s1_body') },
    { title: t('s2_title'), body: t('s2_body') },
    { title: t('s3_title'), body: t('s3_body') },
    { title: t('s4_title'), body: t('s4_body') },
    { title: t('s5_title'), body: t('s5_body') },
    { title: t('s6_title'), body: t('s6_body') },
    { title: t('s7_title'), body: t('s7_body') },
  ]

  return (
    <div className="font-body min-h-screen bg-[#FAF9F6] text-zinc-900">
      <header className="border-b border-zinc-200/60 bg-[#FAF9F6]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="font-heading text-[17px] font-bold tracking-tight text-zinc-900">
            catalog.mx
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-zinc-400">{t('effective')}</p>
        <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          {t('title')}
        </h1>

        <div className="mt-12 space-y-10">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-heading mb-2 text-lg font-semibold text-zinc-900">{s.title}</h2>
              <p className="text-zinc-500 leading-relaxed">{s.body}</p>
              <div className="mt-6 border-b border-zinc-100" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
