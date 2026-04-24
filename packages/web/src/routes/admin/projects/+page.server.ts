import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { adminApi } from '$lib/admin/api.server.js';
import type { Project } from '@curios/shared/types';

export const load: PageServerLoad = async () => {
	const res = await adminApi<{ data: Project[] }>('/projects');
	if (!res.ok || !res.data) throw error(500, res.error ?? 'Failed to load projects');
	return { projects: res.data.data };
};
