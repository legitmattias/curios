import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db/index.js";
import { projects, skills, translations } from "../db/schema.js";
import { and, eq, notInArray } from "drizzle-orm";
import { createHash } from "crypto";

// ── Translation helper ────────────────────────────────

async function translateToSwedish(
  texts: Record<string, string>,
): Promise<Record<string, string>> {
  const entries = Object.entries(texts);
  if (entries.length === 0) return {};

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `Translate the provided JSON values from English to Swedish. Rules:
- Keep ALL technical terms in English: framework names, tool names, programming concepts, architecture terms, protocol names, API terminology, etc. Swedish developers use these terms in English.
- Only translate natural language parts — verbs, prepositions, general descriptions.
- Example: "A reactive web framework used to build the desktop environment" → "Ett reaktivt webbramverk som används för att bygga skrivbordsmiljön" (keep "web" concepts but translate the sentence structure)
- Return the same JSON structure with translated values. Return ONLY the JSON object, no markdown fencing.`,
    messages: [{ role: "user", content: JSON.stringify(texts) }],
  });

  let text =
    response.content[0].type === "text" ? response.content[0].text : "{}";
  text = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(text) as Record<string, string>;
  } catch {
    console.error("Failed to parse Swedish translations:", text.slice(0, 200));
    return {};
  }
}

async function upsertTranslations(
  entityType: string,
  entityId: string,
  locale: string,
  fields: Record<string, string>,
): Promise<number> {
  let count = 0;
  for (const [field, value] of Object.entries(fields)) {
    if (!value) continue;
    await db
      .insert(translations)
      .values({
        entityType,
        entityId,
        locale,
        field,
        value,
        translatedBy: "llm",
      })
      .onConflictDoNothing();

    // Update if exists (onConflictDoNothing means we need a separate update)
    await db
      .update(translations)
      .set({ value, translatedBy: "llm", translatedAt: new Date() })
      .where(
        and(
          eq(translations.entityType, entityType),
          eq(translations.entityId, entityId),
          eq(translations.locale, locale),
          eq(translations.field, field),
        ),
      );
    count++;
  }
  return count;
}

interface DossierProject {
  slug: string;
  name: string;
  description: string;
  url?: string;
  visibility: string;
  featured: boolean;
}

interface LlmTechItem {
  name: string;
  description: string;
}

interface LlmProjectSummary {
  summary: string;
  tech: LlmTechItem[];
}

function getDossierApiUrl(): string {
  const url = process.env.DOSSIER_API_URL;
  if (!url) throw new Error("DOSSIER_API_URL is required");
  return url;
}

function getDossierApiKey(): string {
  const key = process.env.DOSSIER_API_KEY;
  if (!key) throw new Error("DOSSIER_API_KEY is required");
  return key;
}

async function fetchDossierProjects(): Promise<DossierProject[]> {
  const res = await fetch(
    `${getDossierApiUrl()}/profile/projects?featured=true`,
    {
      headers: { Authorization: `Bearer ${getDossierApiKey()}` },
    },
  );
  if (!res.ok) throw new Error(`Dossier API error: ${res.status}`);
  const data = (await res.json()) as { projects: DossierProject[] };
  return data.projects;
}

function extractGitHubRepo(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
  return match ? match[1] : null;
}

