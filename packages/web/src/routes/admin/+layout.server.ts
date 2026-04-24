import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Allow the login page through the guard.
	if (url.pathname === '/admin/login') {
		return { authed: !!locals.admin };
	}
	if (!locals.admin) {
		const next = encodeURIComponent(url.pathname + url.search);
		throw redirect(303, `/admin/login?next=${next}`);
	}
	return { authed: true };
};
