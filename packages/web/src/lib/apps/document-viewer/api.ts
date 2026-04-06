import { PUBLIC_API_URL } from '$env/static/public';
import type { CvData } from '@curios/shared/types';

export async function fetchCv(): Promise<CvData> {
	const url = `${PUBLIC_API_URL}/cv`;
	const res = await fetch(url);

	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(body?.message ?? `Request failed: ${res.status}`);
	}

	const json = await res.json();
	return json.data as CvData;
}

export function getPdfUrl(): string {
	return `${PUBLIC_API_URL}/cv/pdf`;
}
