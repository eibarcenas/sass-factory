import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
})

export default defineNitroPlugin(() => {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    console.error('[startup] Environment validation failed:\n' + missing.join('\n'))
    // Only hard-fail in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }
})
