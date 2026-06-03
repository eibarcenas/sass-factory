import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCatalog } from '@/lib/api'
import { BusinessStatus } from '@eguru/core'
import DemoGate from '@/components/DemoGate'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getCatalog(slug, true)
  if (!data) return { title: 'Vista previa' }
  return {
    title: `${data.name} — Vista previa`,
    description: data.tagline ?? '',
    // Prevent search engines from indexing preview pages
    robots: { index: false, follow: false },
  }
}

export default async function DemoPage({ params }: Props) {
  const { slug } = await params
  const data = await getCatalog(slug, true)

  if (!data) notFound()

  // Active business — redirect to public URL
  if (data.status === BusinessStatus.Active) redirect(`/${slug}`)

  return <DemoGate slug={slug} data={data} />
}
