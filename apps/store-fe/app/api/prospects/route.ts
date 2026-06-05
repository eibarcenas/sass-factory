import { NextRequest, NextResponse } from 'next/server'

// Server-side proxy — client sends to /api/prospects, this forwards to FastAPI
// Avoids NEXT_PUBLIC_API_URL issue (client can't read server-side env vars)
export async function POST(req: NextRequest) {
  const body = await req.json()

  const apiUrl = process.env.PROSPECTS_API_URL ?? process.env.API_URL ?? 'http://localhost:8000'

  try {
    const res = await fetch(`${apiUrl}/api/v1/prospects`, {
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
