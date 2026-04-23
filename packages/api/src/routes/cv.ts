import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { CvDataSchema } from "@curios/shared/schemas";
import { db } from "../db/index.js";
import {
  profile,
  experience,
  skills,
  education,
  projects,
} from "../db/schema.js";
import { asc } from "drizzle-orm";
import { generateCvPdf } from "../services/pdf-generator.js";
import {
  applyTranslations,
  applyTranslationsSingle,
} from "../services/translation-helper.js";
import type { CvData } from "@curios/shared/types";
import type { TranslationMeta } from "@curios/shared/types";

const cvRoute = new OpenAPIHono();

async function getCvData(
  lang: string = "en",
): Promise<{ data: CvData; translationMeta?: TranslationMeta }> {
  const [profileRows, experienceRows, skillRows, educationRows, projectRows] =
    await Promise.all([
      db.select().from(profile).limit(1),
      db.select().from(experience).orderBy(asc(experience.sortOrder)),
      db
        .select()
        .from(skills)
        .orderBy(asc(skills.category), asc(skills.sortOrder)),
      db.select().from(education).orderBy(asc(education.sortOrder)),
      db.select().from(projects).orderBy(asc(projects.sortOrder)),
    ]);

  const profileData = profileRows[0];
  if (!profileData) throw new Error("Profile not found");

  const mappedProfile = {
    ...profileData,
    linkedin: profileData.linkedin ?? null,
    website: profileData.website ?? null,
  };
  const mappedExperience = experienceRows.map((row) => ({
    ...row,
    endDate: row.endDate ?? null,
  }));
  const mappedEducation = educationRows.map((row) => ({
    ...row,
    endDate: row.endDate ?? null,
    description: row.description ?? null,
  }));
  const mappedProjects = projectRows.map((row) => ({
    ...row,
    // Dedupe tech — defensive layer in case legacy DB data has duplicates.
    tech: [...new Set(row.tech)],
    url: row.url ?? undefined,
    repo: row.repo ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  // Apply translations
  const [tProfile, tExperience, tSkills, tEducation, tProjects] =
    await Promise.all([
      applyTranslationsSingle("profile", mappedProfile, lang, ["title", "bio"]),
      applyTranslations("experience", mappedExperience, lang, [
        "role",
        "description",
      ]),
      applyTranslations("skill", skillRows, lang, ["category"]),
      applyTranslations("education", mappedEducation, lang, [
        "institution",
        "degree",
        "field",
        "description",
      ]),
      applyTranslations("project", mappedProjects, lang, [
        "title",
        "description",
      ]),
    ]);

  // Merge translation metadata
  const translationMeta: TranslationMeta = {
    ...tProfile.translationMeta,
    ...tExperience.translationMeta,
    ...tSkills.translationMeta,
    ...tEducation.translationMeta,
    ...tProjects.translationMeta,
  };

  const cvSkillsAll = profileData.cvSkills ?? null;
  const cvSkillsForLang = cvSkillsAll
    ? lang === "sv"
      ? cvSkillsAll.sv
      : cvSkillsAll.en
    : null;

  const cvProjectsAll = profileData.cvProjects ?? null;
  const cvProjectsForLang = cvProjectsAll
    ? lang === "sv"
      ? cvProjectsAll.sv
      : cvProjectsAll.en
    : null;

  const otherInfoAll = profileData.otherInfo ?? null;
  const otherInfoForLang = otherInfoAll
    ? lang === "sv"
      ? otherInfoAll.sv
      : otherInfoAll.en
    : null;

  const languagesRaw = profileData.languages ?? null;

  return {
    data: {
      profile: tProfile.data,
      experience: tExperience.data,
      skills: tSkills.data,
      cvSkills: cvSkillsForLang,
      education: tEducation.data,
      projects: tProjects.data,
      cvProjects: cvProjectsForLang,
      otherInfo: otherInfoForLang,
      languages: languagesRaw,
    },
    translationMeta:
      Object.keys(translationMeta).length > 0 ? translationMeta : undefined,
  };
}

const jsonRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: CvDataSchema,
          }),
        },
      },
      description: "Aggregated CV data",
    },
  },
});

cvRoute.openapi(jsonRoute, async (c) => {
  const lang = c.req.query("lang") ?? "en";
  const result = await getCvData(lang);
  return c.json({ data: result.data, translationMeta: result.translationMeta });
});

const pdfRoute = createRoute({
  method: "get",
  path: "/pdf",
  responses: {
    200: {
      content: {
        "application/pdf": {
          schema: z.any(),
        },
      },
      description: "Generated CV as PDF",
    },
  },
});

cvRoute.openapi(pdfRoute, async (c) => {
  const lang = (c.req.query("lang") === "sv" ? "sv" : "en") as "en" | "sv";
  const result = await getCvData(lang);
  const pdfBytes = await generateCvPdf(result.data, lang);

  const nameSlug = result.data.profile.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${nameSlug || "cv"}-cv.pdf`;

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
});

export { cvRoute };
