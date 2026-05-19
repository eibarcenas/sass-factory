type Severity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LogEntry {
  severity: Severity
  message: string
  traceId?: string
  businessId?: string
  userId?: string
  durationMs?: number
  errorCode?: string
  [key: string]: unknown
}

function log(severity: Severity, message: string, meta?: Partial<LogEntry>): void {
  const entry: LogEntry = { severity, message, ...meta }
  // In production: Cloud Logging picks up structured JSON from stdout
  // In development: pretty print
  if (process.env.NODE_ENV === 'production') {
    process.stdout.write(JSON.stringify(entry) + '\n')
  } else {
    const prefix = { DEBUG: '🔵', INFO: '🟢', WARN: '🟡', ERROR: '🔴' }[severity]
    console[severity === 'ERROR' ? 'error' : 'log'](
      `${prefix} [${severity}] ${message}`,
      Object.keys(meta ?? {}).length ? meta : '',
    )
  }
}

export const logger = {
  debug: (msg: string, meta?: Partial<LogEntry>) => log('DEBUG', msg, meta),
  info: (msg: string, meta?: Partial<LogEntry>) => log('INFO', msg, meta),
  warn: (msg: string, meta?: Partial<LogEntry>) => log('WARN', msg, meta),
  error: (msg: string, err?: Error, meta?: Partial<LogEntry>) =>
    log('ERROR', msg, {
      ...(err ? { errorMessage: err.message, stack: err.stack } : {}),
      ...meta,
    }),
}
