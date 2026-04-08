<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	let {
		role,
		content,
		streaming = false
	}: {
		role: 'user' | 'assistant';
		content: string;
		streaming?: boolean;
	} = $props();

	marked.use({ breaks: true });

	const renderedHtml = $derived(
		role === 'assistant'
			? DOMPurify.sanitize(marked.parse(content, { async: false }) as string)
			: content
	);
</script>

<div class="message {role}">
	<div class="bubble">
		{#if role === 'assistant'}
			<!-- eslint-disable-next-line svelte/no-at-html-tags — sanitized with DOMPurify -->
			{@html renderedHtml}
			{#if streaming}<span class="cursor">▌</span>{/if}
		{:else}
			{content}
		{/if}
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
		word-break: break-word;
	}

	.user .bubble {
		background: var(--color-accent);
		color: white;
		border-bottom-right-radius: var(--radius-button);
		white-space: pre-wrap;
	}

	.assistant .bubble {
		background: var(--color-explorer-item-hover);
		color: var(--color-text-primary);
		border-bottom-left-radius: var(--radius-button);
	}

	/* Markdown styles for assistant messages */
	.assistant .bubble :global(p) {
		margin: 0 0 var(--space-2) 0;
	}

	.assistant .bubble :global(p:last-child) {
		margin-bottom: 0;
	}

	.assistant .bubble :global(strong) {
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
	}

	.assistant .bubble :global(ul),
	.assistant .bubble :global(ol) {
		margin: var(--space-1) 0;
		padding-left: var(--space-4);
	}

	.assistant .bubble :global(li) {
		margin-bottom: var(--space-1);
	}

	.assistant .bubble :global(code) {
		font-family: var(--font-mono);
		font-size: 0.85em;
		background: rgba(0, 0, 0, 0.15);
		padding: 1px 4px;
		border-radius: 3px;
	}

	.assistant .bubble :global(a) {
		color: var(--color-accent);
		text-decoration: none;
	}

	.assistant .bubble :global(a:hover) {
		text-decoration: underline;
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
