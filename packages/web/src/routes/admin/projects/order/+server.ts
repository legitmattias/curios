import { error, json, type RequestHandler } from '@sveltejs/kit';
import { adminApi } from '$lib/admin/api.server.js';

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.admin) throw error(401, 'Unauthorised');

	const body = (await request.json().catch(() => null)) as string[] | null;
	if (!Array.isArray(body) || !body.every((s) => typeof s === 'string')) {
		throw error(400, 'Body must be an array of slug strings');
	}

	const res = await adminApi<unknown>('/sync/projects/order', {
		method: 'PATCH',
		body
	});

	return json({
		ok: res.ok,
		status: res.status,
		data: res.data ?? null,
		error: res.error ?? null
	});
};
