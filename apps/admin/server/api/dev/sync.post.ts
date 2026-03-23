import { writeDevConfig, readRegistry, isProcessRunning } from '../../utils/dev-registry'

export default defineEventHandler(async (event) => {
  const { slug, appConfig } = await readBody(event)

  if (!slug || !appConfig) {
    throw createError({ statusCode: 400, message: 'slug and appConfig are required' })
  }

  // Write updated config — running template will pick it up on next request
  writeDevConfig(slug, appConfig)

  const registry = readRegistry()
  const entry = registry[slug]
  const running = !!(entry?.pid && isProcessRunning(entry.pid))

  return {
    ok: true,
    running,
    url: running ? `http://localhost:${entry.port}` : null,
  }
})
