import { z } from 'zod'

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  tech: z.array(z.string()),
  url: z.string().url().optional(),
  repo: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Project = z.infer<typeof ProjectSchema>
