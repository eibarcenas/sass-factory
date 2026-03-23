import { createEventStream } from 'h3'
import { getJob } from '../../../utils/job-store'

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!

  const eventStream = createEventStream(event)

  const interval = setInterval(async () => {
    const job = getJob(jobId)

    if (!job) {
      await eventStream.push(
        JSON.stringify({ type: 'error', message: 'Job not found' }),
        'error',
      )
      clearInterval(interval)
      await eventStream.close()
      return
    }

    // Push current state
    await eventStream.push(JSON.stringify(job), 'update')

    // Close stream when terminal state reached
    if (job.status === 'done' || job.status === 'error') {
      clearInterval(interval)
      // Give client a moment to process the final event
      setTimeout(async () => {
        await eventStream.push(JSON.stringify(job), 'done')
        await eventStream.close()
      }, 200)
    }
  }, 800)

  eventStream.onClosed(async () => {
    clearInterval(interval)
  })

  return eventStream.send()
})
