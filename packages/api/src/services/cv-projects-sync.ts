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

  const profileRows = await db.select().from(profile).limit(1);
  const subject = profileRows[0];
  if (!subject) throw new Error("Profile not seeded");

  const prompt = `You are writing the CV "Featured Projects" section for ${subject.name}, a ${subject.title}. Below are the portfolio projects in the display order already chosen.

For each project, produce:
- "slug": keep exactly as given
- "title": keep the title EXACTLY as given. Project titles are proper nouns (brand names like CuriOS, Dossier, MeterStream Platform) — never translate them, never localize them. The "title" value must be identical in the "en" and "sv" arrays.
- "summary": ONE sentence (≤ 22 words) in CV voice. Lead with WHAT the project is and WHAT problem it solves for users. Put outcomes or impact up front, not architecture. Avoid leading with organisational framing ("Monorepo", "Microservices app", "Monorepo of N packages") — that detail belongs in the tech list, not the opening. Architecture words are OK only when the architecture itself is the product (e.g. a platform whose selling point IS microservices). No first-person ("I built…"), no marketing fluff.
- Grammar — subject-verb attribution must be unambiguous. Ensure the *project itself* is the grammatical subject of any capability verbs, not a sub-component. Example: instead of "X exposing data via A, B, C to eliminate Y" (reads as A/B/C doing the elimination), write "X that eliminates Y by exposing data via A, B, C" (clearly the project as a whole).
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

  await db
    .update(profile)
    .set({ cvProjects: { en: parsed.en, sv: parsed.sv } })
    .where(eq(profile.id, subject.id));

  console.log(
    `  CV projects: ${parsed.en.length} items generated (EN+SE stored)`,
  );

  return { projects: parsed.en.length, errors };
}