async function fetchGitHubReadme(repo: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/readme`, {
      headers: { Accept: "application/vnd.github.raw+json" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    // Truncate to ~4000 chars to keep LLM context reasonable
    return text.length > 4000 ? text.slice(0, 4000) + "\n[truncated]" : text;
  } catch {
    return null;
  }
}

async function fetchPackageManifest(
  repo: string,
): Promise<Record<string, unknown> | null> {
  // Try common manifest files in order
  const manifests = ["package.json", "Cargo.toml", "pyproject.toml", "go.mod"];

  for (const file of manifests) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/contents/${file}`,
        {
          headers: { Accept: "application/vnd.github.raw+json" },
        },
      );
      if (res.ok) {
        const text = await res.text();
        if (file === "package.json") {
          const pkg = JSON.parse(text);
          return {
            type: "package.json",
            dependencies: Object.keys(pkg.dependencies ?? {}),
            devDependencies: Object.keys(pkg.devDependencies ?? {}),
          };
        }
        // For non-JSON manifests, return raw text (truncated)
        return {
          type: file,
          content: text.length > 2000 ? text.slice(0, 2000) : text,
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function computeHash(inputs: Record<string, unknown>): string {
  return createHash("sha256")
    .update(JSON.stringify(inputs))
    .digest("hex")
    .slice(0, 16);
}

async function generateProjectSummary(
  project: DossierProject,
  readme: string | null,
  manifest: Record<string, unknown> | null,
  knownSkillNames: string[],
): Promise<LlmProjectSummary> {
  const anthropic = new Anthropic();

  const context = [
    `Project: ${project.name}`,
    `Description from owner: ${project.description}`,
    readme ? `\nREADME:\n${readme}` : "",
    manifest ? `\nDependencies/manifest:\n${JSON.stringify(manifest)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const skillList = knownSkillNames.join(", ");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: context,
      },
    ],
    system: `You generate portfolio descriptions for software projects. Return a JSON object with exactly two fields:

1. "summary": A concise, compelling 2-3 sentence description for a portfolio site. Focus on what it does, what makes it interesting, and the technical approach. Write for recruiters and senior developers. No filler, no clichés.

2. "tech": An array of objects, each with "name" and "description". Include 6-12 items.

   Prioritization: Lead with technologies that are architecturally significant or make this project distinctive (frameworks, databases, protocols, integrations). Basic web fundamentals (HTML, CSS) should only be included if there is something genuinely interesting about how they are used. Every project uses HTML — that is not interesting.

   Include the full stack: frontend frameworks, backend frameworks, databases, real-time protocols, deployment tools, AI/ML integrations, and notable libraries. Do NOT skip backend or infrastructure tech.

   - "name": You MUST match against this skill list and use the EXACT name when the concept matches: ${skillList}. Examples: use "Real-time Communication" not "WebSocket", use "MCP" not "Model Context Protocol", use "LLM Integration" not "AI", use "Auth & Authorization" not "JWT". Scan the full list carefully. For technologies not in this list, use standard names.
   - "description": Start with a brief factual explanation of what the technology is (one clause), then describe how it is used specifically in THIS project. Be concrete — mention what feature or component it powers. NEVER mention other projects.

Return ONLY the JSON object, no markdown fencing.`,
  });

  let text =
    response.content[0].type === "text" ? response.content[0].text : "";
  // Strip markdown fencing if present
  text = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(text) as LlmProjectSummary;
    if (!parsed.summary || !Array.isArray(parsed.tech)) {
      throw new Error("Invalid LLM response structure");
    }
    // Ensure each tech item has name and description
    parsed.tech = parsed.tech.map((t) =>
      typeof t === "string" ? { name: t, description: "" } : t,
    );
    return parsed;
  } catch {
    console.error("Failed to parse LLM response:", text.slice(0, 300));
    return {
      summary: project.description,
      tech: [],
    };
  }
}

export interface SyncResult {
  synced: number;
  skipped: number;
  removed: number;
  errors: string[];
}

export async function syncProjects(force = false): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, skipped: 0, removed: 0, errors: [] };

  // Fetch featured projects from Dossier
  const dossierProjects = await fetchDossierProjects();
  console.log(`Sync: ${dossierProjects.length} featured projects from Dossier`);

  // Fetch known skill names for tech tag alignment
  const allSkills = await db.select({ name: skills.name }).from(skills);
  const knownSkillNames = allSkills.map((s) => s.name);

  const syncedSlugs: string[] = [];

  for (const project of dossierProjects) {
    try {
      const repo = extractGitHubRepo(project.url);

      // Fetch GitHub data (may fail for private repos — that's fine)
      const readme = repo ? await fetchGitHubReadme(repo) : null;
      const manifest = repo ? await fetchPackageManifest(repo) : null;

      // Compute hash of all inputs
      const hash = computeHash({
        name: project.name,
        description: project.description,
        url: project.url,
        readme: readme ?? "",
        manifest: manifest ?? "",
      });

      // Check if already up-to-date
      const existing = await db
        .select({ contentHash: projects.contentHash })
        .from(projects)
        .where(eq(projects.slug, project.slug))
        .limit(1);

      if (!force && existing.length > 0 && existing[0].contentHash === hash) {
        result.skipped++;
        syncedSlugs.push(project.slug);
        console.log(`  [skip] ${project.slug} (unchanged)`);
        continue;
      }

      // Generate LLM summary
      console.log(`  [sync] ${project.slug} — generating summary...`);
      const { summary, tech } = await generateProjectSummary(
        project,
        readme,
        manifest,
        knownSkillNames,
      );

      const techNames = tech.map((t) => t.name);
      const techDescriptions: Record<string, string> = {};
      for (const t of tech) {
        if (t.description) techDescriptions[t.name] = t.description;
      }

      // Upsert into database
      await db
        .insert(projects)
        .values({
          slug: project.slug,
          title: project.name,
          description: summary,
          tech: techNames,
          techDescriptions,
          url: project.url ?? null,
          repo: project.url ?? null,
          contentHash: hash,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: projects.slug,
          set: {
            title: project.name,
            description: summary,
            tech: techNames,
            techDescriptions,
            url: project.url ?? null,
            repo: project.url ?? null,
            contentHash: hash,
            updatedAt: new Date(),
          },
        });

      // Translate to Swedish
      const textsToTranslate: Record<string, string> = {
        description: summary,
      };
      for (const [name, desc] of Object.entries(techDescriptions)) {
        textsToTranslate[`tech_desc:${name}`] = desc;
      }

      const svTranslations = await translateToSwedish(textsToTranslate);

      // Get the project ID for translation storage
      const [projectRow] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, project.slug))
        .limit(1);

      if (projectRow) {
        await upsertTranslations(
          "project",
          projectRow.id,
          "sv",
          svTranslations,
        );
      }

      result.synced++;
      syncedSlugs.push(project.slug);
      console.log(`  [done] ${project.slug} — tech: ${techNames.join(", ")}`);
    } catch (err) {
      const msg = `${project.slug}: ${err instanceof Error ? err.message : "Unknown error"}`;
      result.errors.push(msg);
      console.error(`  [error] ${msg}`);
    }
  }

  // Remove projects no longer in Dossier featured list
  if (syncedSlugs.length > 0) {
    const removed = await db
      .delete(projects)
      .where(notInArray(projects.slug, syncedSlugs))
      .returning({ slug: projects.slug });
    result.removed = removed.length;
    if (removed.length > 0) {
      console.log(
        `  [clean] Removed ${removed.length}: ${removed.map((r) => r.slug).join(", ")}`,
      );
    }
  }

  return result;
}

// ── Skills sync ───────────────────────────────────────

interface DossierSkill {
  name: string;
  categoryId: string;
  proficiency: string;
  visibility: string;
  featured: boolean;
  description?: string;
  notes?: string;
}

interface SkillContext {
  name: string;
  description?: string;
  notes?: string;
}

async function generateSkillDescriptions(
  skillContexts: SkillContext[],
  projectSummaries: { name: string; description: string; tech: string[] }[],
): Promise<Map<string, string>> {
  const anthropic = new Anthropic();

  const projectContext = projectSummaries
    .map((p) => `${p.name}: ${p.description} [Tech: ${p.tech.join(", ")}]`)
    .join("\n");

  const skillList = skillContexts
    .map((s) => {
      const parts = [s.name];
      if (s.description) parts.push(`desc: ${s.description}`);
      if (s.notes) parts.push(`notes: ${s.notes}`);
      return parts.length > 1
        ? `${parts[0]} (${parts.slice(1).join("; ")})`
        : parts[0];
    })
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `You generate short tooltip descriptions for skills on a developer portfolio. Return a JSON object mapping each skill name to its description.

Rules:
- First part: what the technology IS (factual, one clause).
- Second part (only if the provided projects clearly use this skill): how the developer has used it, with a couple of project names as examples (use "e.g." to indicate these are examples, not an exhaustive list).
- If no project connection is evident from the data, STOP after the factual description. No filler, no generic statements.
- Keep each description to 1-2 sentences maximum.
- Return ONLY the JSON object, no markdown fencing.`,
    messages: [
      {
        role: "user",
        content: `Projects:\n${projectContext}\n\nSkills:\n${skillList}`,
      },
    ],
  });

  let text =
    response.content[0].type === "text" ? response.content[0].text : "{}";
  // Strip markdown fencing if present
  text = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(text) as Record<string, string>;
    return new Map(Object.entries(parsed));
  } catch {
    console.error("Failed to parse skill descriptions:", text.slice(0, 200));
    return new Map();
  }
}

interface DossierCategory {
  id: string;
  name: string;
}

interface DossierDomain {
  categories: DossierCategory[];
}

interface DossierProfile {
  domains: DossierDomain[];
}

async function fetchCategoryMap(): Promise<Map<string, string>> {
  const res = await fetch(`${getDossierApiUrl()}/profile`, {
    headers: { Authorization: `Bearer ${getDossierApiKey()}` },
  });
  if (!res.ok) throw new Error(`Dossier profile API error: ${res.status}`);
  const profile = (await res.json()) as DossierProfile;

  const map = new Map<string, string>();
  for (const domain of profile.domains) {
    for (const cat of domain.categories) {
      map.set(cat.id, cat.name);
    }
  }
  return map;
}

export interface SkillsSyncResult {
  synced: number;
  removed: number;
  errors: string[];
}

// Track last skill description input hash to avoid unnecessary LLM calls
let lastSkillDescriptionHash: string | null = null;

export async function syncSkills(force = false): Promise<SkillsSyncResult> {
  const result: SkillsSyncResult = { synced: 0, removed: 0, errors: [] };

  // Fetch category names from Dossier profile
  const categoryMap = await fetchCategoryMap();

  // Fetch skills
  const res = await fetch(`${getDossierApiUrl()}/profile/skills`, {
    headers: { Authorization: `Bearer ${getDossierApiKey()}` },
  });
  if (!res.ok) throw new Error(`Dossier API error: ${res.status}`);
  const data = (await res.json()) as { skills: DossierSkill[] };

  // Filter: featured + public
  const filtered = data.skills.filter(
    (s) => s.featured && s.visibility === "public",
  );

  console.log(
    `Skills sync: ${filtered.length} featured+public skills from Dossier (${data.skills.length} total)`,
  );

  // Group by category for sort order
  const byCategory = new Map<string, DossierSkill[]>();
  for (const skill of filtered) {
    const cat = categoryMap.get(skill.categoryId) ?? skill.categoryId;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(skill);
  }

  const syncedKeys: string[] = [];

  for (const [category, categorySkills] of byCategory) {
    for (let i = 0; i < categorySkills.length; i++) {
      const skill = categorySkills[i];
      const key = `${skill.name}::${category}`;
      syncedKeys.push(key);

      try {
        const existing = await db
          .select()
          .from(skills)
          .where(
            and(eq(skills.name, skill.name), eq(skills.category, category)),
          )
          .limit(1);

        if (existing.length === 0) {
          await db.insert(skills).values({
            name: skill.name,
            category,
            sortOrder: i,
          });
        } else {
          await db
            .update(skills)
            .set({ sortOrder: i })
            .where(
              and(eq(skills.name, skill.name), eq(skills.category, category)),
            );
        }
        result.synced++;
      } catch (err) {
        result.errors.push(
          `${skill.name}: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    }
  }

  // Remove skills no longer featured in Dossier
  const allSkills = await db.select().from(skills);
  for (const existing of allSkills) {
    const key = `${existing.name}::${existing.category}`;
    if (!syncedKeys.includes(key)) {
      await db.delete(skills).where(eq(skills.id, existing.id));
      result.removed++;
    }
  }

  console.log(`  Synced: ${result.synced}, Removed: ${result.removed}`);

  // Generate descriptions via LLM (with hash-based caching)
  const skillContexts: SkillContext[] = filtered.map((s) => ({
    name: s.name,
    description: s.description,
    notes: s.notes,
  }));

  // Fetch projects for cross-referencing
  const projectRes = await fetch(
    `${getDossierApiUrl()}/profile/projects?featured=true`,
    { headers: { Authorization: `Bearer ${getDossierApiKey()}` } },
  );
  const projectData = projectRes.ok
    ? (
        (await projectRes.json()) as { projects: DossierProject[] }
      ).projects.map((p) => ({
        name: p.name,
        description: p.description,
        tech: [] as string[],
      }))
    : [];

  // Hash all LLM inputs to detect changes
  const descriptionInputHash = computeHash({
    skills: skillContexts,
    projects: projectData,
  });

  if (!force && descriptionInputHash === lastSkillDescriptionHash) {
    console.log("  Descriptions: skipped (inputs unchanged)");
  } else {
    console.log("  Generating skill descriptions...");
    const descriptions = await generateSkillDescriptions(
      skillContexts,
      projectData,
    );

    // Update skills with descriptions
    let descCount = 0;
    for (const [name, desc] of descriptions) {
      if (desc) {
        await db
          .update(skills)
          .set({ description: desc })
          .where(eq(skills.name, name));
        descCount++;
      }
    }
    // Translate skill descriptions to Swedish
    console.log("  Translating skill descriptions to Swedish...");
    const skillTexts: Record<string, string> = {};
    for (const [name, desc] of descriptions) {
      if (desc) skillTexts[name] = desc;
    }
    const svSkillDescs = await translateToSwedish(skillTexts);

    // Store translations
    const allDbSkills = await db
      .select({ id: skills.id, name: skills.name })
      .from(skills);
    const skillIdByName = new Map(allDbSkills.map((s) => [s.name, s.id]));
    let svCount = 0;
    for (const [name, svDesc] of Object.entries(svSkillDescs)) {
      const skillId = skillIdByName.get(name);
      if (skillId && svDesc) {
        await upsertTranslations("skill", skillId, "sv", {
          description: svDesc,
        });
        svCount++;
      }
    }
    console.log(`  Swedish translations: ${svCount}`);

    lastSkillDescriptionHash = descriptionInputHash;
    console.log(`  Descriptions: ${descCount} generated`);
  }

  return result;
}
