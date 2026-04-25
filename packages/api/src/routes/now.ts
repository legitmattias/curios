import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { nowGoals } from "../db/schema.js";
import { applyTranslations } from "../services/translation-helper.js";

const nowRoute = new OpenAPIHono();

const NowGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  priority: z.enum(["high", "medium", "low"]),
  progress: z.number().min(0).max(100).nullable(),
});

const NOW_GOAL_TRANSLATABLE = ["description"];

const route = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: z.array(NowGoalSchema) }),
        },
      },
      description: "Current focus goals, ordered by priority (sorted at sync)",
    },
  },
});

nowRoute.openapi(route, async (c) => {
  const lang = c.req.query("lang") ?? "en";
  const rows = await db
    .select({
      id: nowGoals.id,
      name: nowGoals.name,
      description: nowGoals.description,
      priority: nowGoals.priority,
      progress: nowGoals.progress,
    })
    .from(nowGoals)
    .orderBy(asc(nowGoals.sortOrder));

  const result = await applyTranslations(
    "now_goal",
    rows,
    lang,
    NOW_GOAL_TRANSLATABLE,
  );

  // Schema requires the priority enum to match — Drizzle returns it as
  // string, narrow at the boundary.
  const data = result.data.map((g) => ({
    ...g,
    priority: g.priority as "high" | "medium" | "low",
  }));

  return c.json({
    data,
    translationMeta: result.translationMeta,
  });
});

export { nowRoute };
