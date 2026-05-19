import { spawn } from 'node:child_process'
import * as k8s from '@kubernetes/client-node'
import { createJob, updateJobStep, setJobResult, setJobError, type ProvisionJob } from './job-store'
import { writeDevConfig, assignPort } from './dev-registry'

const IMAGE_TEMPLATE = 'sass-factory/template:latest'
const NAMESPACE = 'default'
const CLUSTER_NAME = 'sass-factory'

const STEPS: { key: string; label: string }[] = [
  { key: 'validate',     label: 'Connecting to k8s cluster' },
  { key: 'config_write', label: 'Writing app config' },
  { key: 'image_build',  label: 'Building & loading template image' },
  { key: 'configmap',    label: 'Applying ConfigMap' },
  { key: 'deploy',       label: 'Deploying to Kubernetes' },
  { key: 'service',      label: 'Exposing NodePort Service' },
  { key: 'health_check', label: 'Waiting for app to be ready' },
  { key: 'complete',     label: 'Done' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function exec(cmd: string): Promise<string> {
  return new Promise((res, rej) => {
    const child = spawn('sh', ['-c', cmd], { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (d: Buffer) => (out += d.toString()))
    child.stderr.on('data', (d: Buffer) => (err += d.toString()))
    child.on('exit', (code) =>
      code === 0 ? res(out.trim()) : rej(new Error(err.trim() || out.trim() || `exit ${code}`)),
    )
  })
}

async function waitForReady(url: string, timeoutMs = 90_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(2000) })
      if (r.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 2000))
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

function getK8sClients() {
  const kc = new k8s.KubeConfig()
  kc.loadFromCluster()
  return {
    appsApi: kc.makeApiClient(k8s.AppsV1Api),
    coreApi: kc.makeApiClient(k8s.CoreV1Api),
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

export async function startK8sSimulation(options: {
  appId: string
  appName: string
  slug: string
  appConfig?: unknown
}): Promise<ProvisionJob> {
  const job = createJob(options.appId, options.appName, STEPS, 'simulate')

  setImmediate(async () => {
    const { appsApi, coreApi } = getK8sClients()
    const deploymentName = `sass-${options.slug}`
    const serviceName = `sass-${options.slug}`

    // 1 ── Validate cluster connection
    const ok1 = await step(job.id, 'validate', async () => {
      await coreApi.listNamespace()
      return `Connected to cluster ${CLUSTER_NAME}`
    })
    if (!ok1) return

    // 2 ── Write config file
    const ok2 = await step(job.id, 'config_write', async () => {
      writeDevConfig(options.slug, options.appConfig)
      return `Saved .dev-configs/${options.slug}.json`
    })
    if (!ok2) return

    // 3 ── Build template image + load into kind
    const ok3 = await step(job.id, 'image_build', async () => {
      try {
        await exec(`docker image inspect ${IMAGE_TEMPLATE} --format "{{.Id}}"`)
      } catch {
        const root = process.cwd().replace(/\/apps\/admin.*/, '')
        await exec(`docker build -t ${IMAGE_TEMPLATE} ${root}/apps/template`)
      }
      await exec(`kind load docker-image ${IMAGE_TEMPLATE} --name ${CLUSTER_NAME}`)
      return `Image loaded into kind cluster`
    })
    if (!ok3) return

    // 4 ── Apply ConfigMap with app config JSON
    const configJson = JSON.stringify(options.appConfig ?? {})
    const ok4 = await step(job.id, 'configmap', async () => {
      const configMapBody: k8s.V1ConfigMap = {
        metadata: { name: `sass-${options.slug}-config`, namespace: NAMESPACE },
        data: { [`${options.slug}.json`]: configJson },
      }
      try {
        await coreApi.replaceNamespacedConfigMap(
          `sass-${options.slug}-config`, NAMESPACE, configMapBody,
        )
      } catch {
        await coreApi.createNamespacedConfigMap(NAMESPACE, configMapBody)
      }
      return `ConfigMap sass-${options.slug}-config applied`
    })
    if (!ok4) return

    // 5 ── Deploy
    const port = assignPort(options.slug)
    const ok5 = await step(job.id, 'deploy', async () => {
      const deployment: k8s.V1Deployment = {
        metadata: { name: deploymentName, namespace: NAMESPACE, labels: { app: deploymentName } },
        spec: {
          replicas: 1,
          selector: { matchLabels: { app: deploymentName } },
          template: {
            metadata: { labels: { app: deploymentName } },
            spec: {
              containers: [{
                name: 'template',
                image: IMAGE_TEMPLATE,
                imagePullPolicy: 'Never',
                ports: [{ containerPort: 3000 }],
                env: [
                  { name: 'APP_SLUG', value: options.slug },
                  { name: 'DEV_CONFIGS_DIR', value: '/dev-configs' },
                ],
                volumeMounts: [{ name: 'config', mountPath: '/dev-configs' }],
                readinessProbe: {
                  httpGet: { path: '/api/app-config', port: 3000 as unknown as object },
                  initialDelaySeconds: 5,
                  periodSeconds: 3,
                },
              }],
              volumes: [{
                name: 'config',
                configMap: { name: `sass-${options.slug}-config` },
              }],
            },
          },
        },
      }
      try {
        await appsApi.replaceNamespacedDeployment(deploymentName, NAMESPACE, deployment)
        return `Deployment ${deploymentName} updated`
      } catch {
        await appsApi.createNamespacedDeployment(NAMESPACE, deployment)
        return `Deployment ${deploymentName} created`
      }
    })
    if (!ok5) return

    // 6 ── NodePort Service (nodePort = port + 27000, so 3010 → 30010)
    const nodePort = port + 27000
    const ok6 = await step(job.id, 'service', async () => {
      const service: k8s.V1Service = {
        metadata: { name: serviceName, namespace: NAMESPACE },
        spec: {
          type: 'NodePort',
          selector: { app: deploymentName },
          ports: [{ port: 3000, targetPort: 3000 as unknown as object, nodePort }],
        },
      }
      try {
        await coreApi.replaceNamespacedService(serviceName, NAMESPACE, service)
        return `Service ${serviceName} updated (NodePort ${nodePort})`
      } catch {
        await coreApi.createNamespacedService(NAMESPACE, service)
        return `Service ${serviceName} created (NodePort ${nodePort} → localhost:${port})`
      }
    })
    if (!ok6) return

    // 7 ── Health check
    const localUrl = `http://localhost:${port}`
    const ok7 = await step(job.id, 'health_check', async () => {
      await waitForReady(`${localUrl}/api/app-config`)
      return `Responding at ${localUrl}`
    })
    if (!ok7) return

    // 8 ── Complete
    await step(job.id, 'complete', async () => {
      setJobResult(job.id, {
        localUrl,
        deploymentName,
        nodePort: String(nodePort),
        port: String(port),
      })
      return localUrl
    })
  })

  return job
}
