import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { CvDataSchema } from '@curios/shared/schemas'
import { db } from '../db/index.js'
import { profile, experience, skills, education, projects } from '../db/schema.js'
import { asc } from 'drizzle-orm'
import { generateCvPdf } from '../services/pdf-generator.js'
import type { CvData } from '@curios/shared/types'

const cvRoute = new OpenAPIHono()

async function getCvData(): Promise<CvData> {
  const [profileRows, experienceRows, skillRows, educationRows, projectRows] =
    await Promise.all([
      db.select().from(profile).limit(1),
      db.select().from(experience).orderBy(asc(experience.sortOrder)),
      db.select().from(skills).orderBy(asc(skills.category), asc(skills.sortOrder)),
      db.select().from(education).orderBy(asc(education.sortOrder)),
      db.select().from(projects),
    ])

  const profileData = profileRows[0]
  if (!profileData) throw new Error('Profile not found')

  return {
    profile: {
      ...profileData,
      linkedin: profileData.linkedin ?? null,
      website: profileData.website ?? null,
    },
    experience: experienceRows.map((row) => ({
      ...row,
      endDate: row.endDate ?? null,
    })),
    skills: skillRows,
    education: educationRows.map((row) => ({
      ...row,
      endDate: row.endDate ?? null,
      description: row.description ?? null,
    })),
    projects: projectRows.map((row) => ({
      ...row,
      url: row.url ?? undefined,
      repo: row.repo ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  }
}

const jsonRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: CvDataSchema,
          }),
        },
      },
      description: 'Aggregated CV data',
    },
  },
})

cvRoute.openapi(jsonRoute, async (c) => {
  const data = await getCvData()
  return c.json({ data })
})

const pdfRoute = createRoute({
  method: 'get',
  path: '/pdf',
  responses: {
    200: {
      content: {
        'application/pdf': {
          schema: z.any(),
        },
      },
      description: 'Generated CV as PDF',
    },
  },
})

cvRoute.openapi(pdfRoute, async (c) => {
  const data = await getCvData()
  const pdfBytes = await generateCvPdf(data)

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="mattias-ubbesen-cv.pdf"',
    },
  })
})

export { cvRoute }
