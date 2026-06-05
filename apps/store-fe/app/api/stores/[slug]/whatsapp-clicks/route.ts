import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const apiUrl = process.env.STORES_API_URL ?? process.env.API_URL ?? 'http://localhost:8000'
  try {
    await fetch(`${apiUrl}/api/v1/stores/${slug}/whatsapp-clicks`, { method: 'POST' })
  } catch { /* fire-and-forget */ }
  return NextResponse.json({ ok: true })
}
