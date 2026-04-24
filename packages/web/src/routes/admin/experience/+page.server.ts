import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { adminApi } from '$lib/admin/api.server.js';
import type { Experience } from '@curios/shared/types';

export const load: PageServerLoad = async () => {
	const res = await adminApi<{ data: Experience[] }>('/experience');
	if (!res.ok || !res.data) throw error(500, res.error ?? 'Failed to load experience');
	return { experience: res.data.data };
};
