import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AppConfig } from '@sass-factory/core'
import { TOPIC_PRESETS } from '@sass-factory/core'

function presetToConfig(slug: string): AppConfig | null {
  const preset = TOPIC_PRESETS[slug]
  if (!preset) return null
  return {
    id: `dev_${slug}`,
    topic: slug,
    name: preset.name,
    slug,
    status: 'active',
    theme: {
      primary: preset.primary ?? '#6366f1',
      secondary: preset.secondary ?? '#a5b4fc',
      accent: preset.accent ?? '#f59e0b',
      background: preset.background ?? '#ffffff',
      font: preset.font ?? 'Inter',
      emoji: preset.emoji ?? '✨',
      gradient: preset.gradient ?? ['#6366f1', '#8b5cf6'],
    },
    features: ['hero', 'gallery', 'timeline', 'letter', 'closing'],
    metadata: {
      title: preset.name,
      description: `${preset.emoji} ${preset.name} themed experience`,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export default defineEventHandler((): AppConfig => {
  const slug = process.env.APP_SLUG

  if (!slug) {
    throw createError({ statusCode: 400, message: 'APP_SLUG env var is not set' })
  }

  // 1. Try .dev-configs/{slug}.json — path is:
  //    - host: ../../.dev-configs  (relative to apps/template)
  //    - Docker: /dev-configs      (mounted via -v, set by DEV_CONFIGS_DIR)
  const configsDir = process.env.DEV_CONFIGS_DIR ?? resolve(process.cwd(), '../../.dev-configs')
  const configPath = resolve(configsDir, `${slug}.json`)
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, 'utf-8')) as AppConfig
    } catch {
      // fall through to preset
    }
  }

  // 2. Fallback: build from TOPIC_PRESETS
  const config = presetToConfig(slug)
  if (config) return config

  throw createError({
    statusCode: 404,
    message: `No config found for slug "${slug}". Create it in the admin panel first.`,
  })
})
