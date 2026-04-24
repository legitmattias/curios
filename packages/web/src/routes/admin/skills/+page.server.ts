import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { adminApi } from '$lib/admin/api.server.js';
import type { Skill } from '@curios/shared/types';

export const load: PageServerLoad = async () => {
	const res = await adminApi<{ data: Skill[] }>('/skills');
	if (!res.ok || !res.data) throw error(500, res.error ?? 'Failed to load skills');

	// Group by category for rendering
	const byCategory = new Map<string, Skill[]>();
	for (const s of res.data.data) {
		const arr = byCategory.get(s.category) ?? [];
		arr.push(s);
		byCategory.set(s.category, arr);
	}
	const groups = Array.from(byCategory.entries()).map(([category, items]) => ({
		category,
		items
	}));

	return { groups, total: res.data.data.length };
};
