import type { PageServerLoad } from './$types.js';
import { adminApi } from '$lib/admin/api.server.js';

interface ListMeta<T> {
	count: number;
	lastUpdated: string | null;
	sample?: T;
}

function extractTimestamp(row: Record<string, unknown>): string | null {
	const candidates = ['updatedAt', 'createdAt'];
	for (const key of candidates) {
		const v = row[key];
		if (typeof v === 'string') return v;
	}
	return null;
}

function latestTimestamp<T extends Record<string, unknown>>(rows: T[]): string | null {
	let best: string | null = null;
	for (const r of rows) {
		const t = extractTimestamp(r);
		if (t && (!best || t > best)) best = t;
	}
	return best;
}

async function loadListMeta<T extends Record<string, unknown>>(path: string): Promise<ListMeta<T>> {
	const res = await adminApi<{ data: T[] }>(path);
	if (!res.ok || !res.data) return { count: 0, lastUpdated: null };
	const rows = res.data.data ?? [];
	return { count: rows.length, lastUpdated: latestTimestamp(rows) };
}

export const load: PageServerLoad = async () => {
	const [projects, skills, experience, education, profileRes] = await Promise.all([
		loadListMeta('/projects'),
		loadListMeta('/skills'),
		loadListMeta('/experience'),
		loadListMeta('/education'),
		adminApi<{
			data: {
				cvSkills?: Array<unknown> | null;
				cvProjects?: Array<unknown> | null;
				name?: string;
			};
		}>('/profile')
	]);

	const profile = profileRes.ok ? profileRes.data?.data : null;

	return {
		tiles: [
			{
				key: 'projects',
				label: 'Projects',
				count: projects.count,
				lastUpdated: projects.lastUpdated,
				href: '/admin/sync',
				hint: 'Synced from Dossier; LLM-enriched tech descriptions.'
			},
			{
				key: 'skills',
				label: 'Skills',
				count: skills.count,
				lastUpdated: skills.lastUpdated,
				href: '/admin/sync',
				hint: 'Featured + public skills from Dossier, excluding Spoken Languages.'
			},
			{
				key: 'experience',
				label: 'Experience',
				count: experience.count,
				lastUpdated: experience.lastUpdated,
				href: '/admin/sync',
				hint: 'Seeded from curios-dev/seed/content.json on every deploy.'
			},
			{
				key: 'education',
				label: 'Education',
				count: education.count,
				lastUpdated: education.lastUpdated,
				href: '/admin/sync',
				hint: 'Seeded from curios-dev/seed/content.json on every deploy.'
			},
			{
				key: 'cvSkills',
				label: 'CV Skill clusters',
				count: profile?.cvSkills?.length ?? 0,
				lastUpdated: null,
				href: '/admin/sync',
				hint: 'LLM-summarised clusters for the CV skills sidebar.'
			},
			{
				key: 'cvProjects',
				label: 'CV Project summaries',
				count: profile?.cvProjects?.length ?? 0,
				lastUpdated: null,
				href: '/admin/sync',
				hint: 'LLM-condensed 1-sentence descriptions for the CV projects.'
			}
		],
		ownerName: profile?.name ?? null
	};
};
