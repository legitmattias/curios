import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db/index.js";
import { translations } from "../db/schema.js";
import { and, eq } from "drizzle-orm";

// LLM-translates a flat map of EN strings to SV. Keys preserved.
// Returns {} if the LLM response is unparseable.
export async function translateToSwedish(
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

// Upserts translated field values into the translations table for one entity.
// Skips empty values. Returns the count of fields written.
export async function upsertTranslations(
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

    // onConflictDoNothing means we need a separate update for the case where
    // the row already existed.
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
