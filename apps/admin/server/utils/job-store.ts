export type StepStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped'

export interface JobStep {
  key: string   // generic — each runner defines its own step keys
  label: string
  status: StepStatus
  message?: string
  startedAt?: number
  completedAt?: number
}

export interface ProvisionJob {
  id: string
  appId: string
  appName: string
  mode: 'provision' | 'simulate' | 'gcp'
  status: 'queued' | 'running' | 'done' | 'error'
  steps: JobStep[]
  createdAt: number
  updatedAt: number
  result?: Record<string, string>
  error?: string
}

// In-memory store (shared within server process)
const jobs = new Map<string, ProvisionJob>()

// Default steps for the fake provisioner (kept for backward compat)
export const PROVISION_STEPS: Omit<JobStep, 'status'>[] = [
  { key: 'init',             label: 'Initializing project' },
  { key: 'firestore_config', label: 'Writing Firestore config' },
  { key: 'firebase_hosting', label: 'Creating Firebase Hosting site' },
  { key: 'cloud_run',        label: 'Deploying to Cloud Run' },
  { key: 'domain',           label: 'Configuring domain' },
  { key: 'ssl',              label: 'Provisioning SSL certificate' },
  { key: 'complete',         label: 'Finalizing' },
]

export function createJob(
  appId: string,
  appName: string,
  steps: Omit<JobStep, 'status'>[] = PROVISION_STEPS,
  mode: ProvisionJob['mode'] = 'provision',
): ProvisionJob {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const job: ProvisionJob = {
    id,
    appId,
    appName,
    mode,
    status: 'queued',
    steps: steps.map((s) => ({ ...s, status: 'pending' })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  jobs.set(id, job)
  return job
}

export function getJob(jobId: string): ProvisionJob | undefined {
  return jobs.get(jobId)
}

export function updateJobStep(
  jobId: string,
  stepKey: string,
  status: StepStatus,
  message?: string,
): ProvisionJob | undefined {
  const job = jobs.get(jobId)
  if (!job) return undefined

  const step = job.steps.find((s) => s.key === stepKey)
  if (step) {
    step.status = status
    if (message) step.message = message
    if (status === 'running') step.startedAt = Date.now()
    if (status === 'done' || status === 'error') step.completedAt = Date.now()
  }

  const allDone = job.steps.every((s) => s.status === 'done' || s.status === 'skipped')
  const anyError = job.steps.some((s) => s.status === 'error')

  job.status = anyError ? 'error' : allDone ? 'done' : 'running'
  job.updatedAt = Date.now()
  jobs.set(jobId, job)
  return job
}

export function setJobResult(jobId: string, result: Record<string, string>) {
  const job = jobs.get(jobId)
  if (!job) return
  job.result = result
  job.updatedAt = Date.now()
  jobs.set(jobId, job)
}

export function setJobError(jobId: string, error: string) {
  const job = jobs.get(jobId)
  if (!job) return
  job.status = 'error'
  job.error = error
  job.updatedAt = Date.now()
  jobs.set(jobId, job)
}
