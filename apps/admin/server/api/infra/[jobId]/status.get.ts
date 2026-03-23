import { getJob } from '~/server/utils/job-store'

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!
  const job = getJob(jobId)

  if (!job) {
    throw createError({ statusCode: 404, message: 'Job not found' })
  }

  return job
})
