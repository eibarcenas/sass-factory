import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import DOMPurify from 'isomorphic-dompurify'
import { getLegalDoc } from '@/lib/api'
import { LEGAL_DOC_TITLES, LEGAL_ALLOWED_TAGS, isLegalDocType } from '@/lib/legal'

type Props = { params: Promise<{ slug: string; doc: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, doc } = await params
  if (!isLegalDocType(doc)) return { title: 'catalog.mx' }
  const data = await getLegalDoc(slug, doc)
  const title = LEGAL_DOC_TITLES[doc]
  if (!data) return { title }
  return { title: `${title} — ${data.businessName}` }
}

export default async function LegalPage({ params }: Props) {
  const { slug, doc } = await params
  if (!isLegalDocType(doc)) notFound()

  const data = await getLegalDoc(slug, doc)
  if (!data) notFound()

  const title = LEGAL_DOC_TITLES[doc]
  const clean = DOMPurify.sanitize(data.content, {
    ALLOWED_TAGS: LEGAL_ALLOWED_TAGS,
    ALLOWED_ATTR: [],
  })
  const updated = data.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <span className="truncate text-sm font-semibold">{data.businessName}</span>
          <Link href={`/${slug}`} className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
            ← Volver a la tienda
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {updated && <p className="mt-1 text-xs text-muted-foreground">Actualizado: {updated}</p>}

        <div className="legal-content mt-4" dangerouslySetInnerHTML={{ __html: clean }} />

        <footer className="mt-12 border-t pt-6 text-center">
          <a
            href="https://catalog.mx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            🚀 Powered by <span className="font-semibold">catalog.mx</span>
          </a>
        </footer>
      </main>
    </div>
  )
}
