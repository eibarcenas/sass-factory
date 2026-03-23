import { startLocalSimulation } from '../../utils/local-simulator'

export default defineEventHandler(async (event) => {
  const { appId, appName, slug, appConfig } = await readBody(event)

  if (!appId || !slug) {
    throw createError({ statusCode: 400, message: 'appId and slug are required' })
  }

  const job = await startLocalSimulation({
    appId,
    appName: appName ?? slug,
    slug,
    appConfig,
  })

  return { jobId: job.id, status: job.status, steps: job.steps }
})
