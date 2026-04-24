import { OpenAPIHono } from "@hono/zod-openapi";
import { syncProjects, syncSkills } from "../services/project-sync.js";
import { syncCvSkills } from "../services/cv-skills-sync.js";
import { syncCvProjects } from "../services/cv-projects-sync.js";
import { syncLanguages } from "../services/language-sync.js";
import {
  recordSyncSuccess,
  recordSyncError,
  listSyncState,
  type SyncOperation,
} from "../services/sync-state.js";
import { db } from "../db/index.js";
import { projects } from "../db/schema.js";
import { eq } from "drizzle-orm";

const syncRoute = new OpenAPIHono();

// All /api/sync/* endpoints require DOSSIER_API_KEY as bearer token.
syncRoute.use("*", async (c, next) => {
  const auth = c.req.header("Authorization");
  const expected = process.env.DOSSIER_API_KEY;
  if (!expected || auth !== `Bearer ${expected}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

// Runs a sync function and records the outcome in sync_state so the admin
// panel's "Last run" column survives page reloads / server restarts.
async function runAndRecord<T>(
  operation: SyncOperation,
  fn: () => Promise<T>,
): Promise<{ ok: true; result: T } | { ok: false; error: string }> {
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = performance.now() - start;
    await recordSyncSuccess({ operation, durationMs, result }).catch((err) =>
      console.error("Failed to record sync success:", err),
    );
    return { ok: true, result };
  } catch (err) {
    const durationMs = performance.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    await recordSyncError({ operation, durationMs, message }).catch((logErr) =>
      console.error("Failed to record sync error:", logErr),
    );
    return { ok: false, error: message };
  }
}

syncRoute.post("/projects", async (c) => {
  const force = c.req.query("force") === "true";
  const outcome = await runAndRecord("projects", () => syncProjects(force));
  if (!outcome.ok) return c.json({ error: outcome.error }, 500);
  return c.json(outcome.result);
});

syncRoute.post("/skills", async (c) => {
  const force = c.req.query("force") === "true";
  const outcome = await runAndRecord("skills", () => syncSkills(force));
  if (!outcome.ok) return c.json({ error: outcome.error }, 500);
  return c.json(outcome.result);
});

syncRoute.post("/cv-skills", async (c) => {
  const outcome = await runAndRecord("cv-skills", () => syncCvSkills());
  if (!outcome.ok) return c.json({ error: outcome.error }, 500);
  return c.json(outcome.result);
});

syncRoute.post("/languages", async (c) => {
  const outcome = await runAndRecord("languages", () => syncLanguages());
  if (!outcome.ok) return c.json({ error: outcome.error }, 500);
  return c.json(outcome.result);
});

syncRoute.post("/cv-projects", async (c) => {
  const outcome = await runAndRecord("cv-projects", () => syncCvProjects());
  if (!outcome.ok) return c.json({ error: outcome.error }, 500);
  return c.json(outcome.result);
});

// Returns the latest recorded state of every sync operation. Admin panel
// hydrates its row list from this so timestamps persist across reloads.
syncRoute.get("/state", async (c) => {
  const rows = await listSyncState();
  return c.json({ data: rows });
});

// Set project display order — slugs not listed get pushed to end.
syncRoute.patch("/projects/order", async (c) => {
  try {
    const slugOrder = (await c.req.json()) as string[];
    if (
      !Array.isArray(slugOrder) ||
      !slugOrder.every((s) => typeof s === "string")
    ) {
      return c.json({ error: "Body must be an array of slug strings" }, 400);
    }

    for (let i = 0; i < slugOrder.length; i++) {
      await db
        .update(projects)
        .set({ sortOrder: i })
        .where(eq(projects.slug, slugOrder[i]));
    }

    const allRows = await db.select({ slug: projects.slug }).from(projects);
    const unlisted = allRows
      .filter((r) => !slugOrder.includes(r.slug))
      .sort((a, b) => a.slug.localeCompare(b.slug));

    for (let i = 0; i < unlisted.length; i++) {
      await db
        .update(projects)
        .set({ sortOrder: slugOrder.length + i })
        .where(eq(projects.slug, unlisted[i].slug));
    }

    return c.json({
      ordered: slugOrder,
      remaining: unlisted.map((r) => r.slug),
    });
  } catch (err) {
    console.error("Reorder failed:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Reorder failed" },
      500,
    );
  }
});

export { syncRoute };
