async function getAuthToken(): Promise<string> {
  const { GoogleAuth } = await import('google-auth-library')
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] })
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  return token.token!
}

export interface BuildSubstitutions {
  _SLUG: string
  _APP_ID: string
  _APP_PROJECT_ID: string
  _BILLING_ACCOUNT: string
  _ORG_ID: string
  _REGION: string
  _FACTORY_PROJECT_ID: string
  _FACTORY_URL: string
  _STATE_BUCKET: string
}

export interface CloudBuildStep {
  id: string
  name: string
  status: 'STATUS_UNKNOWN' | 'PENDING' | 'QUEUED' | 'WORKING' | 'SUCCESS' | 'FAILURE' | 'CANCELLED'
  startTime?: string
  endTime?: string
}

export interface CloudBuild {
  id: string
  status: 'STATUS_UNKNOWN' | 'PENDING' | 'QUEUED' | 'WORKING' | 'SUCCESS' | 'FAILURE' | 'CANCELLED' | 'INTERNAL_ERROR' | 'TIMEOUT'
  steps: CloudBuildStep[]
  createTime: string
  startTime?: string
  finishTime?: string
  logUrl?: string
}

export async function triggerBuild(
  factoryProjectId: string,
  substitutions: BuildSubstitutions,
): Promise<CloudBuild> {
  const token = await getAuthToken()

  const res = await fetch(
    `https://cloudbuild.googleapis.com/v1/projects/${factoryProjectId}/builds`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: {
          repoSource: {
            projectId: factoryProjectId,
            repoName: process.env.CLOUD_BUILD_REPO ?? 'sass-factory',
            branchName: 'main',
          },
        },
        filename: 'infrastructure/cloudbuild/deploy-app.yaml',
        substitutions,
      }),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Cloud Build API error: ${res.status} ${err}`)
  }

  // The API returns a long-running operation; poll for the build ID
  const operation = await res.json() as any
  // Operation name: projects/{project}/operations/{op}
  // Extract build from metadata
  return operation.metadata?.build as CloudBuild ?? operation
}

export async function getBuild(
  factoryProjectId: string,
  buildId: string,
): Promise<CloudBuild> {
  const token = await getAuthToken()

  const res = await fetch(
    `https://cloudbuild.googleapis.com/v1/projects/${factoryProjectId}/builds/${buildId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )

  if (!res.ok) throw new Error(`Cloud Build GET error: ${res.status}`)
  return res.json() as Promise<CloudBuild>
}
