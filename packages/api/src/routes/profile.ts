import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { ProfileSchema } from '@curios/shared/schemas'
import { db } from '../db/index.js'
import { profile } from '../db/schema.js'

const profileRoute = new OpenAPIHono()

const getRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: ProfileSchema,
          }),
        },
      },
      description: 'Get the user profile',
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
      description: 'Profile not found',
    },
  },
})

profileRoute.openapi(getRoute, async (c) => {
  const rows = await db.select().from(profile).limit(1)

  if (rows.length === 0) {
    return c.json({ error: 'Not Found', message: 'Profile not configured', statusCode: 404 }, 404)
  }

  const row = rows[0]
  const data = {
    ...row,
    linkedin: row.linkedin ?? null,
    website: row.website ?? null,
  }

  return c.json({ data })
})

export { profileRoute }
