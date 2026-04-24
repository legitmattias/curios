import { db } from "../db/index.js";
import { profile } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getProficiencyRank } from "@curios/shared/i18n";
import { dossierGet } from "./dossier-http.js";

interface DossierSkill {
  name: string;
  categoryId: string;
  proficiency: string;
  proficiencyLabel?: string | null;
  visibility: string;
  featured: boolean;
  description?: string;
  notes?: string;
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

interface LanguageSyncResult {
  languages: number;
  skipped: number;
  errors: string[];
}

const SPOKEN_LANGUAGES_CATEGORY = "Spoken Languages";

async function fetchCategoryMap(): Promise<Map<string, string>> {
  const res = await dossierGet("/profile");
  if (!res.ok) throw new Error(`Dossier /profile returned ${res.status}`);
  const data = (await res.json()) as DossierProfile;
  const map = new Map<string, string>();
  for (const domain of data.domains) {
    for (const cat of domain.categories) {
      map.set(cat.id, cat.name);
    }
  }
  return map;
}

/**
 * Fetch featured spoken languages from Dossier and store them on
 * `profile.languages`, sorted by proficiency rank (most proficient first).
 * Unfeaturing a language in Dossier removes it from the CV on the next sync.
 */
export async function syncLanguages(): Promise<LanguageSyncResult> {
  const errors: string[] = [];

  const categoryMap = await fetchCategoryMap();

  const res = await dossierGet("/profile/skills");
  if (!res.ok)
    throw new Error(`Dossier /profile/skills returned ${res.status}`);
  const data = (await res.json()) as { skills: DossierSkill[] };

  const featuredSpoken = data.skills.filter((s) => {
    if (!s.featured || s.visibility !== "public") return false;
    const cat = categoryMap.get(s.categoryId);
    return cat === SPOKEN_LANGUAGES_CATEGORY;
  });

  const skipped = data.skills.filter((s) => {
    const cat = categoryMap.get(s.categoryId);
    return (
      cat === SPOKEN_LANGUAGES_CATEGORY &&
      (!s.featured || s.visibility !== "public")
    );
  }).length;

  // Prefer the user's custom proficiency label (e.g. "native" overriding
  // the default "expert") when set in Dossier.
  const resolveProficiency = (s: DossierSkill): string =>
    (s.proficiencyLabel ?? s.proficiency).toLowerCase();

  // Sort by proficiency rank (lower rank = more proficient)
  const sorted = [...featuredSpoken].sort(
    (a, b) =>
      getProficiencyRank(resolveProficiency(a)) -
      getProficiencyRank(resolveProficiency(b)),
  );

  const toStore = sorted.map((s) => ({
    name: s.name,
    proficiency: resolveProficiency(s),
  }));

  const profileRows = await db.select().from(profile).limit(1);
  const profileId = profileRows[0]?.id;
  if (!profileId) {
    throw new Error("Profile row not found — seed must run first");
  }

  await db
    .update(profile)
    .set({ languages: toStore })
    .where(eq(profile.id, profileId));

  console.log(
    `  Languages: ${toStore.length} featured stored${skipped > 0 ? ` (${skipped} non-featured skipped)` : ""}`,
  );

  return { languages: toStore.length, skipped, errors };
}
