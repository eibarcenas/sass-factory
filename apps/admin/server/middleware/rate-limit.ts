import { createError, getRequestIP, setResponseHeader } from 'h3'
import type { H3Event } from 'h3'

interface Window {
  count: number
  resetAt: number
}

const ipWindows = new Map<string, Window>()
const aiGenerateWindows = new Map<string, number>() // uid → count today

const WINDOW_MS = 60_000
const MAX_REQUESTS = 100
const MAX_AI_GENERATES_PER_DAY = 5

function getWindow(ip: string): Window {
  const now = Date.now()
  const existing = ipWindows.get(ip)

  if (!existing || now > existing.resetAt) {
    const window: Window = { count: 0, resetAt: now + WINDOW_MS }
    ipWindows.set(ip, window)
    return window
  }
  return existing
}

export function checkRateLimit(event: H3Event): void {
  const ip = getRequestIP(event) ?? 'unknown'
  const window = getWindow(ip)

  window.count++

  const remaining = Math.max(0, MAX_REQUESTS - window.count)
  const retryAfter = Math.ceil((window.resetAt - Date.now()) / 1000)

  setResponseHeader(event, 'RateLimit-Limit', String(MAX_REQUESTS))
  setResponseHeader(event, 'RateLimit-Remaining', String(remaining))
  setResponseHeader(event, 'RateLimit-Reset', String(Math.ceil(window.resetAt / 1000)))

  if (window.count > MAX_REQUESTS) {
    setResponseHeader(event, 'Retry-After', String(retryAfter))
    throw createError({
      statusCode: 429,
      message: `Rate limit exceeded. Try again in ${retryAfter}s`,
    })
  }
}

export function checkAiGenerateLimit(uid: string): void {
  const todayKey = `${uid}:${new Date().toISOString().slice(0, 10)}`
  const count = (aiGenerateWindows.get(todayKey) ?? 0) + 1
  aiGenerateWindows.set(todayKey, count)

  if (count > MAX_AI_GENERATES_PER_DAY) {
    throw createError({
      statusCode: 429,
      message: `AI generation limit reached (${MAX_AI_GENERATES_PER_DAY}/day). Try again tomorrow.`,
    })
  }
}
