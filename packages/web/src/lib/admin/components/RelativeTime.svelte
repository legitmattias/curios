<script lang="ts">
	import Tooltip from './Tooltip.svelte';

	let { iso, placeholder = '—' }: { iso: string | null | undefined; placeholder?: string } =
		$props();

	// Re-render every 60s so "3 min ago" ticks upward without a full refresh.
	let now = $state(Date.now());
	$effect(() => {
		if (!iso) return;
		const id = setInterval(() => (now = Date.now()), 60_000);
		return () => clearInterval(id);
	});

	const diff = $derived(iso ? now - new Date(iso).getTime() : null);

	const relative = $derived.by(() => {
		if (diff === null || !iso) return placeholder;
		const s = Math.floor(diff / 1000);
		if (s < 0) return 'just now';
		if (s < 60) return `${s}s ago`;
		const m = Math.floor(s / 60);
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		const d = Math.floor(h / 24);
		if (d < 30) return `${d}d ago`;
		const mo = Math.floor(d / 30);
		if (mo < 12) return `${mo}mo ago`;
		return `${Math.floor(mo / 12)}y ago`;
	});

	const absolute = $derived(
		iso ? new Date(iso).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : ''
	);
</script>

{#if iso}
	<Tooltip label={absolute}>
		<span class="rel">{relative}</span>
	</Tooltip>
{:else}
	<span class="rel placeholder">{placeholder}</span>
{/if}

<style>
	.rel {
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 11px;
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.rel.placeholder {
		color: var(--color-text-muted);
	}
</style>
