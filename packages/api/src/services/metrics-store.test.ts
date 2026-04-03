import { describe, it, expect, beforeEach } from 'vitest'

// Fresh module import for each test — reset the singleton state
let metricsStore: typeof import('./metrics-store.js')

beforeEach(async () => {
  // Re-import to get a clean module (vitest caches modules)
  // Instead, we'll test through the public API and accept accumulated state
  metricsStore = await import('./metrics-store.js')
})

describe('MetricsStore', () => {
  it('returns a valid snapshot with no events', () => {
    const snapshot = metricsStore.getSnapshot()

    expect(snapshot.uptimeSeconds).toBeGreaterThanOrEqual(0)
    expect(snapshot.totalRequests).toBeGreaterThanOrEqual(0)
    expect(snapshot.requestsPerSecond).toBeGreaterThanOrEqual(0)
    expect(snapshot.avgResponseTimeMs).toBeGreaterThanOrEqual(0)
    expect(snapshot.statusCounts).toHaveProperty('2xx')
    expect(snapshot.statusCounts).toHaveProperty('4xx')
    expect(snapshot.statusCounts).toHaveProperty('5xx')
    expect(snapshot.activeConnections).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(snapshot.recentRequests)).toBe(true)
    expect(Array.isArray(snapshot.requestRateSeries)).toBe(true)
    expect(Array.isArray(snapshot.responseTimeSeries)).toBe(true)
    expect(snapshot.requestRateSeries).toHaveLength(300)
    expect(snapshot.responseTimeSeries).toHaveLength(300)
  })

  it('records requests and updates counts', () => {
    const before = metricsStore.getSnapshot().totalRequests

    metricsStore.recordRequest({
      timestamp: Date.now(),
      method: 'GET',
      path: '/test',
      status: 200,
      durationMs: 5,
    })

    const after = metricsStore.getSnapshot()
    expect(after.totalRequests).toBe(before + 1)
    expect(after.statusCounts['2xx']).toBeGreaterThan(0)
  })

  it('tracks status code categories', () => {
    metricsStore.recordRequest({
      timestamp: Date.now(),
      method: 'GET',
      path: '/missing',
      status: 404,
      durationMs: 2,
    })

    const snapshot = metricsStore.getSnapshot()
    expect(snapshot.statusCounts['4xx']).toBeGreaterThan(0)
  })

  it('returns recent requests newest first', () => {
    const now = Date.now()
    metricsStore.recordRequest({
      timestamp: now,
      method: 'GET',
      path: '/first',
      status: 200,
      durationMs: 1,
    })
    metricsStore.recordRequest({
      timestamp: now + 100,
      method: 'POST',
      path: '/second',
      status: 201,
      durationMs: 2,
    })

    const snapshot = metricsStore.getSnapshot()
    const recent = snapshot.recentRequests
    expect(recent.length).toBeGreaterThanOrEqual(2)
    expect(recent[0].path).toBe('/second')
  })

  it('tracks active connections', () => {
    const before = metricsStore.getSnapshot().activeConnections

    metricsStore.incrementConnections()
    expect(metricsStore.getSnapshot().activeConnections).toBe(before + 1)

    metricsStore.decrementConnections()
    expect(metricsStore.getSnapshot().activeConnections).toBe(before)
  })

  it('does not go below zero connections', () => {
    // Decrement more times than incremented
    metricsStore.decrementConnections()
    metricsStore.decrementConnections()
    metricsStore.decrementConnections()

    expect(metricsStore.getSnapshot().activeConnections).toBe(0)
  })
})
