import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCatalogResult } from '@/lib/api'
import CatalogView from '@/components/CatalogView'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const result = await getCatalogResult(slug)
  if (result.type !== 'ok') return { title: result.type === 'suspended' ? 'Business suspended' : 'Not found' }
  return {
    title: result.data.name,
    description: result.data.tagline ?? `${result.data.name} — catalog.mx`,
    openGraph: { title: result.data.name, description: result.data.tagline ?? '' },
  }
}

export default async function CatalogPage({ params }: Props) {
  const { slug } = await params
  const result = await getCatalogResult(slug)
  if (result.type === 'not_found' || result.type === 'error') notFound()
  if (result.type === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-4xl">🔒</p>
          <h1 className="text-xl font-semibold">This catalog is temporarily unavailable</h1>
          <p className="text-sm text-gray-500">The business has paused their catalog. Please check back later.</p>
        </div>
      </div>
    )
  }
  return <CatalogView data={result.data} />
}
