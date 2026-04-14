import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db/index.js";
import { projects, skills } from "../db/schema.js";
import { and, eq, notInArray } from "drizzle-orm";
import { createHash } from "crypto";

interface DossierProject {
  slug: string;
  name: string;
  description: string;
  url?: string;
  visibility: string;
  featured: boolean;
}

interface LlmProjectSummary {
  summary: string;
  tech: string[];
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

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: context,
      },
    ],
    system: `You generate portfolio descriptions for software projects. Return a JSON object with exactly two fields:

1. "summary": A concise, compelling 2-3 sentence description for a portfolio site. Focus on what it does, what makes it interesting, and the technical approach. Write for recruiters and senior developers. No filler, no clichés.

2. "tech": An array of the most important technologies, frameworks, and tools used. Be specific (e.g. "SvelteKit" not "JavaScript", "Drizzle ORM" not "ORM"). Include 3-8 items, ordered by importance. Only include tech that is actually used — infer from the README, dependencies, and description.

Return ONLY the JSON object, no markdown fencing.`,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  try {
    const parsed = JSON.parse(text) as LlmProjectSummary;
    if (!parsed.summary || !Array.isArray(parsed.tech)) {
      throw new Error("Invalid LLM response structure");
    }
    return parsed;
  } catch {
    console.error("Failed to parse LLM response:", text);
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

export async function syncProjects(): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, skipped: 0, removed: 0, errors: [] };

  // Fetch featured projects from Dossier
  const dossierProjects = await fetchDossierProjects();
  console.log(`Sync: ${dossierProjects.length} featured projects from Dossier`);

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

      if (existing.length > 0 && existing[0].contentHash === hash) {
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
      );

      // Upsert into database
      await db
        .insert(projects)
        .values({
          slug: project.slug,
          title: project.name,
          description: summary,
          tech,
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
            tech,
            url: project.url ?? null,
            repo: project.url ?? null,
            contentHash: hash,
            updatedAt: new Date(),
          },
        });

      result.synced++;
      syncedSlugs.push(project.slug);
      console.log(`  [done] ${project.slug} — tech: ${tech.join(", ")}`);
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

export async function syncSkills(): Promise<SkillsSyncResult> {
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

  return result;
}
