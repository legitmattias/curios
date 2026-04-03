import { describe, it, expect } from 'vitest'
import { MetricEventSchema, MetricsSnapshotSchema, WsMessageSchema } from './metrics.js'

describe('MetricEventSchema', () => {
  it('validates a valid metric event', () => {
    const event = {
      timestamp: 1712000000000,
      method: 'GET',
      path: '/projects',
      status: 200,
      durationMs: 3.5,
    }

    expect(MetricEventSchema.parse(event)).toEqual(event)
  })

  it('rejects invalid data', () => {
    expect(() => MetricEventSchema.parse({ method: 123 })).toThrow()
  })
})

describe('MetricsSnapshotSchema', () => {
  it('validates a valid snapshot', () => {
    const snapshot = {
      uptimeSeconds: 3600,
      totalRequests: 500,
      requestsPerSecond: 2.5,
      avgResponseTimeMs: 4.2,
      statusCounts: { '2xx': 480, '4xx': 15, '5xx': 5 },
      activeConnections: 2,
      recentRequests: [],
      requestRateSeries: [1, 2, 3],
      responseTimeSeries: [3.0, 4.0, 5.0],
    }

    expect(MetricsSnapshotSchema.parse(snapshot)).toEqual(snapshot)
  })
})

describe('WsMessageSchema', () => {
  it('validates a snapshot message', () => {
    const msg = {
      type: 'snapshot',
      payload: {
        uptimeSeconds: 100,
        totalRequests: 10,
        requestsPerSecond: 1,
        avgResponseTimeMs: 5,
        statusCounts: { '2xx': 10, '4xx': 0, '5xx': 0 },
        activeConnections: 1,
        recentRequests: [],
        requestRateSeries: [],
        responseTimeSeries: [],
      },
    }

    expect(WsMessageSchema.parse(msg)).toEqual(msg)
  })

  it('validates a ping message', () => {
    expect(WsMessageSchema.parse({ type: 'ping' })).toEqual({ type: 'ping' })
  })

  it('rejects unknown type', () => {
    expect(() => WsMessageSchema.parse({ type: 'unknown' })).toThrow()
  })
})
