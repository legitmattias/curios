import type { MiddlewareHandler } from 'hono'
import { recordRequest } from '../services/metrics-store.js'

export const metricsMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now()

  await next()

  try {
    recordRequest({
      timestamp: start,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      status: c.res.status,
      durationMs: Date.now() - start,
    })
  } catch {
    // Never let metrics tracking break a real request
  }
}
