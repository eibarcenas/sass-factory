import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'

const REGISTRY_PATH = resolve(process.cwd(), '../../.dev-ports.json')
const CONFIGS_DIR = resolve(process.cwd(), '../../.dev-configs')
const BASE_PORT = 3010

export interface DevEntry {
  port: number
  pid?: number
  docker?: boolean
  startedAt: number
}

export type DevRegistry = Record<string, DevEntry>

function exec(cmd: string): Promise<string> {
  return new Promise((res, rej) => {
    const child = spawn('sh', ['-c', cmd], { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d: Buffer) => (out += d.toString()))
    child.on('exit', (code) => (code === 0 ? res(out.trim()) : rej(new Error(`exit ${code}`))))
  })
}

export function readRegistry(): DevRegistry {
  if (!existsSync(REGISTRY_PATH)) return {}
  try {
    return JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

export function writeRegistry(registry: DevRegistry) {
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2))
}

export function assignPort(slug: string): number {
  const registry = readRegistry()
  if (registry[slug]) return registry[slug].port

  const usedPorts = new Set(Object.values(registry).map((e) => e.port))
  let port = BASE_PORT
  while (usedPorts.has(port)) port++

  registry[slug] = { port, startedAt: Date.now() }
  writeRegistry(registry)
  return port
}

export function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

// ── Per-app config files (.dev-configs/{slug}.json) ─────────────────────────

export function writeDevConfig(slug: string, config: unknown): void {
  if (!existsSync(CONFIGS_DIR)) mkdirSync(CONFIGS_DIR, { recursive: true })
  writeFileSync(resolve(CONFIGS_DIR, `${slug}.json`), JSON.stringify(config, null, 2))
}

export function readDevConfig(slug: string): unknown | null {
  const path = resolve(CONFIGS_DIR, `${slug}.json`)
  if (!existsSync(path)) return null
  try { return JSON.parse(readFileSync(path, 'utf-8')) } catch { return null }
}

/** Prune entries where the process/container has stopped */
export async function pruneDeadProcesses(): Promise<DevRegistry> {
  const registry = readRegistry()
  let changed = false
  for (const [slug, entry] of Object.entries(registry)) {
    if (entry.docker) {
      try {
        const out = await exec(`docker ps --filter name=sass-${slug} --filter status=running -q`)
        if (!out.trim()) { delete registry[slug]; changed = true }
      } catch { delete registry[slug]; changed = true }
    } else if (entry.pid && !isProcessRunning(entry.pid)) {
      delete registry[slug]
      changed = true
    }
  }
  if (changed) writeRegistry(registry)
  return registry
}
