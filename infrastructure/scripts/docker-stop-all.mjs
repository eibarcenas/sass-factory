#!/usr/bin/env node
// Stops all sass-factory containers
import { execSync } from 'node:child_process'

try {
  const output = execSync('docker ps --filter "name=sass-" --format "{{.Names}}"').toString().trim()
  if (!output) { console.log('No sass-factory containers running.'); process.exit(0) }
  const names = output.split('\n')
  for (const name of names) {
    execSync(`docker rm -f ${name}`)
    console.log(`Stopped ${name}`)
  }
} catch (e) {
  console.error(e.message)
}
