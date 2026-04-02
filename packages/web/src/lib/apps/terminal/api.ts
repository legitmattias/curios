import { PUBLIC_API_URL } from '$env/static/public';
import type { Project, Skill, Experience, Profile } from '@curios/shared/types';

async function fetchJson<T>(path: string): Promise<T> {
	const url = `${PUBLIC_API_URL}${path}`;
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

export function fetchHealth(): Promise<{ status: string; uptime: number }> {
	return fetchJson('/health');
}
