import { readFileSync } from "node:fs";
import { db } from "./index.js";
import { experience, education, profile, translations } from "./schema.js";
import { eq } from "drizzle-orm";

// ── Shape of seed content ──────────────────────────────────────────
// Canonical copy lives in the private dev repo (curios-dev/seed/content.json)
// and is injected at deploy time via SEED_CONTENT_PATH. Falls back to empty
// generic seed if not provided — the app works for anyone who clones this repo.

interface SeedExperience {
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string | null;
  tech: string[];
  sortOrder: number;
}

interface SeedEducation {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  sortOrder: number;
}

interface SeedProfile {
  name: string;
  title: string;
  bio: string;
  location: string;
  email: string;
  github: string;
  linkedin: string | null;
  website: string | null;
  birthDate: string | null;
  otherInfo: { en: string[]; sv: string[] } | null;
}

interface SvTranslation {
  entityType: "profile" | "experience" | "education" | "project";
  slug: string;
  field: string;
  value: string;
  translatedBy: "human" | "llm";
}

interface SeedContent {
  profile: SeedProfile;
  experience: SeedExperience[];
  education: SeedEducation[];
  svTranslations: SvTranslation[];
}

// ── Fallback content ──────────────────────────────────────────────
// Used when SEED_CONTENT_PATH is not provided. Keeps the code runnable for
// forkers and CI checks without leaking anyone's identity.

const FALLBACK_PROFILE: SeedProfile = {
  name: "Test User",
  title: "Full Stack Developer",
  bio: "Placeholder bio. Point SEED_CONTENT_PATH at a real content.json to populate.",
  location: "Example City, Country",
  email: "test@example.com",
  github: "https://github.com/example",
  linkedin: null,
  website: null,
  birthDate: null,
  otherInfo: null,
};

const FALLBACK_CONTENT: SeedContent = {
  profile: FALLBACK_PROFILE,
  experience: [],
  education: [],
  svTranslations: [],
};

function loadContent(): SeedContent {
  // CI injects the content as a JSON string via env var; local dev points at a file.
  const jsonEnv = process.env.SEED_CONTENT_JSON;
  if (jsonEnv) {
    try {
      return JSON.parse(jsonEnv) as SeedContent;
    } catch (err) {
      throw new Error(
        `Failed to parse SEED_CONTENT_JSON: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  const path = process.env.SEED_CONTENT_PATH;
  if (!path) {
    console.log(
      "SEED_CONTENT_PATH / SEED_CONTENT_JSON not set — using fallback generic seed content.",
    );
    return FALLBACK_CONTENT;
  }
  try {
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw) as SeedContent;
  } catch (err) {
    throw new Error(
      `Failed to read SEED_CONTENT_PATH=${path}: ${err instanceof Error ? err.message : err}`,
    );
  }
}

// ── Upsert helpers ────────────────────────────────────────────────

async function upsertByKey<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  items: T[],
  keyField: keyof T & string,
  tableRef: Record<string, unknown>,
  label: string,
) {
  let inserted = 0;
  let updated = 0;

  for (const item of items) {
    const keyCol = (tableRef as Record<string, unknown>)[
      keyField
    ] as Parameters<typeof eq>[0];
    const existing = await db
      .select()
      .from(table)
      .where(eq(keyCol, item[keyField] as string))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(table).values(item as Record<string, unknown>);
      inserted++;
    } else {
      const { [keyField]: _, ...updateFields } = item;
      await db
        .update(table)
        .set(updateFields as Record<string, unknown>)
        .where(eq(keyCol, item[keyField] as string));
      updated++;
    }
  }
  console.log(`  ${label}: ${inserted} inserted, ${updated} updated`);
}

async function seedTranslations(content: SeedContent) {
  const allExperience = await db.select().from(experience);
  const allEducation = await db.select().from(education);
  const allProfile = await db.select().from(profile).limit(1);

  const experienceIdByCompany = new Map(
    allExperience.map((e) => [e.company, e.id]),
  );
  const educationIdByInstitution = new Map(
    allEducation.map((e) => [e.institution, e.id]),
  );
  const profileId = allProfile[0]?.id;

  let count = 0;

  for (const t of content.svTranslations) {
    let entityId: string | undefined;

    if (t.entityType === "project") continue; // handled by sync
    if (t.entityType === "experience") {
      entityId = experienceIdByCompany.get(t.slug);
    } else if (t.entityType === "education") {
      entityId = educationIdByInstitution.get(t.slug);
    } else if (t.entityType === "profile") {
      entityId = profileId;
    }

    if (!entityId) {
      console.log(
        `  Translation: skipped ${t.entityType}/${t.slug}/${t.field} (entity not found)`,
      );
      continue;
    }

    await db
      .insert(translations)
      .values({
        entityType: t.entityType,
        entityId,
        locale: "sv",
        field: t.field,
        value: t.value,
        translatedBy: t.translatedBy,
      })
      .onConflictDoNothing();

    count++;
  }

  console.log(`  Translations: ${count} Swedish translations seeded`);
}

// ── Entry point ───────────────────────────────────────────────────

async function seed() {
  console.log("Seeding database...");
  const content = loadContent();

  await upsertByKey(
    experience,
    content.experience,
    "company",
    experience,
    "Experience",
  );

  await upsertByKey(
    education,
    content.education,
    "institution",
    education,
    "Education",
  );

  const existingProfile = await db.select().from(profile).limit(1);
  if (existingProfile.length === 0) {
    await db.insert(profile).values(content.profile);
    console.log("  Profile: inserted");
  } else {
    await db
      .update(profile)
      .set(content.profile)
      .where(eq(profile.id, existingProfile[0].id));
    console.log("  Profile: updated");
  }

  await seedTranslations(content);

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
