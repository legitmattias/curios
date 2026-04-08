import { db } from '../db/index.js'
import { translations } from '../db/schema.js'
import { eq, and, inArray } from 'drizzle-orm'
import type { TranslationMeta } from '@curios/shared/types'

/**
 * Apply translations to entity rows.
 * If locale is 'en' (source language), returns rows unchanged with no meta.
 * Otherwise, fetches translations and overlays them onto the rows.
 */
export async function applyTranslations<T extends { id: string }>(
  entityType: string,
  rows: T[],
  locale: string,
  translatableFields: string[],
): Promise<{ data: T[]; translationMeta?: TranslationMeta }> {
  if (locale === 'en' || rows.length === 0) {
    return { data: rows }
  }

  const entityIds = rows.map((r) => r.id)

  const translationRows = await db
    .select()
    .from(translations)
    .where(
      and(
        eq(translations.entityType, entityType),
        inArray(translations.entityId, entityIds),
        eq(translations.locale, locale),
      ),
    )

  if (translationRows.length === 0) {
    return { data: rows }
  }

  // Build lookup: entityId -> field -> { value, translatedBy, translatedAt }
  const lookup = new Map<string, Map<string, (typeof translationRows)[0]>>()
  for (const t of translationRows) {
    if (!lookup.has(t.entityId)) lookup.set(t.entityId, new Map())
    lookup.get(t.entityId)!.set(t.field, t)
  }

  const translationMeta: TranslationMeta = {}

  const translated = rows.map((row) => {
    const fieldMap = lookup.get(row.id)
    if (!fieldMap) return row

    const copy = { ...row }
    for (const field of translatableFields) {
      const t = fieldMap.get(field)
      if (t) {
        ;(copy as Record<string, unknown>)[field] = t.value
        translationMeta[`${row.id}:${field}`] = {
          translatedBy: t.translatedBy as 'human' | 'llm',
          translatedAt: t.translatedAt.toISOString(),
        }
      }
    }
    return copy
  })

  return { data: translated, translationMeta }
}

/**
 * Apply translations to a single entity.
 */
export async function applyTranslationsSingle<T extends { id: string }>(
  entityType: string,
  row: T,
  locale: string,
  translatableFields: string[],
): Promise<{ data: T; translationMeta?: TranslationMeta }> {
  const result = await applyTranslations(entityType, [row], locale, translatableFields)
  return { data: result.data[0], translationMeta: result.translationMeta }
}
