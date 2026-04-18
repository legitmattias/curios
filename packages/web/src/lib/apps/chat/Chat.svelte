<script lang="ts">
	import { untrack } from 'svelte';
	import { t } from '$lib/os/i18n.svelte.js';
	import { createChatConnection, type ChatConnection, type WsChatMessageIn } from './chat-ws.js';
	import ChatMessage from './ChatMessage.svelte';
	import SuggestedPrompts from './SuggestedPrompts.svelte';

	interface Message {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		streaming?: boolean;
	}

	const MAX_MESSAGE_LENGTH = 500;

	let messages = $state<Message[]>([]);
	let inputValue = $state('');
	let isWaiting = $state(false);
	let statusText = $state('');
	let showPrompts = $state(true);
	let connectionStatus = $state<'connecting' | 'connected' | 'disconnected'>('connecting');
	let connection: ChatConnection | null = null;
	let messagesEl: HTMLDivElement;
	let inputEl: HTMLInputElement;
	let nextId = 0;

	const charsRemaining = $derived(MAX_MESSAGE_LENGTH - inputValue.length);
	const isOverLimit = $derived(charsRemaining < 0);

	function scrollToBottom() {
		requestAnimationFrame(() => {
			if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
		});
	}

	function handleWsMessage(msg: WsChatMessageIn) {
		switch (msg.type) {
			case 'status':
				statusText = msg.status === 'thinking' ? t('chat.thinking') : msg.status;
				break;

			case 'tool_call':
				statusText =
					msg.status === 'calling'
						? `${t('chat.fetchingData')} (${msg.tool.replace('dossier_', '')})`
						: '';
				break;

			case 'stream': {
				const lastMsg = messages[messages.length - 1];
				if (lastMsg?.role === 'assistant' && lastMsg.streaming) {
					lastMsg.content += msg.delta;
				} else {
					messages.push({
						id: String(nextId++),
						role: 'assistant',
						content: msg.delta,
						streaming: true
					});
				}
				statusText = '';
				scrollToBottom();
				break;
			}

			case 'done': {
				const lastMsg = messages[messages.length - 1];
				if (lastMsg?.streaming) {
					lastMsg.streaming = false;
				}
				isWaiting = false;
				statusText = '';
				scrollToBottom();
				break;
			}

			case 'error':
				isWaiting = false;
				if (msg.message === 'rate_limit' || msg.message === 'ip_rate_limit') {
					messages.push({
						id: String(nextId++),
						role: 'assistant',
						content: t('chat.rateLimit')
					});
				} else if (msg.message === 'too_long') {
					statusText = t('chat.tooLong');
				} else {
					statusText = t('chat.error');
				}
				scrollToBottom();
				break;
		}
	}

	function sendMessage(content: string) {
		if (!content.trim() || isOverLimit || isWaiting || !connection) return;

		showPrompts = false;
		isWaiting = true;

		messages.push({
			id: String(nextId++),
			role: 'user',
			content: content.trim()
		});

		connection.send(content.trim());
		inputValue = '';
		scrollToBottom();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage(inputValue);
		}
	}

	// Connect on mount
	$effect(() => {
		untrack(() => {
			connection = createChatConnection(handleWsMessage, (status) => {
				connectionStatus = status;
			});
		});

		return () => connection?.close();
	});

	// Keep the input focused whenever it's active (on connect, after each reply)
	$effect(() => {
		if (!isWaiting && connectionStatus === 'connected') {
			inputEl?.focus();
		}
	});
</script>

<div class="chat">
	<div class="messages" bind:this={messagesEl}>
		{#if showPrompts}
			<div class="welcome">
				<p class="welcome-text">{t('chat.welcome')}</p>
				<SuggestedPrompts onsend={sendMessage} />
			</div>
		{/if}

		{#each messages as msg (msg.id)}
			<ChatMessage role={msg.role} content={msg.content} streaming={msg.streaming} />
		{/each}

		{#if statusText}
			<div class="status-indicator">
				<span class="status-dot"></span>
				{statusText}
			</div>
		{/if}
	</div>

	<div class="input-area">
		<div class="input-wrapper">
			<input
				bind:this={inputEl}
				bind:value={inputValue}
				onkeydown={handleKeydown}
				placeholder={t('chat.inputPlaceholder')}
				disabled={isWaiting || connectionStatus !== 'connected'}
				maxlength={MAX_MESSAGE_LENGTH}
				type="text"
				class="chat-input"
				class:over-limit={isOverLimit}
			/>
			{#if inputValue.length > MAX_MESSAGE_LENGTH * 0.8}
				<span class="char-count" class:over-limit={isOverLimit}>
					{charsRemaining}
				</span>
			{/if}
		</div>
		<button
			class="send-btn"
			onclick={() => sendMessage(inputValue)}
			disabled={isWaiting || isOverLimit || !inputValue.trim() || connectionStatus !== 'connected'}
			aria-label="Send"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="22" y1="2" x2="11" y2="13" />
				<polygon points="22 2 15 22 11 13 2 9 22 2" />
			</svg>
		</button>
	</div>
</div>

<style>
	.chat {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-4);
		min-height: 0;
	}

	.welcome {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-6) var(--space-4);
		text-align: center;
	}

	.welcome-text {
		color: var(--color-text-secondary);
		font-size: var(--text-base);
		line-height: 1.6;
		max-width: 40ch;
		margin-bottom: var(--space-2);
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-accent);
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	.input-area {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-3);
		border-top: 1px solid var(--color-explorer-border);
		flex-shrink: 0;
	}

	.input-wrapper {
		flex: 1;
		position: relative;
	}

	.chat-input {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-explorer-border);
		border-radius: var(--radius-window);
		background: transparent;
		color: var(--color-text-primary);
		font-family: inherit;
		font-size: var(--text-sm);
		outline: none;
		transition: border-color var(--transition-fast);
	}

	.chat-input:focus {
		border-color: var(--color-accent);
	}

	.chat-input:disabled {
		opacity: 0.5;
	}

	.chat-input.over-limit {
		border-color: var(--color-error, #e53e3e);
	}

	.char-count {
		position: absolute;
		right: var(--space-2);
		top: 50%;
		transform: translateY(-50%);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		pointer-events: none;
	}

	.char-count.over-limit {
		color: var(--color-error, #e53e3e);
	}

	.send-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: none;
		border-radius: var(--radius-window);
		background: var(--color-accent);
		color: white;
		cursor: pointer;
		transition: background var(--transition-fast);
		flex-shrink: 0;
	}

	.send-btn:hover:not(:disabled) {
		background: var(--color-accent-hover);
	}

	.send-btn:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.send-btn:active:not(:disabled) {
		transform: scale(0.92);
	}
</style>
