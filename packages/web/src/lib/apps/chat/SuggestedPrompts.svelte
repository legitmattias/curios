<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';

	let {
		onsend
	}: {
		onsend: (content: string) => void;
	} = $props();

	const promptKeys = [
		'chat.prompt.skills',
		'chat.prompt.projects',
		'chat.prompt.available',
		'chat.prompt.learning'
	];
</script>

<div class="suggested-prompts">
	{#each promptKeys as key (key)}
		<button class="prompt-chip" onclick={() => onsend(t(key))}>
			{t(key)}
		</button>
	{/each}
</div>

<style>
	.suggested-prompts {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3) 0;
	}

	.prompt-chip {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-explorer-border);
		border-radius: var(--radius-window);
		background: transparent;
		color: var(--color-text-primary);
		font-family: inherit;
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast);
	}

	.prompt-chip:hover {
		background: var(--color-explorer-item-hover);
		border-color: var(--color-accent);
	}

	.prompt-chip:active {
		transform: scale(0.98);
	}
</style>
