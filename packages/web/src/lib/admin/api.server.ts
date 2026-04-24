// Server-side proxy to the Hono API. Browsers never see the DOSSIER_API_KEY —
// admin pages call these helpers from their +page.server.ts / +server.ts files.

function getApiBase(): string {
	const url = process.env.ADMIN_API_URL ?? process.env.PUBLIC_API_URL;
	if (!url) throw new Error('Missing ADMIN_API_URL or PUBLIC_API_URL env var');
	return url.replace(/\/$/, '');
}

function getApiKey(): string {
	const key = process.env.DOSSIER_API_KEY;
	if (!key) throw new Error('DOSSIER_API_KEY is required for admin API proxying');
	return key;
}

interface FetchOptions {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: unknown;
	query?: Record<string, string | boolean | undefined>;
	timeoutMs?: number;
}

export interface ApiResult<T> {
	ok: boolean;
	status: number;
	data?: T;
	error?: string;
}

export async function adminApi<T = unknown>(
	path: string,
	opts: FetchOptions = {}
): Promise<ApiResult<T>> {
	const { method = 'GET', body, query, timeoutMs = 300_000 } = opts;
	const qs = query
		? '?' +
			new URLSearchParams(
				Object.entries(query)
					.filter(([, v]) => v !== undefined)
					.map(([k, v]) => [k, String(v)])
			).toString()
		: '';
	const url = `${getApiBase()}${path}${qs}`;

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch(url, {
			method,
			headers: {
				Authorization: `Bearer ${getApiKey()}`,
				...(body ? { 'Content-Type': 'application/json' } : {})
			},
			body: body ? JSON.stringify(body) : undefined,
			signal: controller.signal
		});
		clearTimeout(timer);
		if (!res.ok) {
			let errText = '';
			try {
				errText = (await res.json()) as unknown as string;
			} catch {
				errText = await res.text().catch(() => '');
			}
			return { ok: false, status: res.status, error: String(errText) };
		}
		const data = (await res.json()) as T;
		return { ok: true, status: res.status, data };
	} catch (err) {
		clearTimeout(timer);
		const msg = err instanceof Error ? err.message : String(err);
		return { ok: false, status: 0, error: msg };
	}
}
