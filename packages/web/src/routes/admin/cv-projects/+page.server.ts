import type { PageServerLoad } from './$types.js';
import { adminApi } from '$lib/admin/api.server.js';

interface CvProjectItem {
	slug: string;
	title: string;
	summary: string;
	tech: string[];
}

export const load: PageServerLoad = async () => {
	const [cvEn, cvSv] = await Promise.all([
		adminApi<{
			data: { cvProjects?: CvProjectItem[] | null };
		}>('/cv'),
		adminApi<{
			data: { cvProjects?: CvProjectItem[] | null };
		}>('/cv', { query: { lang: 'sv' } })
	]);

	return {
		en: cvEn.ok && cvEn.data ? (cvEn.data.data.cvProjects ?? []) : [],
		sv: cvSv.ok && cvSv.data ? (cvSv.data.data.cvProjects ?? []) : []
	};
};
