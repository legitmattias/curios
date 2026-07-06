import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";
import { getDossierClient } from "../services/dossier-client.js";

const healthRoute = new OpenAPIHono();

const route = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "ok" }),
            uptime: z.number().openapi({ example: 12345.67 }),
          }),
        },
      },
      description: "Service health status",
    },
  },
});

healthRoute.openapi(route, (c) => {
  return c.json({
    status: "ok",
    uptime: process.uptime(),
  });
});

// Deep readiness check — exercises the chat's real runtime dependencies so an
// outage (database down, Dossier MCP auth broken, missing LLM key) surfaces as
// a 503 instead of failing silently. The scheduled health-check workflow polls
// this and alerts on non-200. Result is cached briefly to bound load.
const READY_CACHE_MS = 60_000;
let readyCache: {
  at: number;
  ok: boolean;
  checks: Record<string, string>;
} | null = null;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);
}

async function runReadyChecks(): Promise<{
  ok: boolean;
  checks: Record<string, string>;
}> {
  const checks: Record<string, string> = {};
  let ok = true;

  // Imported lazily: db/index.js throws at module load if DATABASE_URL is
  // unset, so a static import would break import-time (and the health tests).
  try {
    const { db } = await import("../db/index.js");
    await withTimeout(db.execute(sql`select 1`), 5000);
    checks.database = "ok";
  } catch {
    checks.database = "error";
    ok = false;
  }

  // getDossierClient re-verifies the connection (listTools) and reconnects on
  // failure, so a broken key or unreachable server throws here — the exact
  // failure mode that silently killed the chat.
  try {
    await withTimeout(getDossierClient(), 5000);
    checks.dossier = "ok";
  } catch {
    checks.dossier = "error";
    ok = false;
  }

  checks.llm = process.env.ANTHROPIC_API_KEY ? "ok" : "missing";
  if (checks.llm !== "ok") ok = false;

  return { ok, checks };
}

healthRoute.get("/ready", async (c) => {
  const now = Date.now();
  if (!readyCache || now - readyCache.at > READY_CACHE_MS) {
    const result = await runReadyChecks();
    readyCache = { at: now, ok: result.ok, checks: result.checks };
  }
  return c.json(
    { status: readyCache.ok ? "ok" : "degraded", checks: readyCache.checks },
    readyCache.ok ? 200 : 503,
  );
});

export { healthRoute };
