import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { slug } = await req.json()
  if (!slug) return NextResponse.json({ ok: false })
  const apiUrl = process.env.CATALOG_API_URL ?? process.env.API_URL ?? 'http://localhost:8000'
  try {
    await fetch(`${apiUrl}/api/v1/storefront/${slug}/whatsapp-click`, { method: 'POST' })
  } catch { /* fire-and-forget */ }
  return NextResponse.json({ ok: true })
}
