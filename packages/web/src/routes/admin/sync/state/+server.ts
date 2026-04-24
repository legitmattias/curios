import { error, json, type RequestHandler } from '@sveltejs/kit';
import { adminApi } from '$lib/admin/api.server.js';
import type { SyncStateRow } from '../+page.server.js';

// Client-side polling endpoint. The sync page hits this every few seconds
// while any operation is running, so a "Running…" status survives page
// reloads and we can toast the outcome when a run finishes asynchronously.
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.admin) throw error(401, 'Unauthorised');
	const res = await adminApi<{ data: SyncStateRow[] }>('/sync/state');
	if (!res.ok) throw error(res.status || 500, res.error || 'Failed');
	return json(res.data ?? { data: [] });
};
