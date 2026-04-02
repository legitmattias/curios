import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { SkillSchema } from '@curios/shared/schemas'
import { db } from '../db/index.js'
import { skills } from '../db/schema.js'
import { asc } from 'drizzle-orm'

const skillsRoute = new OpenAPIHono()

const listRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(SkillSchema),
          }),
        },
      },
      description: 'List all skills ordered by category and sort order',
    },
  },
})

skillsRoute.openapi(listRoute, async (c) => {
  const rows = await db
    .select()
    .from(skills)
    .orderBy(asc(skills.category), asc(skills.sortOrder))

  return c.json({ data: rows })
})

export { skillsRoute }
