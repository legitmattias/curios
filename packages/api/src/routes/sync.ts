import { OpenAPIHono } from "@hono/zod-openapi";
import { syncProjects } from "../services/project-sync.js";

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

export { syncRoute };
