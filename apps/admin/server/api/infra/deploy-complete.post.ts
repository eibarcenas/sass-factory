export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { appId, slug, projectId, cloudRunUrl, hostingUrl, deployedAt } = body

  // TODO: Update Firestore app document with deployed URLs
  // const db = getFirestore()
  // await db.collection('apps').doc(appId).update({
  //   'deployment.cloudRunUrl': cloudRunUrl,
  //   'deployment.hostingUrl': hostingUrl,
  //   'deployment.projectId': projectId,
  //   'deployment.deployedAt': deployedAt,
  //   status: 'active',
  // })

  console.log(`[deploy-complete] ${slug} → ${cloudRunUrl}`)

  return { ok: true }
})
