import { z } from "zod";
import { ProfileSchema } from "./profile.js";
import { ExperienceSchema } from "./experience.js";
import { SkillSchema } from "./skill.js";
import { EducationSchema } from "./education.js";
import { ProjectSchema } from "./project.js";

export const CvSkillClusterSchema = z.object({
  category: z.string(),
  summary: z.string(),
});

export const CvDataSchema = z.object({
  profile: ProfileSchema,
  experience: z.array(ExperienceSchema),
  skills: z.array(SkillSchema),
  cvSkills: z.array(CvSkillClusterSchema).nullable().optional(),
  education: z.array(EducationSchema),
  projects: z.array(ProjectSchema),
});

export type CvSkillCluster = z.infer<typeof CvSkillClusterSchema>;
export type CvData = z.infer<typeof CvDataSchema>;
