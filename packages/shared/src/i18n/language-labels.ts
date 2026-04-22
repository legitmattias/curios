/**
 * Single source of truth for:
 *   - proficiency labels (Dossier stores a lowercase string; we translate here)
 *   - spoken-language display names in EN and SV
 *
 * Both the API (language sync / CV renderer) and the web (display) import from here.
 * Adding a new proficiency level or language? Add one entry — don't hardcode a
 * translation anywhere else.
 */

export interface ProficiencyEntry {
  rank: number; // lower = more proficient (native is 1)
  en: string;
  sv: string;
}

/**
 * Dossier's default proficiency set plus the custom labels used in this profile.
 * Keys are lowercase; the proficiency string from Dossier is lowercased before lookup.
 */
export const PROFICIENCY_LABELS = {
  native: { rank: 1, en: "Native", sv: "Modersmål" },
  expert: { rank: 2, en: "Expert", sv: "Expert" },
  fluent: { rank: 3, en: "Fluent", sv: "Flytande" },
  advanced: { rank: 4, en: "Advanced", sv: "Avancerad" },
  familiar: { rank: 5, en: "Familiar", sv: "Grundläggande" },
  novice: { rank: 6, en: "Novice", sv: "Nybörjare" },
  proficient: { rank: 3, en: "Proficient", sv: "Kompetent" },
  working: { rank: 5, en: "Working knowledge", sv: "Grundläggande" },
  learning: { rank: 6, en: "Learning", sv: "Under inlärning" },
} as const satisfies Record<string, ProficiencyEntry>;

export type ProficiencyKey = keyof typeof PROFICIENCY_LABELS;

/**
 * English → Swedish display name for spoken languages.
 * Unknown languages fall through to the English name.
 */
export const LANGUAGE_NAME_SV: Record<string, string> = {
  Swedish: "Svenska",
  English: "Engelska",
  Danish: "Danska",
  Norwegian: "Norska",
  "Danish / Norwegian": "Danska / Norska",
  German: "Tyska",
  Italian: "Italienska",
  French: "Franska",
  Spanish: "Spanska",
  Finnish: "Finska",
  Portuguese: "Portugisiska",
  Dutch: "Nederländska",
  Russian: "Ryska",
};

export function getProficiencyLabel(
  proficiency: string,
  lang: "en" | "sv",
): string {
  const entry = PROFICIENCY_LABELS[proficiency.toLowerCase() as ProficiencyKey];
  return entry ? entry[lang] : proficiency;
}

export function getProficiencyRank(proficiency: string): number {
  const entry = PROFICIENCY_LABELS[proficiency.toLowerCase() as ProficiencyKey];
  return entry ? entry.rank : 99;
}

export function getLanguageName(name: string, lang: "en" | "sv"): string {
  if (lang === "en") return name;
  return LANGUAGE_NAME_SV[name] ?? name;
}
