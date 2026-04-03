import type { MiddlewareHandler } from 'hono'
import { recordRequest } from '../services/metrics-store.js'

const EXCLUDED_PATHS = new Set(['/health', '/ws/metrics'])

export const metricsMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now()

  await next()

  try {
    const path = new URL(c.req.url).pathname
    if (EXCLUDED_PATHS.has(path)) return

    recordRequest({
      timestamp: start,
      method: c.req.method,
      path,
      status: c.res.status,
      durationMs: Date.now() - start,
    })
  } catch {
    // Never let metrics tracking break a real request
  }
}
