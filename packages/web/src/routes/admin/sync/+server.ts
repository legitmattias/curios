import { error, json, type RequestHandler } from '@sveltejs/kit';
import { adminApi } from '$lib/admin/api.server.js';

const OPERATIONS = new Set(['projects', 'skills', 'languages', 'cv-skills', 'cv-projects']);

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.admin) throw error(401, 'Unauthorised');

	const body = (await request.json().catch(() => ({}))) as {
		operation?: string;
		force?: boolean;
	};

	const op = body.operation;
	if (!op || !OPERATIONS.has(op)) {
		throw error(400, `Unknown operation: ${op}`);
	}

	const force = body.force === true;
	const query = op === 'projects' || op === 'skills' ? { force } : undefined;
	const res = await adminApi<unknown>(`/sync/${op}`, { method: 'POST', query });

	return json({
		ok: res.ok,
		status: res.status,
		data: res.data ?? null,
		error: res.error ?? null
	});
};
