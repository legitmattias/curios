import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'

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
