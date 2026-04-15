import { z } from "zod";

export const SkillSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int(),
});

export type Skill = z.infer<typeof SkillSchema>;
