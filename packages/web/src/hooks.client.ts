import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry } from '@sentry/sveltekit';
import { PUBLIC_SENTRY_DSN, PUBLIC_SENTRY_ENV } from '$env/static/public';

// Skip Sentry entirely when no DSN is configured (local dev without
// PUBLIC_SENTRY_DSN set), so dev never spams the Sentry project.
if (PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: PUBLIC_SENTRY_DSN,
		environment: PUBLIC_SENTRY_ENV || 'unknown',
		// No performance tracing for now; just error capture.
		tracesSampleRate: 0,
		// Keep PII out — visitors are anonymous; we don't need IPs in events.
		sendDefaultPii: false
	});
}

export const handleError = handleErrorWithSentry();
