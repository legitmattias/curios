import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { EducationSchema } from '@curios/shared/schemas'
import { db } from '../db/index.js'
import { education } from '../db/schema.js'
import { asc } from 'drizzle-orm'

const educationRoute = new OpenAPIHono()

const listRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(EducationSchema),
          }),
        },
      },
      description: 'List all education entries ordered by sort order',
    },
  },
})

educationRoute.openapi(listRoute, async (c) => {
  const rows = await db
    .select()
    .from(education)
    .orderBy(asc(education.sortOrder))

  const data = rows.map((row) => ({
    ...row,
    endDate: row.endDate ?? null,
    description: row.description ?? null,
  }))

  return c.json({ data })
})

export { educationRoute }
