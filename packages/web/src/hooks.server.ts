import type { Handle } from '@sveltejs/kit';
import { getAdminSession } from '$lib/admin/auth.server.js';

export const handle: Handle = async ({ event, resolve }) => {
	const session = getAdminSession(event.cookies);
	if (session) {
		event.locals.admin = { userId: session.userId };
	}
	return resolve(event);
};
