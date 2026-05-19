import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '~/server/middleware/auth'
import { checkAiGenerateLimit } from '~/server/middleware/rate-limit'
import { writeDevConfig } from '~/server/utils/dev-registry'
import { logger } from '@sass-factory/core'

const SYSTEM_PROMPT = `You are a catalog demo generator for a SaaS platform that helps small businesses show their products online.

Given a business description in ANY language, generate a complete Business JSON object for a catalog demo. Respond ONLY with valid JSON — no markdown, no code fences, no explanation.

The JSON must follow this exact structure:
{
  "id": "url-safe-slug",
  "slug": "url-safe-slug",
  "name": "Business Display Name",
  "type": "heladeria|barberia|estetica|restaurante|panaderia|gym|mecanico|otro",
  "whatsapp": "+521234567890",
  "city": "Ciudad",
  "tagline": "One-line tagline for the business",
  "theme": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor",
    "accent": "#hexcolor",
    "background": "#hexcolor",
    "font": "Google Font Name",
    "emoji": "single emoji",
    "gradient": ["#hexcolor1", "#hexcolor2"]
  },
  "status": "demo",
  "plan": "free",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "items": [
    {
      "id": "item-slug-1",
      "name": "Product name",
      "price": 99,
      "currency": "MXN",
      "description": "Short description",
      "visible": true,
      "order": 1
    }
  ]
}

Generate 3-5 sample items appropriate for the business type.

Color guidelines by business type:
- heladeria → cyan, light blue, white; Quicksand or Nunito
- barberia → dark charcoal, gold, white; Oswald or Barlow
- estetica → rose gold, blush pink, ivory; Cormorant Garamond or Raleway
- restaurante → deep red, warm white, olive; Playfair Display or Lora
- panaderia → warm cream, golden amber, brown; Pacifico or Quicksand
- gym → electric blue, black, neon; Bebas Neue or Exo 2
- mecanico → steel blue, charcoal, orange; Oswald or Barlow
- otro → match the description tone

Rules:
- slug must be URL-safe (lowercase, hyphens only, max 40 chars)
- id equals slug
- whatsapp must be in E.164 format: +52XXXXXXXXXX (use placeholder +521234567890 if not provided)
- emoji must represent the business visually
- items must be realistic for the business type and region (Mexican market, prices in MXN)
- tagline in the same language as the input`

export default defineEventHandler(async (event) => {
  await requireAuth(event, { requiredRole: 'admin' })
  checkAiGenerateLimit(event.context.user!.uid)

  const { prompt } = await readBody(event)

  if (!prompt?.trim()) {
    throw createError({ statusCode: 400, message: 'prompt is required' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY is not configured' })
  }

  // Set SSE headers manually — we're streaming a POST response
  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')
  setResponseHeader(event, 'X-Accel-Buffering', 'no')

  const client = new Anthropic({ apiKey })

  const send = (eventName: string, data: unknown) => {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
    return event.node.res.write(payload)
  }

  let accumulated = ''

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt.trim() }],
    })

    for await (const ev of stream) {
      if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
        accumulated += ev.delta.text
        send('delta', { text: ev.delta.text })
      }
    }

    // Parse and stamp timestamps
    const business = JSON.parse(accumulated)
    const now = new Date().toISOString()
    business.createdAt = now
    business.updatedAt = now
    // Ensure id === slug
    business.id = business.slug

    // Persist to .dev-configs/{slug}.json so the storefront can serve it
    writeDevConfig(business.slug, business)
    logger.info('demo generated and persisted', { slug: business.slug })

    send('done', { config: business })
  } catch (err: any) {
    // JSON parse failure or API error
    const msg = err.message ?? 'Generation failed'
    send('error', { error: msg })
  } finally {
    event.node.res.end()
  }
})
