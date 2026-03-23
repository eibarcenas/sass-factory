export default defineEventHandler(async (event) => {
  // TODO: Query Firestore infra_environments collection
  // For now return empty array - real impl uses firebase-admin
  return { environments: [] }
})
