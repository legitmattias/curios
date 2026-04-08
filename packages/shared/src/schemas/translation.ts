import { z } from 'zod'

export const TranslationInfoSchema = z.object({
  translatedBy: z.enum(['human', 'llm']),
  translatedAt: z.string().datetime(),
})

export type TranslationInfo = z.infer<typeof TranslationInfoSchema>

/**
 * Translation metadata map.
 * Keys are "entityId:field" strings.
 * Only present in responses when translations are applied.
 */
export const TranslationMetaSchema = z.record(z.string(), TranslationInfoSchema)

export type TranslationMeta = z.infer<typeof TranslationMetaSchema>
