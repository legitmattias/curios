import { OpenAPIHono } from "@hono/zod-openapi";
import { syncProjects, syncSkills } from "../services/project-sync.js";
import { db } from "../db/index.js";
import { projects } from "../db/schema.js";
import { eq } from "drizzle-orm";

const syncRoute = new OpenAPIHono();

// Protected sync endpoint — requires DOSSIER_API_KEY as bearer token
syncRoute.post("/projects", async (c) => {
  const auth = c.req.header("Authorization");
  const expected = process.env.DOSSIER_API_KEY;

  if (!expected || auth !== `Bearer ${expected}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const result = await syncProjects();
    return c.json(result);
  } catch (err) {
    console.error("Sync failed:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      500,
    );
  }
});

// Sync skills from Dossier (proficient+ public skills with mapped categories)
syncRoute.post("/skills", async (c) => {
  const auth = c.req.header("Authorization");
  const expected = process.env.DOSSIER_API_KEY;

  if (!expected || auth !== `Bearer ${expected}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const result = await syncSkills();
    return c.json(result);
  } catch (err) {
    console.error("Skills sync failed:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      500,
    );
  }
});

// Set project display order — slugs not listed get pushed to end
syncRoute.patch("/projects/order", async (c) => {
  const auth = c.req.header("Authorization");
  const expected = process.env.DOSSIER_API_KEY;

  if (!expected || auth !== `Bearer ${expected}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const slugOrder = (await c.req.json()) as string[];
    if (
      !Array.isArray(slugOrder) ||
      !slugOrder.every((s) => typeof s === "string")
    ) {
      return c.json({ error: "Body must be an array of slug strings" }, 400);
    }

    // Set sortOrder for listed slugs
    for (let i = 0; i < slugOrder.length; i++) {
      await db
        .update(projects)
        .set({ sortOrder: i })
        .where(eq(projects.slug, slugOrder[i]));
    }

    // Push unlisted projects to end
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
