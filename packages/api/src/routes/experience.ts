import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { ExperienceSchema } from '@curios/shared/schemas'
import { db } from '../db/index.js'
import { experience } from '../db/schema.js'
import { asc } from 'drizzle-orm'
import { applyTranslations } from '../services/translation-helper.js'

const EXPERIENCE_TRANSLATABLE = ['role', 'description']

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
  const lang = c.req.query('lang') ?? 'en'
  const rows = await db
    .select()
    .from(experience)
    .orderBy(asc(experience.sortOrder))

  const result = await applyTranslations('experience', rows, lang, EXPERIENCE_TRANSLATABLE)
  return c.json({ data: result.data, translationMeta: result.translationMeta })
})

export { experienceRoute }
