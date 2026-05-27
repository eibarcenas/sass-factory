import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { slug, ...body } = await req.json()

  if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 })

  const apiUrl = process.env.API_URL ?? 'http://localhost:8000'

  try {
    const res = await fetch(`${apiUrl}/api/v1/demos/${slug}/accept`, {
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
