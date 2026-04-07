<script lang="ts">
	import { getBreadcrumbs } from './filesystem.js';

	let {
		path,
		onnavigate
	}: {
		path: string;
		onnavigate: (path: string) => void;
	} = $props();

	const crumbs = $derived(getBreadcrumbs(path));
</script>

<nav class="breadcrumb" aria-label="Breadcrumb">
	{#each crumbs as crumb, i (crumb.path)}
		{#if i > 0}
			<span class="separator">/</span>
		{/if}
		<button
			class="crumb"
			class:active={i === crumbs.length - 1}
			onclick={() => onnavigate(crumb.path)}
		>
			{crumb.name}
		</button>
	{/each}
</nav>

<style>
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3);
		font-size: 0.8rem;
		font-family: var(--font-mono);
		border-bottom: 1px solid var(--color-explorer-border);
		flex-shrink: 0;
	}

	.separator {
		color: var(--color-text-muted);
	}

	.crumb {
		background: none;
		border: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: 2px 4px;
		border-radius: var(--radius-button);
		font-family: inherit;
		font-size: inherit;
		transition: color var(--transition-fast);
	}

	.crumb:hover {
		color: var(--color-text-primary);
		background: var(--color-explorer-item-hover);
	}

	.crumb.active {
		color: var(--color-text-primary);
	}
</style>
