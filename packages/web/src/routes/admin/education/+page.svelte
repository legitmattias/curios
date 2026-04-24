<script lang="ts">
	import PageHeader from '$lib/admin/components/PageHeader.svelte';
	import DataRows from '$lib/admin/components/DataRows.svelte';

	let { data } = $props();
	const rows = $derived(data.education);
</script>

<svelte:head>
	<title>Admin · Education · CuriOS</title>
</svelte:head>

<PageHeader eyebrow="Education" lede="Seeded from curios-dev/seed/content.json on every deploy." />

<DataRows count={rows.length} empty={rows.length === 0 ? 'No education entries.' : ''}>
	<ol class="entries">
		{#each rows as edu (edu.id)}
			<li class="entry">
				<div class="entry-head">
					<div class="entry-title">
						<span class="degree">{edu.degree} — {edu.field}</span>
					</div>
					<div class="period mono">
						{edu.startDate} — {edu.endDate ?? 'present'}
					</div>
				</div>
				<div class="institution">{edu.institution}</div>
				{#if edu.description}
					<p class="desc">{edu.description}</p>
				{/if}
				<div class="meta mono">
					sortOrder {edu.sortOrder} · id <span class="dim">{edu.id}</span>
				</div>
			</li>
		{/each}
	</ol>
</DataRows>

<style>
	.entries {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.entry {
		padding: 12px var(--space-3);
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.entry:last-child {
		border-bottom: none;
	}

	.entry-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: 2px;
	}

	.degree {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.institution {
		font-size: 12px;
		color: var(--color-accent);
		margin-bottom: 4px;
	}

	.period {
		font-size: 11px;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.desc {
		margin: 4px 0 0;
		font-size: 12.5px;
		line-height: 1.55;
		color: var(--color-text-secondary);
	}

	.meta {
		margin-top: 8px;
		font-size: 10.5px;
		color: var(--color-text-muted);
	}

	.mono {
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
	}

	.dim {
		color: var(--color-text-muted);
		opacity: 0.75;
	}

	@media (max-width: 640px) {
		.entry-head {
			flex-direction: column;
			align-items: flex-start;
			gap: 4px;
		}
	}
</style>
