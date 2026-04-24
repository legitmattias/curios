import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { clearAdminSession } from '$lib/admin/auth.server.js';

export const POST: RequestHandler = async ({ cookies }) => {
	clearAdminSession(cookies);
	throw redirect(303, '/admin/login');
};
