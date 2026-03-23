#!/usr/bin/env node
/**
 * Usage:
 *   pnpm dev:app <slug>          # start a dev server for an app
 *   pnpm dev:app list            # list all running dev servers
 *   pnpm dev:app stop <slug>     # stop a dev server
 *
 * Each app gets a stable port starting at 3010, saved in .dev-ports.json
 */

import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '../..')
const REGISTRY = resolve(ROOT, '.dev-ports.json')
const CONFIGS_DIR = resolve(ROOT, '.dev-configs')
const TEMPLATE_DIR = resolve(ROOT, 'apps/template')
const BASE_PORT = 3010

// Inline TOPIC_PRESETS so the CLI has no build step
const PRESETS = {
  love:  { name: "Valentine's Day", emoji: '❤️',  primary: '#e11d48', secondary: '#fda4af', accent: '#fb7185', background: '#fff1f2', font: 'Playfair Display', gradient: ['#fda4af','#e11d48'] },
  reyes: { name: 'Reyes Magos',     emoji: '⭐',  primary: '#7c3aed', secondary: '#c4b5fd', accent: '#f59e0b', background: '#1e1b4b', font: 'Cinzel',           gradient: ['#7c3aed','#f59e0b'] },
  mom:   { name: "Mother's Day",    emoji: '🌸',  primary: '#db2777', secondary: '#fbcfe8', accent: '#86efac', background: '#fdf2f8', font: 'Lora',             gradient: ['#fbcfe8','#db2777'] },
  dad:   { name: "Father's Day",    emoji: '👔',  primary: '#1d4ed8', secondary: '#bfdbfe', accent: '#64748b', background: '#eff6ff', font: 'Merriweather',     gradient: ['#bfdbfe','#1d4ed8'] },
  bday:  { name: 'Birthday',        emoji: '🎂',  primary: '#7c3aed', secondary: '#ddd6fe', accent: '#f59e0b', background: '#faf5ff', font: 'Nunito',           gradient: ['#ddd6fe','#f59e0b'] },
  xmas:  { name: 'Christmas',       emoji: '🎄',  primary: '#15803d', secondary: '#bbf7d0', accent: '#ef4444', background: '#f0fdf4', font: 'Mountains of Christmas', gradient: ['#15803d','#ef4444'] },
}

function writeConfig(slug) {
  if (!existsSync(CONFIGS_DIR)) mkdirSync(CONFIGS_DIR, { recursive: true })
  const cfgPath = resolve(CONFIGS_DIR, `${slug}.json`)

  // Only build from preset if no config file exists yet
  if (!existsSync(cfgPath)) {
    const preset = PRESETS[slug]
    if (preset) {
      const config = {
        id: `dev_${slug}`, topic: slug, name: preset.name, slug, status: 'active',
        theme: { primary: preset.primary, secondary: preset.secondary, accent: preset.accent,
          background: preset.background, font: preset.font, emoji: preset.emoji, gradient: preset.gradient },
        features: ['hero', 'gallery', 'timeline', 'letter', 'closing'],
        metadata: { title: preset.name, description: `${preset.emoji} ${preset.name} themed experience` },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      writeFileSync(cfgPath, JSON.stringify(config, null, 2))
      console.log(`  ✓ Config written → .dev-configs/${slug}.json`)
    } else {
      console.log(`  ⚠ No preset for "${slug}". Create config in admin panel first.`)
    }
  } else {
    console.log(`  ✓ Config exists → .dev-configs/${slug}.json`)
  }
}

// ── Registry helpers ────────────────────────────────────────────────────────

function read() {
  if (!existsSync(REGISTRY)) return {}
  try { return JSON.parse(readFileSync(REGISTRY, 'utf-8')) } catch { return {} }
}

function save(reg) {
  writeFileSync(REGISTRY, JSON.stringify(reg, null, 2))
}

function alive(pid) {
  if (!pid) return false
  try { process.kill(pid, 0); return true } catch { return false }
}

function prune(reg) {
  let changed = false
  for (const [slug, e] of Object.entries(reg)) {
    if (e.pid && !alive(e.pid)) { delete reg[slug]; changed = true }
  }
  if (changed) save(reg)
  return reg
}

function nextPort(reg) {
  const used = new Set(Object.values(reg).map(e => e.port))
  let p = BASE_PORT
  while (used.has(p)) p++
  return p
}

// ── Commands ────────────────────────────────────────────────────────────────

const [,, cmd, ...args] = process.argv

if (cmd === 'list') {
  const reg = prune(read())
  const entries = Object.entries(reg)
  if (entries.length === 0) {
    console.log('No dev servers running.')
  } else {
    console.log('\n  Running dev servers:\n')
    for (const [slug, e] of entries) {
      const status = alive(e.pid) ? '🟢' : '🔴'
      console.log(`  ${status}  ${slug.padEnd(20)} http://localhost:${e.port}  (pid ${e.pid ?? '?'})`)
    }
    console.log()
  }
  process.exit(0)
}

if (cmd === 'stop') {
  const slug = args[0]
  if (!slug) { console.error('Usage: dev-app.mjs stop <slug>'); process.exit(1) }
  const reg = read()
  const entry = reg[slug]
  if (!entry) { console.log(`No entry for "${slug}"`); process.exit(0) }
  if (entry.pid && alive(entry.pid)) {
    try { process.kill(-entry.pid, 'SIGTERM') } catch { try { process.kill(entry.pid, 'SIGTERM') } catch {} }
    console.log(`Stopped "${slug}" (pid ${entry.pid})`)
  }
  delete reg[slug]
  save(reg)
  process.exit(0)
}

// Default: launch
const slug = cmd
if (!slug) {
  console.error('Usage: dev-app.mjs <slug> | list | stop <slug>')
  process.exit(1)
}

const reg = prune(read())

// Already running?
if (reg[slug]?.pid && alive(reg[slug].pid)) {
  console.log(`✓ "${slug}" is already running at http://localhost:${reg[slug].port}`)
  process.exit(0)
}

const port = reg[slug]?.port ?? nextPort(reg)

// Write config before spawning
writeConfig(slug)

console.log(`\n  Starting "${slug}" on http://localhost:${port} …\n`)

const env = {
  ...process.env,
  APP_SLUG: slug,
  PORT: String(port),
  NUXT_PORT: String(port),
}

const child = spawn('pnpm', ['dev', '--port', String(port)], {
  cwd: TEMPLATE_DIR,
  env,
  stdio: 'inherit',   // show output in this terminal
})

reg[slug] = { port, pid: child.pid, startedAt: Date.now() }
save(reg)

child.on('exit', () => {
  const r = read()
  if (r[slug]?.pid === child.pid) { delete r[slug]; save(r) }
})

process.on('SIGINT', () => {
  child.kill('SIGTERM')
  const r = read()
  if (r[slug]?.pid === child.pid) { delete r[slug]; save(r) }
  process.exit(0)
})
