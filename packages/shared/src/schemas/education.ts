import { z } from 'zod'

export const EducationSchema = z.object({
  id: z.string().uuid(),
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
})

export type Education = z.infer<typeof EducationSchema>
