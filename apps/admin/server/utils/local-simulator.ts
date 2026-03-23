import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { createJob, updateJobStep, setJobResult, setJobError, type ProvisionJob } from './job-store'
import { writeDevConfig, assignPort } from './dev-registry'

const ROOT = resolve(process.cwd(), '../..')
const TEMPLATE_DIR = resolve(ROOT, 'apps/template')
const CONFIGS_DIR = resolve(ROOT, '.dev-configs')
const IMAGE = 'sass-factory/template:latest'

const STEPS: { key: string; label: string }[] = [
  { key: 'validate',     label: 'Checking Docker daemon' },
  { key: 'config_write', label: 'Writing app config' },
  { key: 'docker_build', label: 'Building Docker image' },
  { key: 'docker_run',   label: 'Starting container' },
  { key: 'health_check', label: 'Waiting for app to be ready' },
  { key: 'complete',     label: 'Done' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function exec(cmd: string, cwd?: string): Promise<string> {
  return new Promise((res, rej) => {
    const child = spawn('sh', ['-c', cmd], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let out = ''
    let err = ''
    child.stdout.on('data', (d: Buffer) => (out += d.toString()))
    child.stderr.on('data', (d: Buffer) => (err += d.toString()))
    child.on('exit', (code) =>
      code === 0 ? res(out.trim()) : rej(new Error(err.trim() || out.trim() || `exit ${code}`)),
    )
  })
}

async function waitForReady(url: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(2000) })
      if (r.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error(`App did not respond at ${url} within ${timeoutMs / 1000}s`)
}

async function step(
  jobId: string,
  key: string,
  fn: () => Promise<string | void>,
): Promise<boolean> {
  updateJobStep(jobId, key, 'running')
  try {
    const msg = await fn()
    updateJobStep(jobId, key, 'done', msg ?? undefined)
    return true
  } catch (e: any) {
    const msg = String(e.message ?? e).slice(0, 300)
    updateJobStep(jobId, key, 'error', msg)
    setJobError(jobId, msg)
    return false
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

export async function startLocalSimulation(options: {
  appId: string
  appName: string
  slug: string
  appConfig?: unknown
}): Promise<ProvisionJob> {
  const job = createJob(options.appId, options.appName, STEPS, 'simulate')

  setImmediate(async () => {
    // 1 ── Validate Docker
    const ok1 = await step(job.id, 'validate', async () => {
      const version = await exec('docker info --format "{{.ServerVersion}}"')
      return `Docker ${version}`
    })
    if (!ok1) return

    // 2 ── Write config file
    const ok2 = await step(job.id, 'config_write', async () => {
      writeDevConfig(options.slug, options.appConfig)
      return `Saved .dev-configs/${options.slug}.json`
    })
    if (!ok2) return

    // 3 ── Docker build
    const ok3 = await step(job.id, 'docker_build', async () => {
      // Check if image already exists to skip rebuild (use --pull for freshness in CI)
      try {
        await exec(`docker image inspect ${IMAGE} --format "{{.Id}}"`)
        return 'Image already built (skipped rebuild)'
      } catch {
        // Image not found — build it
        await exec(`docker build -t ${IMAGE} .`, TEMPLATE_DIR)
        return 'Image built successfully'
      }
    })
    if (!ok3) return

    // 4 ── Docker run
    const port = assignPort(options.slug)
    const containerName = `sass-${options.slug}`

    const ok4 = await step(job.id, 'docker_run', async () => {
      // Remove stale container
      await exec(`docker rm -f ${containerName}`).catch(() => {})

      await exec(
        [
          'docker run -d',
          `--name ${containerName}`,
          `-p ${port}:3000`,
          `-e APP_SLUG=${options.slug}`,
          `-e DEV_CONFIGS_DIR=/dev-configs`,
          `-v "${CONFIGS_DIR}:/dev-configs:ro"`,
          IMAGE,
        ].join(' '),
      )
      return `Container ${containerName} → port ${port}`
    })
    if (!ok4) return

    // 5 ── Health check
    const localUrl = `http://localhost:${port}`
    const ok5 = await step(job.id, 'health_check', async () => {
      await waitForReady(`${localUrl}/api/app-config`)
      return `Responding at ${localUrl}`
    })
    if (!ok5) return

    // 6 ── Complete
    await step(job.id, 'complete', async () => {
      setJobResult(job.id, { localUrl, containerName, port: String(port) })
      return localUrl
    })
  })

  return job
}
