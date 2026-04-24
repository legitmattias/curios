<script lang="ts">
	import PageHeader from '$lib/admin/components/PageHeader.svelte';
	import DataRows from '$lib/admin/components/DataRows.svelte';

	let { data } = $props();
	const rows = $derived(data.experience);
</script>

<svelte:head>
	<title>Admin · Experience · CuriOS</title>
</svelte:head>

<PageHeader
	eyebrow="Experience"
	lede="Seeded from curios-dev/seed/content.json on every deploy. Edit there, then run ./seed/update-secret.sh and redeploy."
/>

<DataRows count={rows.length} empty={rows.length === 0 ? 'No experience entries.' : ''}>
	<ol class="entries">
		{#each rows as exp (exp.id)}
			<li class="entry">
				<div class="entry-head">
					<div class="entry-title">
						<span class="role">{exp.role}</span>
						<span class="sep">·</span>
						<span class="company">{exp.company}</span>
					</div>
					<div class="period mono">
						{exp.startDate} — {exp.endDate ?? 'present'}
					</div>
				</div>
				<p class="desc">{exp.description}</p>
				{#if exp.tech && exp.tech.length > 0}
					<div class="tech">
						{#each exp.tech as t (t)}
							<span class="tag">{t}</span>
						{/each}
					</div>
				{/if}
				<div class="meta mono">
					sortOrder {exp.sortOrder} · id <span class="dim">{exp.id}</span>
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
		margin-bottom: 4px;
	}

	.entry-title {
		display: flex;
		align-items: baseline;
		gap: 6px;
		flex-wrap: wrap;
		font-size: 13px;
	}

	.role {
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.sep {
		color: var(--color-text-muted);
	}

	.company {
		color: var(--color-accent);
	}

	.period {
		font-size: 11px;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.desc {
		margin: 6px 0;
		font-size: 12.5px;
		line-height: 1.55;
		color: var(--color-text-secondary);
	}

	.tech {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 6px;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		padding: 1px 6px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		color: var(--color-text-secondary);
		border: 1px solid var(--color-explorer-border);
		border-radius: 2px;
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
