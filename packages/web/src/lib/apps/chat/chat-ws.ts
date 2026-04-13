import { PUBLIC_API_URL } from '$env/static/public';

export type WsChatMessageIn =
	| { type: 'status'; status: string }
	| { type: 'tool_call'; tool: string; status: 'calling' | 'done' }
	| { type: 'stream'; delta: string }
	| { type: 'done' }
	| { type: 'error'; message: string };

function getWsUrl(): string {
	return PUBLIC_API_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/ws/chat';
}

export interface ChatConnection {
	send(content: string): void;
	close(): void;
}

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

export function createChatConnection(
	onMessage: (msg: WsChatMessageIn) => void,
	onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void
): ChatConnection {
	const url = getWsUrl();
	let ws: WebSocket | null = null;
	let closed = false;
	let reconnectAttempt = 0;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	function connect() {
		if (closed) return;

		onStatusChange('connecting');
		ws = new WebSocket(url);

		ws.onopen = () => {
			reconnectAttempt = 0;
			onStatusChange('connected');
		};

		ws.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data) as WsChatMessageIn;
				onMessage(msg);
			} catch {
				// Ignore malformed messages
			}
		};

		ws.onclose = () => {
			ws = null;
			if (!closed) {
				onStatusChange('disconnected');
				scheduleReconnect();
			}
		};

		ws.onerror = () => {
			ws?.close();
		};
	}

	function scheduleReconnect() {
		if (closed) return;
		const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
		reconnectAttempt++;
		reconnectTimer = setTimeout(connect, delay);
	}

	connect();

	return {
		send(content: string) {
			ws?.send(JSON.stringify({ type: 'message', content }));
		},
		close() {
			closed = true;
			if (reconnectTimer) clearTimeout(reconnectTimer);
			ws?.close();
		}
	};
}
