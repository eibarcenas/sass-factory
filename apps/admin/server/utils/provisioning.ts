import { createJob, updateJobStep, setJobResult, setJobError, type ProvisionJob } from './job-store'

interface ProvisionOptions {
  appId: string
  appName: string
  slug: string
  topic: string
  gcpProjectId: string
  region: string
  domain?: string
  firebaseProjectId?: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runStep(
  jobId: string,
  stepKey: string,
  fn: () => Promise<void>,
): Promise<boolean> {
  updateJobStep(jobId, stepKey, 'running')
  try {
    await fn()
    updateJobStep(jobId, stepKey, 'done')
    return true
  } catch (err: any) {
    updateJobStep(jobId, stepKey, 'error', err.message ?? 'Unknown error')
    setJobError(jobId, err.message ?? 'Unknown error')
    return false
  }
}

export async function startProvisioning(options: ProvisionOptions): Promise<ProvisionJob> {
  const job = createJob(options.appId, options.appName)

  // Run async in background (non-blocking)
  setImmediate(async () => {
    try {
      // Step 1: init
      const ok1 = await runStep(job.id, 'init', async () => {
        await sleep(800)
        // TODO: Validate GCP credentials, check project exists
      })
      if (!ok1) return

      // Step 2: firestore config
      const ok2 = await runStep(job.id, 'firestore_config', async () => {
        await sleep(1200)
        // TODO: Write AppConfig to Firestore using firebase-admin
        // const db = getFirestore()
        // await db.collection('apps').doc(options.appId).set({ ...config })
      })
      if (!ok2) return

      // Step 3: firebase hosting
      const ok3 = await runStep(job.id, 'firebase_hosting', async () => {
        await sleep(2000)
        // TODO: Call Firebase Management API to create hosting site
        // POST https://firebase.googleapis.com/v1beta1/projects/{projectId}/sites
      })
      if (!ok3) return

      // Step 4: cloud run
      const ok4 = await runStep(job.id, 'cloud_run', async () => {
        await sleep(3000)
        // TODO: Deploy to Cloud Run using gcloud SDK or REST API
        // gcloud run deploy sass-${slug} --image gcr.io/${project}/template:latest
      })
      if (!ok4) return

      // Step 5: domain (skip if no domain)
      if (options.domain) {
        const ok5 = await runStep(job.id, 'domain', async () => {
          await sleep(1500)
          // TODO: Add custom domain mapping to Firebase Hosting / Cloud Run
        })
        if (!ok5) return
      } else {
        updateJobStep(job.id, 'domain', 'skipped')
      }

      // Step 6: ssl
      const ok6 = await runStep(job.id, 'ssl', async () => {
        await sleep(2500)
        // TODO: Wait for SSL cert provisioning (Firebase does this automatically)
      })
      if (!ok6) return

      // Step 7: complete
      await runStep(job.id, 'complete', async () => {
        await sleep(500)
        setJobResult(job.id, {
          hostingUrl: `https://${options.slug}.web.app`,
          cloudRunUrl: `https://${options.slug}-${options.gcpProjectId}.${options.region}.run.app`,
          domain: options.domain,
        })
      })
    } catch (err: any) {
      setJobError(job.id, err.message ?? 'Unexpected error')
    }
  })

  return job
}
