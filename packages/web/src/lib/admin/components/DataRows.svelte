<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		count,
		empty,
		children
	}: {
		title?: string;
		count?: number;
		empty?: string;
		children?: Snippet;
	} = $props();
</script>

<section class="data-section">
	{#if title || typeof count === 'number'}
		<header class="data-head">
			{#if title}<span class="data-title">{title}</span>{/if}
			{#if typeof count === 'number'}
				<span class="data-count">{count}</span>
			{/if}
		</header>
	{/if}
	<div class="data-body">
		{#if empty}
			<div class="empty">{empty}</div>
		{:else if children}
			{@render children()}
		{/if}
	</div>
</section>

<style>
	.data-section {
		border: 1px solid var(--color-explorer-border);
		border-radius: 4px;
		background: var(--color-window-bg);
		margin-bottom: var(--space-4);
		overflow: hidden;
	}

	.data-head {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		padding: 8px var(--space-3);
		border-bottom: 1px solid var(--color-explorer-border);
		background: var(--color-explorer-item-hover);
	}

	.data-title {
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.data-count {
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		color: var(--color-text-secondary);
	}

	.empty {
		padding: var(--space-4);
		font-size: 12.5px;
		color: var(--color-text-muted);
		text-align: center;
	}
</style>
