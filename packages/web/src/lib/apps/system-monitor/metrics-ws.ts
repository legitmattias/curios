import { PUBLIC_API_URL } from '$env/static/public';
import { WsMessageSchema } from '@curios/shared/schemas';
import type { MetricsSnapshot } from '@curios/shared/types';

function getWsUrl(): string {
	return PUBLIC_API_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/ws/metrics';
}

export interface MetricsConnection {
	close(): void;
}

export function createMetricsConnection(
	onSnapshot: (snapshot: MetricsSnapshot) => void,
	onStatusChange: (status: 'connecting' | 'live' | 'stale') => void
): MetricsConnection {
	const url = getWsUrl();
	let ws: WebSocket | null = null;
	let retries = 0;
	let closed = false;
	let retryTimeout: ReturnType<typeof setTimeout> | undefined;

	function connect() {
		if (closed) return;

		onStatusChange('connecting');
		ws = new WebSocket(url);

		ws.onopen = () => {
			retries = 0;
		};

		ws.onmessage = (event) => {
			try {
				const parsed = WsMessageSchema.parse(JSON.parse(event.data));
				if (parsed.type === 'snapshot') {
					onStatusChange('live');
					onSnapshot(parsed.payload);
				}
			} catch {
				// Ignore malformed messages
			}
		};

		ws.onclose = () => {
			if (closed) return;
			if (retries < 3) {
				const delay = Math.min(1000 * 2 ** retries, 8000);
				retries++;
				onStatusChange('connecting');
				retryTimeout = setTimeout(connect, delay);
			} else {
				onStatusChange('stale');
			}
		};

		ws.onerror = () => {
			ws?.close();
		};
	}

	connect();

	return {
		close() {
			closed = true;
			if (retryTimeout) clearTimeout(retryTimeout);
			ws?.close();
		}
	};
}
