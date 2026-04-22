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

export const CvProjectItemSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  tech: z.array(z.string()),
});

export const CvLanguageSchema = z.object({
  name: z.string(),
  proficiency: z.string(),
});

export const CvDataSchema = z.object({
  profile: ProfileSchema,
  experience: z.array(ExperienceSchema),
  skills: z.array(SkillSchema),
  cvSkills: z.array(CvSkillClusterSchema).nullable().optional(),
  education: z.array(EducationSchema),
  projects: z.array(ProjectSchema),
  cvProjects: z.array(CvProjectItemSchema).nullable().optional(),
  otherInfo: z.array(z.string()).nullable().optional(),
  languages: z.array(CvLanguageSchema).nullable().optional(),
});

export type CvSkillCluster = z.infer<typeof CvSkillClusterSchema>;
export type CvProjectItem = z.infer<typeof CvProjectItemSchema>;
export type CvLanguage = z.infer<typeof CvLanguageSchema>;
export type CvData = z.infer<typeof CvDataSchema>;
