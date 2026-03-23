import { startProvisioning } from '~/server/utils/provisioning'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const {
    appId,
    appName,
    slug,
    topic,
    gcpProjectId,
    region = 'us-central1',
    domain,
    firebaseProjectId,
  } = body

  if (!appId || !appName || !slug || !gcpProjectId) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: appId, appName, slug, gcpProjectId',
    })
  }

  const job = await startProvisioning({
    appId,
    appName,
    slug,
    topic,
    gcpProjectId,
    region,
    domain,
    firebaseProjectId,
  })

  return {
    jobId: job.id,
    status: job.status,
    steps: job.steps,
  }
})
