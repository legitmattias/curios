import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ProjectSchema } from "@curios/shared/schemas";
import { db } from "../db/index.js";
import { projects, skills } from "../db/schema.js";
import { asc, eq, inArray } from "drizzle-orm";
import {
  applyTranslations,
  applyTranslationsSingle,
} from "../services/translation-helper.js";

const PROJECT_TRANSLATABLE = ["title", "description"];

/** Look up skill descriptions for tech tag names */
async function enrichTech(
  techNames: string[],
): Promise<{ name: string; description: string | null }[]> {
  if (techNames.length === 0) return [];

  const matchingSkills = await db
    .select({ name: skills.name, description: skills.description })
    .from(skills)
    .where(inArray(skills.name, techNames));

  const descByName = new Map(
    matchingSkills.map((s) => [s.name, s.description]),
  );

  return techNames.map((name) => ({
    name,
    description: descByName.get(name) ?? null,
  }));
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

  const mapped = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      tech: await enrichTech(row.tech),
      url: row.url ?? undefined,
      repo: row.repo ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  );

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
  const mapped = {
    ...row,
    tech: await enrichTech(row.tech),
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
