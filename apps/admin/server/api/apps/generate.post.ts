import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a landing page configurator for SASS Factory, a platform that creates themed web experiences for any business or occasion.

Given a business description or prompt in ANY language, generate a complete AppConfig JSON object for a beautiful themed landing page. Respond ONLY with valid JSON — no markdown, no code fences, no explanation.

The JSON must follow this exact structure:
{
  "id": "url-safe-slug",
  "topic": "business-category-slug",
  "name": "Display Name (in the same language as the prompt)",
  "slug": "url-safe-slug",
  "theme": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor",
    "accent": "#hexcolor",
    "background": "#hexcolor",
    "font": "Google Font Name",
    "emoji": "single emoji",
    "gradient": ["#hexcolor1", "#hexcolor2"]
  },
  "features": ["hero", "gallery", "closing"],
  "status": "draft",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "title": "Page title (in the same language as the prompt)",
    "description": "One-sentence meta description (in the same language as the prompt)"
  }
}

Available features (pick 3–6 that make sense for the business):
- hero       → opening banner with tagline
- timeline   → story / milestones
- gallery    → photo grid
- letter     → personal message
- feed       → social feed
- moments    → user contributions
- music      → background music player
- countdown  → countdown to date
- closing    → final CTA section

Color & font guidelines:
- Mechanic / industrial → steel blues, charcoal, dark grays; Oswald or Barlow
- Bakery / food → warm creams, golden amber, burnt orange; Pacifico or Quicksand
- Blacksmith / artisan → earth tones, rust, dark brown; Cinzel or Libre Baskerville
- Tech / software → indigo, cyan, dark navy; Inter or Space Grotesk
- Beauty / salon → rose gold, blush pink, ivory; Cormorant Garamond or Raleway
- Restaurant → deep red, warm white, olive green; Playfair Display or Lora
- Gym / fitness → electric blue, black, neon green; Bebas Neue or Exo 2

Rules:
- slug must be URL-safe (lowercase, hyphens only, no accents, max 40 chars)
- id equals slug
- title and description must be in the SAME language as the input prompt
- emoji must be a single character that visually represents the business
- createdAt and updatedAt must be valid ISO 8601 strings`

export default defineEventHandler(async (event) => {
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
    const config = JSON.parse(accumulated)
    const now = new Date().toISOString()
    config.createdAt = now
    config.updatedAt = now
    // Ensure id === slug
    config.id = config.slug

    send('done', { config })
  } catch (err: any) {
    // JSON parse failure or API error
    const msg = err.message ?? 'Generation failed'
    send('error', { error: msg })
  } finally {
    event.node.res.end()
  }
})
