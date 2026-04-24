<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		eyebrow,
		lede,
		actions
	}: {
		eyebrow: string;
		lede?: string;
		actions?: Snippet;
	} = $props();
</script>

<header class="page-head">
	<div class="titles">
		<h1 class="eyebrow">{eyebrow}</h1>
		{#if lede}
			<p class="lede">{lede}</p>
		{/if}
	</div>
	{#if actions}
		<div class="actions">
			{@render actions()}
		</div>
	{/if}
</header>

<style>
	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.titles {
		min-width: 0;
	}

	.eyebrow {
		margin: 0 0 4px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-accent);
	}

	.lede {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--color-text-secondary);
		max-width: 70ch;
	}

	.actions {
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.page-head {
			flex-direction: column;
		}
	}
</style>
