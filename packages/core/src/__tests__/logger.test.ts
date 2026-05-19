import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs info messages', async () => {
    const { logger } = await import('../utils/logger')
    logger.info('test message')
    expect(console.log).toHaveBeenCalled()
  })

  it('logs error messages to console.error', async () => {
    const { logger } = await import('../utils/logger')
    logger.error('something failed', new Error('oops'))
    expect(console.error).toHaveBeenCalled()
  })

  it('includes metadata in the log entry', async () => {
    const { logger } = await import('../utils/logger')
    logger.info('business created', { businessId: 'biz-123' })
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('business created'),
      expect.objectContaining({ businessId: 'biz-123' }),
    )
  })
})
