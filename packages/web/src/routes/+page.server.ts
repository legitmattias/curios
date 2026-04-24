import { redirect, type Cookies } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

const SHELL_COOKIE = 'curios_shell';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function setShellCookie(cookies: Cookies, value: 'mobile' | 'desktop') {
	cookies.set(SHELL_COOKIE, value, {
		path: '/',
		maxAge: COOKIE_MAX_AGE,
		sameSite: 'lax',
		httpOnly: false
	});
}

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
	// `?force=desktop` or `?force=mobile` sets the preference cookie and
	// redirects to the clean URL so the choice persists across visits.
	const force = url.searchParams.get('force');
	if (force === 'desktop' || force === 'mobile') {
		setShellCookie(cookies, force);
		throw redirect(303, '/');
	}

	return { shell: locals.shell ?? 'desktop' };
};
