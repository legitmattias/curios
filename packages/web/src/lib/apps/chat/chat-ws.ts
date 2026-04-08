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

export function createChatConnection(
	onMessage: (msg: WsChatMessageIn) => void,
	onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void
): ChatConnection {
	const url = getWsUrl();
	let ws: WebSocket | null = null;

	onStatusChange('connecting');
	ws = new WebSocket(url);

	ws.onopen = () => {
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
		onStatusChange('disconnected');
	};

	ws.onerror = () => {
		ws?.close();
	};

	return {
		send(content: string) {
			ws?.send(JSON.stringify({ type: 'message', content }));
		},
		close() {
			ws?.close();
		}
	};
}
