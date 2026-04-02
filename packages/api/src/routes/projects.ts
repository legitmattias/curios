import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { ProjectSchema } from '@curios/shared/schemas'
import { db } from '../db/index.js'
import { projects } from '../db/schema.js'
import { eq } from 'drizzle-orm'

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

const getBySlugRoute = createRoute({
  method: 'get',
  path: '/{slug}',
  request: {
    params: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: ProjectSchema,
          }),
        },
      },
      description: 'Get a project by slug',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
            message: z.string(),
            statusCode: z.number(),
          }),
        },
      },
      description: 'Project not found',
    },
  },
})

projectsRoute.openapi(getBySlugRoute, async (c) => {
  const { slug } = c.req.valid('param')
  const rows = await db.select().from(projects).where(eq(projects.slug, slug))

  if (rows.length === 0) {
    return c.json({ error: 'Not Found', message: `Project '${slug}' not found`, statusCode: 404 }, 404)
  }

  const row = rows[0]
  const data = {
    ...row,
    url: row.url ?? undefined,
    repo: row.repo ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }

  return c.json({ data })
})

export { projectsRoute }
