import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { dossierGet } from "../services/dossier-http.js";

const nowRoute = new OpenAPIHono();

const NowGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  priority: z.enum(["high", "medium", "low"]),
  progress: z.number().min(0).max(100).nullable(),
});

type NowGoal = z.infer<typeof NowGoalSchema>;

interface DossierGoal {
  id: string;
  name: string;
  description?: string | null;
  priority: "high" | "medium" | "low";
  visibility: string;
  featured?: boolean;
  status: string;
  progress?: Array<{ percentage?: number }>;
}

const PRIORITY_ORDER: Record<"high" | "medium" | "low", number> = {
  high: 0,
  medium: 1,
  low: 2,
};

async function fetchDossierGoals(): Promise<DossierGoal[]> {
  const res = await dossierGet("/profile/goals");
  if (!res.ok) throw new Error(`Dossier /profile/goals returned ${res.status}`);
  const data = (await res.json()) as { goals: DossierGoal[] };
  return data.goals;
}

// Newest non-zero progress entry if any.
function latestProgress(goal: DossierGoal): number | null {
  if (!goal.progress || goal.progress.length === 0) return null;
  const last = goal.progress[goal.progress.length - 1];
  return typeof last.percentage === "number" ? last.percentage : null;
}

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
      description:
        "Current focus — active public goals, highest priority first",
    },
  },
});

nowRoute.openapi(route, async (c) => {
  const goals = await fetchDossierGoals();

  // Prefer featured goals when Dossier has any curated; otherwise fall back
  // to all active public goals so the card isn't empty.
  const active = goals.filter(
    (g) => g.status === "active" && g.visibility === "public",
  );
  const featured = active.filter((g) => g.featured);
  const pool = featured.length > 0 ? featured : active;

  const result: NowGoal[] = pool
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, 8)
    .map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description ?? null,
      priority: g.priority,
      progress: latestProgress(g),
    }));

  return c.json({ data: result });
});

export { nowRoute };
