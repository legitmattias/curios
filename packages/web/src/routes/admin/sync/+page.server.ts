import type { PageServerLoad } from './$types.js';
import { adminApi } from '$lib/admin/api.server.js';

export type OpKey = 'projects' | 'skills' | 'languages' | 'cv-skills' | 'cv-projects';

export interface SyncStateRow {
	operation: OpKey;
	lastRunAt: string | null;
	lastDurationMs: number | null;
	lastStatus: 'success' | 'error';
	lastResult: unknown;
	lastError: string | null;
}

export const load: PageServerLoad = async () => {
	const res = await adminApi<{ data: SyncStateRow[] }>('/sync/state');
	const rows = res.ok && res.data ? res.data.data : [];

	// Map by operation key so the client can initialise runState directly.
	const byOp: Partial<Record<OpKey, SyncStateRow>> = {};
	for (const r of rows) byOp[r.operation] = r;

	return { syncState: byOp };
};
