import { db } from "../db/index.js";
import { syncState } from "../db/schema.js";

export type SyncOperation =
  | "projects"
  | "skills"
  | "languages"
  | "cv-skills"
  | "cv-projects"
  | "now-goals";

interface RecordSuccessArgs {
  operation: SyncOperation;
  durationMs: number;
  result: unknown;
}

interface RecordErrorArgs {
  operation: SyncOperation;
  durationMs: number;
  message: string;
}

// Marks an operation as in-flight. Used by runAndRecord so the admin panel
// can see "running" even after a reload or navigation away.
export async function recordSyncStart(operation: SyncOperation): Promise<void> {
  await db
    .insert(syncState)
    .values({
      operation,
      lastRunAt: new Date(),
      lastDurationMs: null,
      lastStatus: "running",
      lastResult: null,
      lastError: null,
    })
    .onConflictDoUpdate({
      target: syncState.operation,
      set: {
        lastRunAt: new Date(),
        lastDurationMs: null,
        lastStatus: "running",
        lastResult: null,
        lastError: null,
      },
    });
}

export async function recordSyncSuccess(
  args: RecordSuccessArgs,
): Promise<void> {
  await db
    .insert(syncState)
    .values({
      operation: args.operation,
      lastRunAt: new Date(),
      lastDurationMs: Math.round(args.durationMs),
      lastStatus: "success",
      lastResult: args.result as Record<string, unknown>,
      lastError: null,
    })
    .onConflictDoUpdate({
      target: syncState.operation,
      set: {
        lastRunAt: new Date(),
        lastDurationMs: Math.round(args.durationMs),
        lastStatus: "success",
        lastResult: args.result as Record<string, unknown>,
        lastError: null,
      },
    });
}

export async function recordSyncError(args: RecordErrorArgs): Promise<void> {
  await db
    .insert(syncState)
    .values({
      operation: args.operation,
      lastRunAt: new Date(),
      lastDurationMs: Math.round(args.durationMs),
      lastStatus: "error",
      lastResult: null,
      lastError: args.message,
    })
    .onConflictDoUpdate({
      target: syncState.operation,
      set: {
        lastRunAt: new Date(),
        lastDurationMs: Math.round(args.durationMs),
        lastStatus: "error",
        lastResult: null,
        lastError: args.message,
      },
    });
}

export async function listSyncState() {
  return db.select().from(syncState);
}
