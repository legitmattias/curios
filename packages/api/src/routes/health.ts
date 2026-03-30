import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const healthRoute = new OpenAPIHono()

const route = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.string().openapi({ example: 'ok' }),
            uptime: z.number().openapi({ example: 12345.67 }),
          }),
        },
      },
      description: 'Service health status',
    },
  },
})

healthRoute.openapi(route, (c) => {
  return c.json({
    status: 'ok',
    uptime: process.uptime(),
  })
})

export { healthRoute }
