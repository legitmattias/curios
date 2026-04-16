import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ProjectSchema } from "@curios/shared/schemas";
import { db } from "../db/index.js";
import { projects, translations } from "../db/schema.js";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  applyTranslations,
  applyTranslationsSingle,
} from "../services/translation-helper.js";

const PROJECT_TRANSLATABLE = ["title", "description"];

/** Build enriched tech array from DB tech names + descriptions, with locale overlay */
function buildTech(
  techNames: string[],
  techDescriptions: Record<string, string> | null,
  techTranslations?: Map<string, string>,
): { name: string; description: string | null }[] {
  return techNames.map((name) => ({
    name,
    description:
      techTranslations?.get(name) ?? techDescriptions?.[name] ?? null,
  }));
}

/** Fetch tech_desc:* translations for given project IDs */
async function fetchTechTranslations(
  projectIds: string[],
  locale: string,
): Promise<Map<string, Map<string, string>>> {
  if (locale === "en" || projectIds.length === 0) return new Map();

  const rows = await db
    .select()
    .from(translations)
    .where(
      and(
        eq(translations.entityType, "project"),
        inArray(translations.entityId, projectIds),
        eq(translations.locale, locale),
      ),
    );

  const result = new Map<string, Map<string, string>>();
  for (const row of rows) {
    if (!row.field.startsWith("tech_desc:")) continue;
    const techName = row.field.slice("tech_desc:".length);
    if (!result.has(row.entityId)) result.set(row.entityId, new Map());
    result.get(row.entityId)!.set(techName, row.value);
  }
  return result;
}

const projectsRoute = new OpenAPIHono();

const listRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(ProjectSchema),
          }),
        },
      },
      description: "List all projects",
    },
  },
});

projectsRoute.openapi(listRoute, async (c) => {
  const lang = c.req.query("lang") ?? "en";
  const rows = await db
    .select()
    .from(projects)
    .orderBy(asc(projects.sortOrder));

  const techTrans = await fetchTechTranslations(
    rows.map((r) => r.id),
    lang,
  );

  const mapped = rows.map((row) => ({
    ...row,
    tech: buildTech(row.tech, row.techDescriptions, techTrans.get(row.id)),
    url: row.url ?? undefined,
    repo: row.repo ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  const result = await applyTranslations(
    "project",
    mapped,
    lang,
    PROJECT_TRANSLATABLE,
  );
  return c.json({ data: result.data, translationMeta: result.translationMeta });
});

const getBySlugRoute = createRoute({
  method: "get",
  path: "/{slug}",
  request: {
    params: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: ProjectSchema,
          }),
        },
      },
      description: "Get a project by slug",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            message: z.string(),
            statusCode: z.number(),
          }),
        },
      },
      description: "Project not found",
    },
  },
});

projectsRoute.openapi(getBySlugRoute, async (c) => {
  const { slug } = c.req.valid("param");
  const lang = c.req.query("lang") ?? "en";
  const rows = await db.select().from(projects).where(eq(projects.slug, slug));

  if (rows.length === 0) {
    return c.json(
      {
        error: "Not Found",
        message: `Project '${slug}' not found`,
        statusCode: 404,
      },
      404,
    );
  }

  const row = rows[0];
  const techTrans = await fetchTechTranslations([row.id], lang);
  const mapped = {
    ...row,
    tech: buildTech(row.tech, row.techDescriptions, techTrans.get(row.id)),
    url: row.url ?? undefined,
    repo: row.repo ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  const result = await applyTranslationsSingle(
    "project",
    mapped,
    lang,
    PROJECT_TRANSLATABLE,
  );
  return c.json({ data: result.data, translationMeta: result.translationMeta });
});

export { projectsRoute };
