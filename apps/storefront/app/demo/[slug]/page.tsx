import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCatalog } from '@/lib/api'
import CatalogView from '@/components/CatalogView'
import { BusinessStatus } from '@catalog-mx/core'

type Props = { params: Promise<{ slug: string }> }

const LIVE_STATUSES = [BusinessStatus.Accepted, BusinessStatus.Active]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getCatalog(slug, true)
  if (!data) return { title: 'Demo' }
  return { title: `${data.name} — Demo`, description: data.tagline ?? '' }
}

export default async function DemoPage({ params }: Props) {
  const { slug } = await params
  const data = await getCatalog(slug, true)
  if (!data) notFound()
  if (LIVE_STATUSES.includes(data.status)) redirect(`/${slug}`)
  return <CatalogView data={data} isDemo />
}
