import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Business } from '@sass-factory/core'

export default defineEventHandler((): Business => {
  const slug = process.env.APP_SLUG

  if (!slug) {
    throw createError({ statusCode: 400, message: 'APP_SLUG env var is not set' })
  }

  // Try .dev-configs/{slug}.json — path is:
  //    - host: ../../.dev-configs  (relative to apps/template)
  //    - Docker: /dev-configs      (mounted via -v, set by DEV_CONFIGS_DIR)
  const configsDir = process.env.DEV_CONFIGS_DIR ?? resolve(process.cwd(), '../../.dev-configs')
  const configPath = resolve(configsDir, `${slug}.json`)
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, 'utf-8')) as Business
    } catch {
      // fall through to error
    }
  }

  throw createError({
    statusCode: 404,
    message: `No config found for slug "${slug}". Create it in the admin panel first.`,
  })
})
