import { pgTable, uuid, varchar, text, timestamp, integer, date, unique } from 'drizzle-orm/pg-core'

export const projects = pgTable('projects', {
  id: uuid().defaultRandom().primaryKey(),
  slug: varchar({ length: 128 }).unique().notNull(),
  title: varchar({ length: 256 }).notNull(),
  description: text().notNull(),
  tech: text().array().notNull(),
  url: varchar({ length: 512 }),
  repo: varchar({ length: 512 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const skills = pgTable('skills', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 128 }).notNull(),
  category: varchar({ length: 64 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const experience = pgTable('experience', {
  id: uuid().defaultRandom().primaryKey(),
  company: varchar({ length: 256 }).notNull(),
  role: varchar({ length: 256 }).notNull(),
  description: text().notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  tech: text().array().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const education = pgTable('education', {
  id: uuid().defaultRandom().primaryKey(),
  institution: varchar({ length: 256 }).notNull(),
  degree: varchar({ length: 256 }).notNull(),
  field: varchar({ length: 256 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  description: text(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const translations = pgTable('translations', {
  id: uuid().defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 64 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  locale: varchar({ length: 8 }).notNull(),
  field: varchar({ length: 64 }).notNull(),
  value: text().notNull(),
  translatedBy: varchar('translated_by', { length: 16 }).notNull(),
  translatedAt: timestamp('translated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique('translations_unique').on(table.entityType, table.entityId, table.locale, table.field),
])

export const profile = pgTable('profile', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 128 }).notNull(),
  title: varchar({ length: 256 }).notNull(),
  bio: text().notNull(),
  location: varchar({ length: 128 }).notNull(),
  email: varchar({ length: 256 }).notNull(),
  github: varchar({ length: 512 }).notNull(),
  linkedin: varchar({ length: 512 }),
  website: varchar({ length: 512 }),
})
