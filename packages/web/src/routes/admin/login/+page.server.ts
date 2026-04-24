import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import {
	validateAdminPassword,
	setAdminSession,
	registerLoginAttempt,
	clearLoginAttempts,
	isAdminConfigured
} from '$lib/admin/auth.server.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.admin) {
		throw redirect(303, url.searchParams.get('next') || '/admin');
	}
	return { configured: isAdminConfigured() };
};

function clientIp(event: { getClientAddress: () => string; request: Request }): string {
	try {
		return event.getClientAddress();
	} catch {
		return event.request.headers.get('x-forwarded-for') ?? 'unknown';
	}
}

export const actions: Actions = {
	default: async (event) => {
		if (!isAdminConfigured()) {
			return fail(503, {
				message:
					'Admin is not configured on this server (missing ADMIN_PASSWORD or ADMIN_SESSION_SECRET).'
			});
		}

		const ip = clientIp(event);
		const gate = registerLoginAttempt(ip);
		if (!gate.allowed) {
			const minutes = Math.ceil(gate.retryAfterMs / 60_000);
			return fail(429, { message: `Too many attempts. Try again in ${minutes} min.` });
		}

		const form = await event.request.formData();
		const password = String(form.get('password') ?? '');

		if (!password) {
			return fail(400, { message: 'Password is required.' });
		}

		if (!validateAdminPassword(password)) {
			return fail(401, {
				message: `Incorrect password. ${gate.remaining} attempts remaining.`
			});
		}

		clearLoginAttempts(ip);
		const session = setAdminSession(event.cookies, 'admin');
		if (!session) {
			return fail(500, { message: 'Could not create admin session.' });
		}
		const next = event.url.searchParams.get('next') || '/admin';
		throw redirect(303, next);
	}
};
