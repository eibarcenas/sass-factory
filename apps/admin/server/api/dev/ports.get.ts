import { pruneDeadProcesses } from '../../utils/dev-registry'

export default defineEventHandler(async () => {
  return await pruneDeadProcesses()
})
