import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db/index.js";
import { projects, profile, translations } from "../db/schema.js";
import { and, asc, eq, inArray } from "drizzle-orm";

interface CvProjectItem {
  slug: string;
  title: string;
  summary: string;
  tech: string[];
}

interface CvProjectsResult {
  projects: number;
  errors: string[];
}

/**
 * Condense each portfolio project into a CV-purpose one-sentence summary
 * with a pared-down tech list. Produces EN + SE together and stores the
 * result on `profile.cvProjects`. Rendered by `cv.ts` when available.
 */
export async function syncCvProjects(): Promise<CvProjectsResult> {
  const errors: string[] = [];

  const allProjects = await db
    .select()
    .from(projects)
    .orderBy(asc(projects.sortOrder));

  if (allProjects.length === 0) {
    return { projects: 0, errors: ["No projects in DB to summarize"] };
  }

  const projectIds = allProjects.map((p) => p.id);

  const svTrans = await db
    .select()
    .from(translations)
    .where(
      and(
        eq(translations.entityType, "project"),
        eq(translations.locale, "sv"),
        inArray(translations.entityId, projectIds),
      ),
    );

  const svByKey = new Map<string, string>();
  for (const row of svTrans) {
    svByKey.set(`${row.entityId}:${row.field}`, row.value);
  }

  const projectLines = allProjects.map((p) => ({
    slug: p.slug,
    title: p.title,
    titleSv: svByKey.get(`${p.id}:title`) ?? p.title,
    description: p.description,
    descriptionSv: svByKey.get(`${p.id}:description`) ?? "",
    tech: p.tech,
    url: p.url ?? "",
  }));

  const prompt = `You are writing the CV "Featured Projects" section for Mattias Ubbesen, a full stack developer and computer science student. Below are his portfolio projects in the display order he has chosen.

For each project, produce:
- "slug": keep exactly as given
- "title": keep title as-is (most are proper nouns — CuriOS, Dossier, etc.). If the Swedish output has an established Swedish name, use it; otherwise reuse the English title.
- "summary": ONE sentence (≤ 22 words) written in CV voice — what it is + what it demonstrates technically. No first-person ("I built…"), no marketing fluff.
- "tech": an array of 4–7 most representative tech from the input — prefer named frameworks/tools over broad categories. Drop redundant or low-signal entries.

Output JSON with "en" and "sv" arrays aligned — same slugs, same order. Only summary (and optionally title) differ per language.

Rules:
- Swedish summaries must read natural, not calqued from English.
- Tool, framework, language, and standard technical names stay in English inside Swedish sentences (React, PostgreSQL, Docker, TypeScript, etc.).
- Do NOT invent facts, tech, or claims not present in the input.
- Do NOT include a preamble or markdown fences. Output JSON only.

Output shape:
{
  "en": [{"slug": "…", "title": "…", "summary": "…", "tech": ["…"]}, …],
  "sv": [{"slug": "…", "title": "…", "summary": "…", "tech": ["…"]}, …]
}

Projects (slug | title | tech | description):
${projectLines
  .map(
    (p) => `- ${p.slug} | ${p.title} | ${p.tech.join(", ")} | ${p.description}`,
  )
  .join("\n\n")}

Swedish translations for reference (tone only, don't copy verbatim):
${projectLines
  .filter((p) => p.descriptionSv)
  .map((p) => `- ${p.slug}: ${p.descriptionSv}`)
  .join("\n\n")}
`;

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("LLM returned no text content");
  }

  const rawText = textBlock.text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  let parsed: {
    en: CvProjectItem[];
    sv: CvProjectItem[];
  };
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new Error(
      `Failed to parse LLM JSON: ${err instanceof Error ? err.message : err}`,
    );
  }

  if (
    !Array.isArray(parsed.en) ||
    !Array.isArray(parsed.sv) ||
    parsed.en.length !== parsed.sv.length
  ) {
    throw new Error(
      `Invalid shape: en=${parsed.en?.length} sv=${parsed.sv?.length}`,
    );
  }

  const profileRows = await db.select().from(profile).limit(1);
  const profileId = profileRows[0]?.id;
  if (!profileId) {
    throw new Error("Profile row not found — seed must run first");
  }

  await db
    .update(profile)
    .set({ cvProjects: { en: parsed.en, sv: parsed.sv } })
    .where(eq(profile.id, profileId));

  console.log(
    `  CV projects: ${parsed.en.length} items generated (EN+SE stored)`,
  );

  return { projects: parsed.en.length, errors };
}
