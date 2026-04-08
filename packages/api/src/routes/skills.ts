import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { SkillSchema } from '@curios/shared/schemas'
import { db } from '../db/index.js'
import { skills } from '../db/schema.js'
import { asc } from 'drizzle-orm'
import { applyTranslations } from '../services/translation-helper.js'

const SKILL_TRANSLATABLE = ['category']

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
  const lang = c.req.query('lang') ?? 'en'
  const rows = await db
    .select()
    .from(skills)
    .orderBy(asc(skills.category), asc(skills.sortOrder))

  const result = await applyTranslations('skill', rows, lang, SKILL_TRANSLATABLE)
  return c.json({ data: result.data, translationMeta: result.translationMeta })
})

export { skillsRoute }
