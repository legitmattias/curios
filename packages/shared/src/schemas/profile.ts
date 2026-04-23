import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  title: z.string(),
  bio: z.string(),
  location: z.string(),
  email: z.string(),
  github: z.string(),
  linkedin: z.string().nullable(),
  website: z.string().nullable(),
  birthDate: z.string().nullable().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
