import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStoreResult } from '@/lib/api'
import StoreView from '@/components/StoreView'
import MaintenancePage from '@/components/MaintenancePage'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const result = await getStoreResult(slug)
  if (result.type === 'ok') {
    return {
      title: result.data.name,
      description: result.data.tagline ?? `${result.data.name} — catalog.mx`,
      openGraph: { title: result.data.name, description: result.data.tagline ?? '' },
    }
  }
  // Use business name for maintenance/suspended — neutral, doesn't expose status
  const name = result.type === 'inactive' ? result.name : undefined
  return { title: name ?? 'catalog.mx' }
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params
  const result = await getStoreResult(slug)

  if (result.type === 'not_found' || result.type === 'error') notFound()

  // Any non-active status shows the maintenance page — no status exposed to the visitor
  if (result.type === 'suspended' || result.type === 'inactive') {
    return <MaintenancePage name={result.type === 'inactive' ? result.name : undefined} />
  }

  return <StoreView data={result.data} />
}
