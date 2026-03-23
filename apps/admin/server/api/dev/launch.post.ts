import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { assignPort, readRegistry, writeRegistry, isProcessRunning } from '../../utils/dev-registry'

export default defineEventHandler(async (event) => {
  const { slug, appConfig } = await readBody(event)

  if (!slug) {
    throw createError({ statusCode: 400, message: 'slug is required' })
  }

  // Check if already running
  const registry = readRegistry()
  const existing = registry[slug]
  if (existing?.pid && isProcessRunning(existing.pid)) {
    return { port: existing.port, url: `http://localhost:${existing.port}`, isNew: false }
  }

  const port = assignPort(slug)
  const templateDir = resolve(process.cwd(), '../../apps/template')

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    APP_SLUG: slug,
    PORT: String(port),
    NUXT_PORT: String(port),
    // Pass mock config as JSON if provided
    ...(appConfig ? { APP_MOCK_CONFIG: JSON.stringify(appConfig) } : {}),
  }

  const child = spawn('pnpm', ['dev', '--port', String(port)], {
    cwd: templateDir,
    env,
    detached: true,
    stdio: 'ignore',
  })

  child.unref()

  // Save PID to registry
  const updated = readRegistry()
  updated[slug] = { port, pid: child.pid, startedAt: Date.now() }
  writeRegistry(updated)

  return { port, url: `http://localhost:${port}`, isNew: true, pid: child.pid }
})
