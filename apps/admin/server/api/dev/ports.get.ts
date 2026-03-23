import { pruneDeadProcesses } from '../../utils/dev-registry'

export default defineEventHandler(() => {
  return pruneDeadProcesses()
})
