import type { Handle } from '@sveltejs/kit';
import { getAdminSession } from '$lib/admin/auth.server.js';

const MOBILE_UA_RE = /iPhone|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i;
const SHELL_COOKIE = 'curios_shell';

export const handle: Handle = async ({ event, resolve }) => {
	const session = getAdminSession(event.cookies);
	if (session) {
		event.locals.admin = { userId: session.userId };
	}

	// Cookie override wins; otherwise fall back to UA sniff. Admin routes
	// always render as desktop since the admin UI is not mobile-optimised.
	const override = event.cookies.get(SHELL_COOKIE);
	if (event.url.pathname.startsWith('/admin')) {
		event.locals.shell = 'desktop';
	} else if (override === 'mobile' || override === 'desktop') {
		event.locals.shell = override;
	} else {
		const ua = event.request.headers.get('user-agent') ?? '';
		event.locals.shell = MOBILE_UA_RE.test(ua) ? 'mobile' : 'desktop';
	}

	return resolve(event);
};
