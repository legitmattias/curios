import { describe, it, expect } from 'vitest'
import { OpenAPIHono } from '@hono/zod-openapi'

describe('GET /metrics', () => {
  it('returns 200 with snapshot data', async () => {
    // Import dynamically to avoid DB initialization from other routes
    const { metricsRoute } = await import('./metrics.js')
    const res = await metricsRoute.request('/')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty('data')
    expect(body.data).toHaveProperty('uptimeSeconds')
    expect(body.data).toHaveProperty('totalRequests')
    expect(body.data).toHaveProperty('requestsPerSecond')
    expect(body.data).toHaveProperty('avgResponseTimeMs')
    expect(body.data).toHaveProperty('statusCounts')
    expect(body.data.statusCounts).toHaveProperty('2xx')
    expect(body.data.statusCounts).toHaveProperty('4xx')
    expect(body.data.statusCounts).toHaveProperty('5xx')
    expect(body.data).toHaveProperty('activeConnections')
    expect(body.data).toHaveProperty('recentRequests')
    expect(body.data).toHaveProperty('requestRateSeries')
    expect(body.data).toHaveProperty('responseTimeSeries')
    expect(Array.isArray(body.data.requestRateSeries)).toBe(true)
    expect(body.data.requestRateSeries).toHaveLength(300)
  })
})
