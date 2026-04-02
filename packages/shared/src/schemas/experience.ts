import { z } from 'zod'

export const ExperienceSchema = z.object({
  id: z.string().uuid(),
  company: z.string(),
  role: z.string(),
  description: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  tech: z.array(z.string()),
  sortOrder: z.number().int(),
})

export type Experience = z.infer<typeof ExperienceSchema>
