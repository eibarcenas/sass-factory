import { createEventStream } from 'h3'
import { getBuild } from '../../../utils/cloud-build'

const STEP_LABELS: Record<string, string> = {
  'tf-init':           'Terraform: init',
  'tf-apply':          'Creating GCP project',
  'docker-build':      'Building Docker image',
  'docker-push':       'Pushing to Artifact Registry',
  'cloud-run-deploy':  'Deploying to Cloud Run',
  'notify-complete':   'Finalizing',
}

export default defineEventHandler(async (event) => {
  const buildId = getRouterParam(event, 'buildId')!
  const factoryProjectId = process.env.GCP_PROJECT_ID!

  const eventStream = createEventStream(event)

  const interval = setInterval(async () => {
    try {
      const build = await getBuild(factoryProjectId, buildId)

      const payload = {
        buildId:    build.id,
        status:     build.status,
        logUrl:     build.logUrl,
        steps: (build.steps ?? []).map((s) => ({
          id:         s.id,
          label:      STEP_LABELS[s.id] ?? s.id,
          status:     s.status,
          startTime:  s.startTime,
          endTime:    s.endTime,
        })),
      }

      await eventStream.push(JSON.stringify(payload), 'update')

      const terminal = ['SUCCESS', 'FAILURE', 'CANCELLED', 'TIMEOUT', 'INTERNAL_ERROR']
      if (terminal.includes(build.status)) {
        clearInterval(interval)
        setTimeout(async () => {
          await eventStream.push(JSON.stringify(payload), 'done')
          await eventStream.close()
        }, 300)
      }
    } catch (err: any) {
      await eventStream.push(JSON.stringify({ error: err.message }), 'error')
      clearInterval(interval)
      await eventStream.close()
    }
  }, 2000)

  eventStream.onClosed(() => clearInterval(interval))
  return eventStream.send()
})
