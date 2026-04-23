import { PUBLIC_API_URL } from '$env/static/public';
import type { Profile } from '@curios/shared/types';

/**
 * Singleton store for the site's profile data. Root layout triggers
 * `load(locale)` on mount and on locale change. Consumers read
 * `profileStore.data` and must handle `null` during the brief initial
 * fetch.
 */
class ProfileStore {
	data = $state<Profile | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);
	private fetchedLocale: string | null = null;

	async load(locale: string): Promise<void> {
		if (this.loading || this.fetchedLocale === locale) return;
		this.loading = true;
		this.error = null;
		try {
			const suffix = locale !== 'en' ? `?lang=${locale}` : '';
			const res = await fetch(`${PUBLIC_API_URL}/profile${suffix}`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = (await res.json()) as { data: Profile };
			this.data = json.data;
			this.fetchedLocale = locale;
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		} finally {
			this.loading = false;
		}
	}
}

export const profileStore = new ProfileStore();

/** Strip protocol from a URL for display. */
export function displayDomain(url: string | null | undefined): string {
	if (!url) return '';
	return url.replace(/^https?:\/\//, '');
}

/** Extract the GitHub handle from a profile github URL. */
export function githubHandle(url: string | null | undefined): string {
	if (!url) return '';
	return url.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
}
