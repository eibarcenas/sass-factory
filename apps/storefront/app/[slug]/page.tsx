import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCatalog } from '@/lib/api'
import CatalogView from '@/components/CatalogView'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getCatalog(slug)
  if (!data) return { title: 'Not found' }
  return {
    title: data.name,
    description: data.tagline ?? `${data.name} — catalog.mx`,
    openGraph: { title: data.name, description: data.tagline ?? '' },
  }
}

export default async function CatalogPage({ params }: Props) {
  const { slug } = await params
  const data = await getCatalog(slug)
  if (!data) notFound()
  return <CatalogView data={data} />
}
