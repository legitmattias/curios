import { PUBLIC_API_URL } from '$env/static/public';
import { localeStore } from '$lib/os/locale-store.svelte.js';
import type { Project, Skill, Experience, Profile, CvData } from '@curios/shared/types';

function buildUrl(path: string): string {
	const lang = localeStore.current;
	const separator = path.includes('?') ? '&' : '?';
	return `${PUBLIC_API_URL}${path}${lang !== 'en' ? `${separator}lang=${lang}` : ''}`;
}

async function fetchJson<T>(path: string): Promise<T> {
	const url = buildUrl(path);
	const res = await fetch(url);

	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(body?.message ?? `Request failed: ${res.status}`);
	}

	const json = await res.json();
	return json.data as T;
}

export function fetchProjects(): Promise<Project[]> {
	return fetchJson('/projects');
}

export function fetchProject(slug: string): Promise<Project> {
	return fetchJson(`/projects/${encodeURIComponent(slug)}`);
}

export function fetchSkills(): Promise<Skill[]> {
	return fetchJson('/skills');
}

export function fetchExperience(): Promise<Experience[]> {
	return fetchJson('/experience');
}

export function fetchProfile(): Promise<Profile> {
	return fetchJson('/profile');
}

export function fetchCv(): Promise<CvData> {
	return fetchJson('/cv');
}

export async function fetchHealth(): Promise<{ status: string; uptime: number }> {
	const url = `${PUBLIC_API_URL}/health`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Request failed: ${res.status}`);
	return res.json();
}
