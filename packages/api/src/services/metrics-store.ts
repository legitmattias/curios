import type { MetricEvent, MetricsSnapshot } from '@curios/shared/schemas'

const BUFFER_CAPACITY = 3600
const SERIES_LENGTH = 300
const RPS_WINDOW_SECONDS = 10
const AVG_WINDOW_SECONDS = 60

class RingBuffer<T> {
  private items: T[] = []
  private head = 0
  private count = 0

  constructor(private capacity: number) {}

  push(item: T): void {
    if (this.count < this.capacity) {
      this.items.push(item)
      this.count++
    } else {
      this.items[this.head] = item
    }
    this.head = (this.head + 1) % this.capacity
  }

  toArray(): T[] {
    if (this.count < this.capacity) {
      return this.items.slice()
    }
    return [...this.items.slice(this.head), ...this.items.slice(0, this.head)]
  }

  get size(): number {
    return this.count
  }
}

const events = new RingBuffer<MetricEvent>(BUFFER_CAPACITY)
let totalRequests = 0
let activeConnections = 0
const startTime = Date.now()

export function recordRequest(event: MetricEvent): void {
  events.push(event)
  totalRequests++
}

export function incrementConnections(): void {
  activeConnections++
}

export function decrementConnections(): void {
  activeConnections = Math.max(0, activeConnections - 1)
}

export function getSnapshot(): MetricsSnapshot {
  const now = Date.now()
  const allEvents = events.toArray()

  // Status counts
  const statusCounts = { '2xx': 0, '4xx': 0, '5xx': 0 }
  for (const e of allEvents) {
    if (e.status >= 200 && e.status < 300) statusCounts['2xx']++
    else if (e.status >= 400 && e.status < 500) statusCounts['4xx']++
    else if (e.status >= 500) statusCounts['5xx']++
  }

  // Requests per second (rolling window)
  const rpsWindowStart = now - RPS_WINDOW_SECONDS * 1000
  const recentForRps = allEvents.filter((e) => e.timestamp >= rpsWindowStart)
  const requestsPerSecond =
    RPS_WINDOW_SECONDS > 0 ? recentForRps.length / RPS_WINDOW_SECONDS : 0

  // Average response time (rolling window)
  const avgWindowStart = now - AVG_WINDOW_SECONDS * 1000
  const recentForAvg = allEvents.filter((e) => e.timestamp >= avgWindowStart)
  const avgResponseTimeMs =
    recentForAvg.length > 0
      ? recentForAvg.reduce((sum, e) => sum + e.durationMs, 0) / recentForAvg.length
      : 0

  // Time-series buckets (1-second resolution, last SERIES_LENGTH seconds)
  const seriesStart = now - SERIES_LENGTH * 1000
  const requestRateSeries: number[] = new Array(SERIES_LENGTH).fill(0)
  const responseTimeSeries: number[] = new Array(SERIES_LENGTH).fill(0)
  const responseTimeCounts: number[] = new Array(SERIES_LENGTH).fill(0)

  for (const e of allEvents) {
    if (e.timestamp < seriesStart) continue
    const bucket = Math.floor((e.timestamp - seriesStart) / 1000)
    if (bucket >= 0 && bucket < SERIES_LENGTH) {
      requestRateSeries[bucket]++
      responseTimeSeries[bucket] += e.durationMs
      responseTimeCounts[bucket]++
    }
  }

  // Convert response time totals to averages
  for (let i = 0; i < SERIES_LENGTH; i++) {
    if (responseTimeCounts[i] > 0) {
      responseTimeSeries[i] = responseTimeSeries[i] / responseTimeCounts[i]
    }
  }

  // Recent requests (last 20, newest first)
  const recentRequests = allEvents.slice(-20).reverse()

  return {
    uptimeSeconds: (now - startTime) / 1000,
    totalRequests,
    requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
    avgResponseTimeMs: Math.round(avgResponseTimeMs * 100) / 100,
    statusCounts,
    activeConnections,
    recentRequests,
    requestRateSeries,
    responseTimeSeries,
  }
}
