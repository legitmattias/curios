import { PUBLIC_API_URL } from '$env/static/public';
import { localeStore } from '$lib/os/locale-store.svelte.js';
import type {
	Project,
	Skill,
	Experience,
	Education,
	Profile,
	TranslationMeta
} from '@curios/shared/types';

if (!PUBLIC_API_URL) {
	throw new Error('PUBLIC_API_URL environment variable is required');
}

interface FetchResult<T> {
	data: T;
	url: string;
	raw: unknown;
	translationMeta?: TranslationMeta;
}

async function fetchJson<T>(path: string): Promise<FetchResult<T>> {
	const lang = localeStore.current;
	const separator = path.includes('?') ? '&' : '?';
	const url = `${PUBLIC_API_URL}${path}${lang !== 'en' ? `${separator}lang=${lang}` : ''}`;
	const res = await fetch(url);

	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(body?.message ?? `API request failed: ${res.status}`);
	}

	const json = await res.json();
	return { data: json.data as T, url, raw: json, translationMeta: json.translationMeta };
}

export async function fetchProjects() {
	return fetchJson<Project[]>('/projects');
}

export async function fetchProject(slug: string) {
	return fetchJson<Project>(`/projects/${encodeURIComponent(slug)}`);
}

export async function fetchSkills() {
	return fetchJson<Skill[]>('/skills');
}

export async function fetchExperience() {
	return fetchJson<Experience[]>('/experience');
}

export async function fetchEducation() {
	return fetchJson<Education[]>('/education');
}

export async function fetchProfile() {
	return fetchJson<Profile>('/profile');
}
