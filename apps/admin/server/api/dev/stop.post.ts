import { readRegistry, writeRegistry, isProcessRunning } from '../../utils/dev-registry'

export default defineEventHandler(async (event) => {
  const { slug } = await readBody(event)
  if (!slug) throw createError({ statusCode: 400, message: 'slug is required' })

  const registry = readRegistry()
  const entry = registry[slug]
  if (!entry) throw createError({ statusCode: 404, message: 'No dev server for this slug' })

  if (entry.pid && isProcessRunning(entry.pid)) {
    try {
      process.kill(-entry.pid, 'SIGTERM')
    } catch {
      try { process.kill(entry.pid, 'SIGTERM') } catch {}
    }
  }

  delete registry[slug]
  writeRegistry(registry)

  return { ok: true }
})
