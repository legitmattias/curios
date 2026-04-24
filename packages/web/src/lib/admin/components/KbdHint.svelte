<script lang="ts">
	let { keys, compact = false }: { keys: string | string[]; compact?: boolean } = $props();

	const list = $derived(Array.isArray(keys) ? keys : keys.split(/\s+/).filter(Boolean));
</script>

<span class="kbd-group" class:compact aria-hidden="true">
	{#each list as k, i (i)}
		<kbd class="kbd">{k}</kbd>
		{#if i < list.length - 1}
			<span class="sep">+</span>
		{/if}
	{/each}
</span>

<style>
	.kbd-group {
		display: inline-flex;
		align-items: center;
		gap: 3px;
	}

	.kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.4em;
		height: 1.4em;
		padding: 0 5px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10px;
		font-weight: 500;
		line-height: 1;
		color: var(--color-text-secondary);
		background: color-mix(in srgb, var(--color-text-primary) 4%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-text-primary) 18%, transparent);
		border-radius: 3px;
		letter-spacing: 0.02em;
		text-transform: none;
	}

	.compact .kbd {
		font-size: 9px;
		min-width: 1.2em;
		height: 1.2em;
		padding: 0 4px;
	}

	.sep {
		font-size: 9px;
		color: var(--color-text-muted);
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
	}

	@media (max-width: 640px) {
		.kbd-group {
			display: none;
		}
	}
</style>
