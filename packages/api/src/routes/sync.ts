import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { syncProjects, syncSkills } from "../services/project-sync.js";
import { syncCvSkills } from "../services/cv-skills-sync.js";
import { syncCvProjects } from "../services/cv-projects-sync.js";
import { syncLanguages } from "../services/language-sync.js";
import {
  recordSyncStart,
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

// Runs fn and records its outcome in sync_state. Intended to be invoked
// as `void runInBackground(...)` after `await recordSyncStart(op)` so the
// handler can return 202 while the UI observes completion via polling.
async function runInBackground<T>(
  operation: SyncOperation,
  fn: () => Promise<T>,
): Promise<void> {
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = performance.now() - start;
    await recordSyncSuccess({ operation, durationMs, result });
  } catch (err) {
    const durationMs = performance.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[sync ${operation}] failed:`, err);
    await recordSyncError({ operation, durationMs, message }).catch((logErr) =>
      console.error("Failed to record sync error:", logErr),
    );
  }
}

// Writes the "running" marker, kicks off the work in the background, and
// responds 202. A failure to record the start marker is the only case that
// surfaces as 500 — actual job errors land in sync_state instead.
async function startSync<T>(
  c: Context,
  operation: SyncOperation,
  fn: () => Promise<T>,
) {
  try {
    await recordSyncStart(operation);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json(
      { error: `Could not mark ${operation} running: ${message}` },
      500,
    );
  }
  // Fire-and-forget: errors are recorded into sync_state inside runInBackground.
  void runInBackground(operation, fn);
  return c.json({ started: true, operation }, 202);
}

syncRoute.post("/projects", async (c) => {
  const force = c.req.query("force") === "true";
  return startSync(c, "projects", () => syncProjects(force));
});

syncRoute.post("/skills", async (c) => {
  const force = c.req.query("force") === "true";
  return startSync(c, "skills", () => syncSkills(force));
});

syncRoute.post("/cv-skills", async (c) => {
  return startSync(c, "cv-skills", () => syncCvSkills());
});

syncRoute.post("/languages", async (c) => {
  return startSync(c, "languages", () => syncLanguages());
});

syncRoute.post("/cv-projects", async (c) => {
  return startSync(c, "cv-projects", () => syncCvProjects());
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
