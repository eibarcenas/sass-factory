import type { Business } from '@sass-factory/core'

export function useGenerate() {
  const isGenerating = ref(false)
  const streamedText = ref('')
  const config = ref<Business | null>(null)
  const error = ref<string | null>(null)

  async function generate(prompt: string) {
    isGenerating.value = true
    streamedText.value = ''
    config.value = null
    error.value = null

    try {
      const response = await fetch('/api/apps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Request failed' }))
        throw new Error(err.message ?? `HTTP ${response.status}`)
      }

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE lines from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''  // keep last incomplete line

        let currentEvent = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim()
            try {
              const parsed = JSON.parse(raw)
              if (currentEvent === 'delta') {
                streamedText.value += parsed.text ?? ''
              } else if (currentEvent === 'done') {
                config.value = parsed.config as Business
              } else if (currentEvent === 'error') {
                throw new Error(parsed.error ?? 'Generation failed')
              }
            } catch (parseErr: any) {
              if (currentEvent === 'error') throw parseErr
              // ignore malformed delta
            }
          }
        }
      }
    } catch (err: any) {
      error.value = err.message ?? 'Unknown error'
    } finally {
      isGenerating.value = false
    }
  }

  function reset() {
    streamedText.value = ''
    config.value = null
    error.value = null
    isGenerating.value = false
  }

  return { isGenerating, streamedText, config, error, generate, reset }
}
