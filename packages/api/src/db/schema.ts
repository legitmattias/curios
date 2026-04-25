import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  date,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid().defaultRandom().primaryKey(),
  slug: varchar({ length: 128 }).unique().notNull(),
  title: varchar({ length: 256 }).notNull(),
  description: text().notNull(),
  tech: text().array().notNull(),
  techDescriptions: jsonb("tech_descriptions").$type<Record<string, string>>(),
  url: varchar({ length: 512 }),
  repo: varchar({ length: 512 }),
  sortOrder: integer("sort_order").notNull().default(0),
  contentHash: varchar("content_hash", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const skills = pgTable("skills", {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 128 }).notNull(),
  category: varchar({ length: 64 }).notNull(),
  description: text(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const experience = pgTable("experience", {
  id: uuid().defaultRandom().primaryKey(),
  company: varchar({ length: 256 }).notNull(),
  role: varchar({ length: 256 }).notNull(),
  description: text().notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  tech: text().array().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const education = pgTable("education", {
  id: uuid().defaultRandom().primaryKey(),
  institution: varchar({ length: 256 }).notNull(),
  degree: varchar({ length: 256 }).notNull(),
  field: varchar({ length: 256 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  description: text(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const nowGoals = pgTable("now_goals", {
  id: uuid().defaultRandom().primaryKey(),
  // Dossier's goal id — kept so we can match against upstream and reuse it
  // as the translations table's entity_id for stable per-goal SV strings.
  dossierId: varchar("dossier_id", { length: 64 }).notNull().unique(),
  name: varchar({ length: 256 }).notNull(),
  description: text(),
  priority: varchar({ length: 16 }).notNull(),
  progress: integer(),
  sortOrder: integer("sort_order").notNull().default(0),
  contentHash: varchar("content_hash", { length: 64 }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const translations = pgTable(
  "translations",
  {
    id: uuid().defaultRandom().primaryKey(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    locale: varchar({ length: 8 }).notNull(),
    field: varchar({ length: 64 }).notNull(),
    value: text().notNull(),
    translatedBy: varchar("translated_by", { length: 16 }).notNull(),
    translatedAt: timestamp("translated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("translations_unique").on(
      table.entityType,
      table.entityId,
      table.locale,
      table.field,
    ),
  ],
);

// Tracks the most recent run of each sync operation (admin panel reads this).
export const syncState = pgTable("sync_state", {
  operation: varchar({ length: 64 }).primaryKey(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastDurationMs: integer("last_duration_ms"),
  lastStatus: varchar("last_status", { length: 16 }).notNull(),
  lastResult: jsonb("last_result"),
  lastError: text("last_error"),
});

export const profile = pgTable("profile", {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 128 }).notNull(),
  title: varchar({ length: 256 }).notNull(),
  bio: text().notNull(),
  location: varchar({ length: 128 }).notNull(),
  email: varchar({ length: 256 }).notNull(),
  github: varchar({ length: 512 }).notNull(),
  linkedin: varchar({ length: 512 }),
  website: varchar({ length: 512 }),
  birthDate: date("birth_date"),
  cvSkills: jsonb("cv_skills").$type<{
    en: Array<{ category: string; summary: string }>;
    sv: Array<{ category: string; summary: string }>;
  }>(),
  cvProjects: jsonb("cv_projects").$type<{
    en: Array<{
      slug: string;
      title: string;
      summary: string;
      tech: string[];
    }>;
    sv: Array<{
      slug: string;
      title: string;
      summary: string;
      tech: string[];
    }>;
  }>(),
  otherInfo: jsonb("other_info").$type<{
    en: string[];
    sv: string[];
  }>(),
  languages:
    jsonb("languages").$type<Array<{ name: string; proficiency: string }>>(),
});
