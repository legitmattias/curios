import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { ExperienceSchema } from '@curios/shared/schemas'
import { db } from '../db/index.js'
import { experience } from '../db/schema.js'
import { asc } from 'drizzle-orm'

const experienceRoute = new OpenAPIHono()

const listRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(ExperienceSchema),
          }),
        },
      },
      description: 'List all experience entries ordered by sort order',
    },
  },
})

experienceRoute.openapi(listRoute, async (c) => {
  const rows = await db
    .select()
    .from(experience)
    .orderBy(asc(experience.sortOrder))

  return c.json({ data: rows })
})

export { experienceRoute }
