import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { MetricsSnapshotSchema } from '@curios/shared/schemas'
import { getSnapshot } from '../services/metrics-store.js'

const metricsRoute = new OpenAPIHono()

const snapshotRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: MetricsSnapshotSchema,
          }),
        },
      },
      description: 'Current metrics snapshot',
    },
  },
})

metricsRoute.openapi(snapshotRoute, (c) => {
  return c.json({ data: getSnapshot() })
})

export { metricsRoute }
