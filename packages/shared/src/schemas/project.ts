import { z } from "zod";

export const TechItemSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
});

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  tech: z.array(TechItemSchema),
  url: z.string().url().optional(),
  repo: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TechItem = z.infer<typeof TechItemSchema>;
export type Project = z.infer<typeof ProjectSchema>;
