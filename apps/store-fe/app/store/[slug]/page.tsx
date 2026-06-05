import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getStore } from '@/lib/api'
import { BusinessStatus } from '@eguru/core'
import StoreReviewGate from '@/components/StoreReviewGate'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getStore(slug, true)
  if (!data) return { title: 'Store review' }
  return {
    title: `${data.name} — Store review`,
    description: data.tagline ?? '',
    // Prevent search engines from indexing preview pages
    robots: { index: false, follow: false },
  }
}

export default async function StoreReviewPage({ params }: Props) {
  const { slug } = await params
  const data = await getStore(slug, true)

  if (!data) notFound()

  // Active business — redirect to public URL
  if (data.status === BusinessStatus.Active) redirect(`/${slug}`)

  return <StoreReviewGate slug={slug} data={data} />
}
