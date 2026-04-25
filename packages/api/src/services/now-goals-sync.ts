import { createHash } from "crypto";
import { eq, notInArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { nowGoals } from "../db/schema.js";
import { dossierGet } from "./dossier-http.js";
import {
  translateToSwedish,
  upsertTranslations,
} from "./translation-writer.js";

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

function latestProgress(goal: DossierGoal): number | null {
  if (!goal.progress || goal.progress.length === 0) return null;
  const last = goal.progress[goal.progress.length - 1];
  return typeof last.percentage === "number" ? last.percentage : null;
}

function computeHash(parts: Record<string, unknown>): string {
  return createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex")
    .slice(0, 16);
}

async function fetchDossierGoals(): Promise<DossierGoal[]> {
  const res = await dossierGet("/profile/goals");
  if (!res.ok) throw new Error(`Dossier /profile/goals returned ${res.status}`);
  const data = (await res.json()) as { goals: DossierGoal[] };
  return data.goals;
}

export interface NowGoalsSyncResult {
  synced: number;
  skipped: number;
  removed: number;
  errors: string[];
}

// Pulls goals from Dossier into the local now_goals table and translates the
// description field to Swedish. Honours the same filter as the live /now
// endpoint did before — only active public goals — so the data shown to
// visitors mirrors what was visible in Dossier at sync time.
export async function syncNowGoals(force = false): Promise<NowGoalsSyncResult> {
  const result: NowGoalsSyncResult = {
    synced: 0,
    skipped: 0,
    removed: 0,
    errors: [],
  };

  const all = await fetchDossierGoals();
  const active = all.filter(
    (g) => g.status === "active" && g.visibility === "public",
  );
  const featured = active.filter((g) => g.featured);
  const pool = featured.length > 0 ? featured : active;

  const sorted = [...pool].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  console.log(`Now goals sync: ${sorted.length} goals from Dossier`);

  const syncedIds: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const g = sorted[i];
    try {
      const description = g.description ?? "";
      const progress = latestProgress(g);
      const hash = computeHash({
        name: g.name,
        description,
        priority: g.priority,
        progress,
      });

      const existing = await db
        .select({ id: nowGoals.id, contentHash: nowGoals.contentHash })
        .from(nowGoals)
        .where(eq(nowGoals.dossierId, g.id))
        .limit(1);

      if (!force && existing.length > 0 && existing[0].contentHash === hash) {
        // Sort order may still need refresh.
        await db
          .update(nowGoals)
          .set({ sortOrder: i })
          .where(eq(nowGoals.dossierId, g.id));
        result.skipped++;
        syncedIds.push(g.id);
        console.log(`  [skip] ${g.name} (unchanged)`);
        continue;
      }

      console.log(`  [sync] ${g.name}`);

      // Upsert the goal row.
      await db
        .insert(nowGoals)
        .values({
          dossierId: g.id,
          name: g.name,
          description,
          priority: g.priority,
          progress,
          sortOrder: i,
          contentHash: hash,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: nowGoals.dossierId,
          set: {
            name: g.name,
            description,
            priority: g.priority,
            progress,
            sortOrder: i,
            contentHash: hash,
            updatedAt: new Date(),
          },
        });

      // Look up the local id (may be new or existing).
      const [row] = await db
        .select({ id: nowGoals.id })
        .from(nowGoals)
        .where(eq(nowGoals.dossierId, g.id))
        .limit(1);

      if (row && description) {
        const sv = await translateToSwedish({ description });
        if (sv.description) {
          await upsertTranslations("now_goal", row.id, "sv", {
            description: sv.description,
          });
        }
      }

      result.synced++;
      syncedIds.push(g.id);
    } catch (err) {
      const msg = `${g.name}: ${err instanceof Error ? err.message : "Unknown error"}`;
      result.errors.push(msg);
      console.error(`  [error] ${msg}`);
    }
  }

  // Remove goals no longer in the Dossier active+public set.
  if (syncedIds.length > 0) {
    const removed = await db
      .delete(nowGoals)
      .where(notInArray(nowGoals.dossierId, syncedIds))
      .returning({ dossierId: nowGoals.dossierId });
    result.removed = removed.length;
    if (removed.length > 0) {
      console.log(
        `  [clean] Removed ${removed.length}: ${removed.map((r) => r.dossierId).join(", ")}`,
      );
    }
  }

  console.log(
    `  Synced: ${result.synced}, Skipped: ${result.skipped}, Removed: ${result.removed}`,
  );

  return result;
}
