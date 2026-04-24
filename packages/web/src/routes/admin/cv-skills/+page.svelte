<script lang="ts">
	import PageHeader from '$lib/admin/components/PageHeader.svelte';
	import DataRows from '$lib/admin/components/DataRows.svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();
	const count = $derived(data.en.length);
</script>

<svelte:head>
	<title>Admin · CV skills · CuriOS</title>
</svelte:head>

<PageHeader
	eyebrow="CV skills clusters · {count}"
	lede="LLM-summarised cluster set rendered on the CV sidebar. Regenerate from the Sync panel."
>
	{#snippet actions()}
		<a class="action-link" href={resolve('/admin/sync')}>Open Sync →</a>
	{/snippet}
</PageHeader>

{#if count === 0}
	<DataRows empty="No clusters yet — run the CV skill clusters sync to generate them." />
{:else}
	<DataRows title="English" count={data.en.length}>
		<ul class="clusters">
			{#each data.en as c, i (i)}
				<li class="cluster">
					<div class="cluster-head">{c.category}</div>
					<div class="cluster-summary">{c.summary}</div>
				</li>
			{/each}
		</ul>
	</DataRows>

	<DataRows title="Swedish" count={data.sv.length}>
		{#if data.sv.length === 0}
			<div class="empty-body">Swedish output not present — check that the sync ran with EN+SV.</div>
		{:else}
			<ul class="clusters">
				{#each data.sv as c, i (i)}
					<li class="cluster">
						<div class="cluster-head">{c.category}</div>
						<div class="cluster-summary">{c.summary}</div>
					</li>
				{/each}
			</ul>
		{/if}
	</DataRows>
{/if}

<style>
	.clusters {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.cluster {
		padding: 10px var(--space-3);
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.cluster:last-child {
		border-bottom: none;
	}

	.cluster-head {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--color-accent);
		margin-bottom: 3px;
	}

	.cluster-summary {
		font-size: 12.5px;
		line-height: 1.5;
		color: var(--color-text-secondary);
	}

	.action-link {
		display: inline-block;
		padding: 6px 10px;
		font-size: 12px;
		color: var(--color-text-primary);
		text-decoration: none;
		border: 1px solid var(--color-explorer-border);
		border-radius: 3px;
		transition: border-color var(--transition-fast);
	}

	.action-link:hover {
		border-color: var(--color-accent);
	}

	.empty-body {
		padding: var(--space-3);
		font-size: 12px;
		color: var(--color-text-muted);
	}
</style>
