import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db/index.js";
import { skills, profile, translations } from "../db/schema.js";
import { and, eq } from "drizzle-orm";

interface CvSkillCluster {
  category: string;
  summary: string;
}

interface CvSkillsResult {
  clusters: number;
  errors: string[];
}

/**
 * Summarize the full featured skill list into a compact set of clusters
 * suitable for a CV. Produces EN + SE together in one LLM call and stores
 * the result on `profile.cvSkills`. Rendered by `cv.ts` when available.
 */
export async function syncCvSkills(): Promise<CvSkillsResult> {
  const errors: string[] = [];

  const allSkills = await db
    .select()
    .from(skills)
    .orderBy(skills.category, skills.sortOrder);

  if (allSkills.length === 0) {
    return { clusters: 0, errors: ["No skills in DB to summarize"] };
  }

  const skillIds = allSkills.map((s) => s.id);

  // Fetch Swedish translations for category and description so the LLM
  // can write natural Swedish clusters without inventing terminology.
  const svTrans = await db
    .select()
    .from(translations)
    .where(
      and(eq(translations.entityType, "skill"), eq(translations.locale, "sv")),
    );

  const svByKey = new Map<string, string>();
  for (const row of svTrans) {
    if (skillIds.includes(row.entityId)) {
      svByKey.set(`${row.entityId}:${row.field}`, row.value);
    }
  }

  const skillLines = allSkills.map((s) => {
    const svCategory = svByKey.get(`${s.id}:category`) ?? s.category;
    const svDescription = svByKey.get(`${s.id}:description`) ?? "";
    return {
      name: s.name,
      category: s.category,
      categorySv: svCategory,
      description: s.description ?? "",
      descriptionSv: svDescription,
    };
  });

  const prompt = `You are shaping a CV skills section for Mattias Ubbesen, a full stack developer and computer science student. Below is the full featured skills list (${allSkills.length} entries). Group them into 10–14 higher-level clusters suitable for the CV — denser signal than a long flat list, but still concrete enough to show real capability.

For each cluster return:
- "category": the cluster name (e.g. "Frontend frameworks & UI", "Cloud infrastructure & deployment")
- "summary": a short line (≤ 18 words) that names the concrete skills in the cluster and implies competence — not a sales pitch.

Output JSON with both "en" and "sv" clusters. Rules:
- Both arrays must be aligned — same number of clusters, same ordering, same clustering. Only the language differs.
- Swedish must read as natural Swedish, not calqued from English. Tool, framework, language, and standard technical names stay in English inside Swedish sentences (React, PostgreSQL, Docker, TypeScript, etc.).
- Prefer clusters of 3–6 items. Merge singletons into broader clusters when possible.
- Order clusters from most portfolio-relevant (full-stack web + AI/LLM work) to least.
- Do NOT invent skills not present in the input.
- Do NOT include a preamble or explanation. Output JSON only, no markdown fences.

Output shape:
{
  "en": [{"category": "…", "summary": "…"}, …],
  "sv": [{"category": "…", "summary": "…"}, …]
}

Skills (name | category | description):
${skillLines
  .map(
    (s) =>
      `- ${s.name} | ${s.category} | ${s.description || "(no description)"}`,
  )
  .join("\n")}

Swedish translations (reference for tone, don't copy verbatim):
${skillLines
  .filter((s) => s.descriptionSv)
  .map((s) => `- ${s.name}: ${s.descriptionSv}`)
  .join("\n")}
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
    en: CvSkillCluster[];
    sv: CvSkillCluster[];
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
    .set({ cvSkills: { en: parsed.en, sv: parsed.sv } })
    .where(eq(profile.id, profileId));

  console.log(
    `  CV skills: ${parsed.en.length} clusters generated (EN+SE stored)`,
  );

  return { clusters: parsed.en.length, errors };
}
