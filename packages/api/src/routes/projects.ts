import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { ProjectSchema } from '@curios/shared/schemas'
import { db } from '../db/index.js'
import { projects } from '../db/schema.js'

const projectsRoute = new OpenAPIHono()

const listRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(ProjectSchema),
          }),
        },
      },
      description: 'List all projects',
    },
  },
})

projectsRoute.openapi(listRoute, async (c) => {
  const rows = await db.select().from(projects)

  const data = rows.map((row) => ({
    ...row,
    url: row.url ?? undefined,
    repo: row.repo ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))

  return c.json({ data })
})

export { projectsRoute }
