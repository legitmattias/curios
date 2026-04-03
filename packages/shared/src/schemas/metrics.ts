import { z } from 'zod'

export const MetricEventSchema = z.object({
  timestamp: z.number(),
  method: z.string(),
  path: z.string(),
  status: z.number(),
  durationMs: z.number(),
})

export type MetricEvent = z.infer<typeof MetricEventSchema>

export const MetricsSnapshotSchema = z.object({
  uptimeSeconds: z.number(),
  totalRequests: z.number(),
  requestsPerSecond: z.number(),
  avgResponseTimeMs: z.number(),
  statusCounts: z.object({
    '2xx': z.number(),
    '4xx': z.number(),
    '5xx': z.number(),
  }),
  activeConnections: z.number(),
  recentRequests: z.array(MetricEventSchema),
  requestRateSeries: z.array(z.number()),
  responseTimeSeries: z.array(z.number()),
})

export type MetricsSnapshot = z.infer<typeof MetricsSnapshotSchema>

export const WsMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('snapshot'), payload: MetricsSnapshotSchema }),
  z.object({ type: z.literal('ping') }),
])

export type WsMessage = z.infer<typeof WsMessageSchema>
