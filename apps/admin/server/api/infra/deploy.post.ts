import { triggerBuild } from '../../utils/cloud-build'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)

  const {
    appId,
    slug,
    gcpOrgId,
    billingAccount,
    region = 'us-central1',
  } = body

  if (!appId || !slug || !gcpOrgId || !billingAccount) {
    throw createError({
      statusCode: 400,
      message: 'Required: appId, slug, gcpOrgId, billingAccount',
    })
  }

  const factoryProjectId = process.env.GCP_PROJECT_ID
  const factoryUrl = process.env.FACTORY_URL ?? `https://${process.env.K_SERVICE ?? 'localhost'}`
  const stateBucket = process.env.TF_STATE_BUCKET ?? `${factoryProjectId}-tf-state`

  // Derive a unique project ID: sass-{slug}-{timestamp suffix}
  const projectSuffix = Date.now().toString(36).slice(-5)
  const appProjectId = `sass-${slug.slice(0, 15)}-${projectSuffix}`

  let build: any
  try {
    build = await triggerBuild(factoryProjectId!, {
      _SLUG: slug,
      _APP_ID: appId,
      _APP_PROJECT_ID: appProjectId,
      _BILLING_ACCOUNT: billingAccount,
      _ORG_ID: gcpOrgId,
      _REGION: region,
      _FACTORY_PROJECT_ID: factoryProjectId!,
      _FACTORY_URL: factoryUrl,
      _STATE_BUCKET: stateBucket,
    })
  } catch (err: any) {
    throw createError({ statusCode: 502, message: err.message })
  }

  const buildId = build.id ?? build.name?.split('/').pop()

  return {
    buildId,
    appProjectId,
    logUrl: build.logUrl,
    status: build.status ?? 'QUEUED',
  }
})
