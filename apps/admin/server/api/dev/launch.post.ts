import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import {
  assignPort,
  readRegistry,
  writeRegistry,
  isProcessRunning,
  writeDevConfig,
} from '../../utils/dev-registry'

export default defineEventHandler(async (event) => {
  const { slug, appConfig } = await readBody(event)

  if (!slug) {
    throw createError({ statusCode: 400, message: 'slug is required' })
  }

  // Write config file so template can read it (even before process starts)
  if (appConfig) {
    writeDevConfig(slug, appConfig)
  }

  // If already running, just return the URL (config file was already updated above)
  const registry = readRegistry()
  const existing = registry[slug]
  if (existing?.pid && isProcessRunning(existing.pid)) {
    return {
      port: existing.port,
      url: `http://localhost:${existing.port}`,
      isNew: false,
      configSynced: !!appConfig,
    }
  }

  const port = assignPort(slug)
  const templateDir = resolve(process.cwd(), '../../apps/template')

  // Only pass identity — config is read from .dev-configs/{slug}.json
  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    APP_SLUG: slug,
    PORT: String(port),
    NUXT_PORT: String(port),
  }

  const child = spawn('pnpm', ['dev', '--port', String(port)], {
    cwd: templateDir,
    env,
    detached: true,
    stdio: 'ignore',
  })

  child.unref()

  const updated = readRegistry()
  updated[slug] = { port, pid: child.pid, startedAt: Date.now() }
  writeRegistry(updated)

  return { port, url: `http://localhost:${port}`, isNew: true, pid: child.pid }
})
