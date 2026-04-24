import { redirect, type Cookies } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

const SHELL_COOKIE = 'curios_shell';

function setShellCookie(cookies: Cookies, value: 'mobile' | 'desktop') {
	// Session-only — closing the browser drops the override so users can't
	// get permanently stuck after a test/manual force.
	cookies.set(SHELL_COOKIE, value, {
		path: '/',
		sameSite: 'lax',
		httpOnly: false
	});
}

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
	// `?force=desktop` or `?force=mobile` sets a session cookie and redirects
	// to the clean URL — useful for dev/testing. No UI exposes this.
	const force = url.searchParams.get('force');
	if (force === 'desktop' || force === 'mobile') {
		setShellCookie(cookies, force);
		throw redirect(303, '/');
	}

	return { shell: locals.shell ?? 'desktop' };
};
