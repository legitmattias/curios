<script lang="ts">
	let {
		role,
		content,
		streaming = false
	}: {
		role: 'user' | 'assistant';
		content: string;
		streaming?: boolean;
	} = $props();
</script>

<div class="message {role}">
	<div class="bubble">
		{content}{#if streaming}<span class="cursor">▌</span>{/if}
	</div>
</div>

<style>
	.message {
		display: flex;
		margin-bottom: var(--space-3);
	}

	.message.user {
		justify-content: flex-end;
	}

	.message.assistant {
		justify-content: flex-start;
	}

	.bubble {
		max-width: 80%;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-window);
		font-size: var(--text-sm);
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.user .bubble {
		background: var(--color-accent);
		color: white;
		border-bottom-right-radius: var(--radius-button);
	}

	.assistant .bubble {
		background: var(--color-explorer-item-hover);
		color: var(--color-text-primary);
		border-bottom-left-radius: var(--radius-button);
	}

	.cursor {
		animation: blink 1s step-end infinite;
		color: var(--color-accent);
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
