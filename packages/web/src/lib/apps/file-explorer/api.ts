import { PUBLIC_API_URL } from '$env/static/public';
import type { Project, Skill, Experience, Profile } from '@curios/shared/types';

if (!PUBLIC_API_URL) {
	throw new Error('PUBLIC_API_URL environment variable is required');
}

async function fetchJson<T>(path: string): Promise<{ data: T; url: string; raw: unknown }> {
	const url = `${PUBLIC_API_URL}${path}`;
	const res = await fetch(url);

	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(body?.message ?? `API request failed: ${res.status}`);
	}

	const json = await res.json();
	return { data: json.data as T, url, raw: json };
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

export async function fetchProfile() {
	return fetchJson<Profile>('/profile');
}
