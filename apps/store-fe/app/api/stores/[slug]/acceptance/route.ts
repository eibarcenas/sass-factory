import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const body = await req.json()
  const apiUrl = process.env.STORES_API_URL ?? process.env.API_URL ?? 'http://localhost:8000'

  try {
    const res = await fetch(`${apiUrl}/api/v1/stores/${slug}/acceptance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
