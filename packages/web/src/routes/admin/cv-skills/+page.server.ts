import type { PageServerLoad } from './$types.js';
import { adminApi } from '$lib/admin/api.server.js';

interface Cluster {
	category: string;
	summary: string;
}

export const load: PageServerLoad = async () => {
	// cvSkills is stored as {en, sv} on the profile row but only surfaced via
	// the CV endpoint (per-lang). Fetch both so the admin page can show them
	// side by side.
	const [cvEn, cvSv] = await Promise.all([
		adminApi<{ data: { cvSkills?: Cluster[] | null } }>('/cv'),
		adminApi<{ data: { cvSkills?: Cluster[] | null } }>('/cv', {
			query: { lang: 'sv' }
		})
	]);

	return {
		en: cvEn.ok && cvEn.data ? (cvEn.data.data.cvSkills ?? []) : [],
		sv: cvSv.ok && cvSv.data ? (cvSv.data.data.cvSkills ?? []) : []
	};
};
