import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return {
    status: 'ok',
    version: process.env.npm_package_version ?? '0.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV ?? 'development',
  }
})
