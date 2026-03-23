#!/usr/bin/env node
/**
 * Runs as the final Cloud Build step.
 * POSTs result to SASS Factory API so it can update Firestore + close SSE.
 */

const {
  APP_ID,
  APP_SLUG,
  APP_PROJECT_ID,
  REGION,
  FACTORY_URL,
} = process.env

if (!FACTORY_URL || !APP_ID) {
  console.error('Missing FACTORY_URL or APP_ID')
  process.exit(1)
}

const cloudRunUrl = `https://${APP_SLUG}-${APP_PROJECT_ID.replace(/-/g, '')}.${REGION}.run.app`
const hostingUrl  = `https://${APP_PROJECT_ID}.web.app`

const body = JSON.stringify({
  appId:       APP_ID,
  slug:        APP_SLUG,
  projectId:   APP_PROJECT_ID,
  cloudRunUrl,
  hostingUrl,
  deployedAt:  new Date().toISOString(),
})

const res = await fetch(`${FACTORY_URL}/api/infra/deploy-complete`, {
  method:  'POST',
  headers: { 'Content-Type': 'application/json' },
  body,
})

if (!res.ok) {
  console.error('Failed to notify factory:', await res.text())
  process.exit(1)
}

console.log('Notified factory. Deploy complete!')
console.log(`  Cloud Run: ${cloudRunUrl}`)
console.log(`  Hosting:   ${hostingUrl}`)
