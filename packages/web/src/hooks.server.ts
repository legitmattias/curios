import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import type { Handle } from '@sveltejs/kit';
import { PUBLIC_SENTRY_DSN, PUBLIC_SENTRY_ENV } from '$env/static/public';
import { getAdminSession } from '$lib/admin/auth.server.js';

if (PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: PUBLIC_SENTRY_DSN,
		environment: PUBLIC_SENTRY_ENV || 'unknown',
		tracesSampleRate: 0,
		sendDefaultPii: false
	});
}

const MOBILE_UA_RE = /iPhone|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i;
const SHELL_COOKIE = 'curios_shell';

const appHandle: Handle = async ({ event, resolve }) => {
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

// sentryHandle wraps each request so server-side errors get reported with
// request context. It's a no-op when Sentry isn't initialised.
export const handle = sequence(sentryHandle(), appHandle);
export const handleError = handleErrorWithSentry();
