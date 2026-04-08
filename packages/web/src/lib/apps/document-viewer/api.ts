import { PUBLIC_API_URL } from '$env/static/public';
import { localeStore } from '$lib/os/locale-store.svelte.js';
import type { CvData, TranslationMeta } from '@curios/shared/types';

export async function fetchCv(): Promise<{ data: CvData; translationMeta?: TranslationMeta }> {
	const lang = localeStore.current;
	const url = `${PUBLIC_API_URL}/cv${lang !== 'en' ? `?lang=${lang}` : ''}`;
	const res = await fetch(url);

	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(body?.message ?? `Request failed: ${res.status}`);
	}

	const json = await res.json();
	return { data: json.data as CvData, translationMeta: json.translationMeta };
}

export function getPdfUrl(lang: string = 'en'): string {
	return `${PUBLIC_API_URL}/cv/pdf?lang=${lang}`;
}
