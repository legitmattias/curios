import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { adminApi } from '$lib/admin/api.server.js';
import type { Education } from '@curios/shared/types';

export const load: PageServerLoad = async () => {
	const res = await adminApi<{ data: Education[] }>('/education');
	if (!res.ok || !res.data) throw error(500, res.error ?? 'Failed to load education');
	return { education: res.data.data };
};
