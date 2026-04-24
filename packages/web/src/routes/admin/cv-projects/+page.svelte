<script lang="ts">
	import PageHeader from '$lib/admin/components/PageHeader.svelte';
	import DataRows from '$lib/admin/components/DataRows.svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head>
	<title>Admin · CV projects · CuriOS</title>
</svelte:head>

<PageHeader
	eyebrow="CV project summaries · {data.en.length}"
	lede="LLM-condensed one-sentence descriptions per project. Regenerate from the Sync panel."
>
	{#snippet actions()}
		<a class="action-link" href={resolve('/admin/sync')}>Open Sync →</a>
	{/snippet}
</PageHeader>

{#if data.en.length === 0}
	<DataRows
		empty="No CV project summaries yet — run the CV project summaries sync to generate them."
	/>
{:else}
	<DataRows title="English" count={data.en.length}>
		<ul class="items">
			{#each data.en as p (p.slug)}
				<li class="item">
					<div class="item-head">
						<span class="title">{p.title}</span>
						<span class="slug mono">{p.slug}</span>
					</div>
					<p class="summary">{p.summary}</p>
					<div class="tech">
						{#each p.tech as t (t)}
							<span class="tag">{t}</span>
						{/each}
					</div>
				</li>
			{/each}
		</ul>
	</DataRows>

	<DataRows title="Swedish" count={data.sv.length}>
		{#if data.sv.length === 0}
			<div class="empty-body">
				Swedish output not present — re-run sync to regenerate with EN+SV.
			</div>
		{:else}
			<ul class="items">
				{#each data.sv as p (p.slug)}
					<li class="item">
						<div class="item-head">
							<span class="title">{p.title}</span>
							<span class="slug mono">{p.slug}</span>
						</div>
						<p class="summary">{p.summary}</p>
						<div class="tech">
							{#each p.tech as t (t)}
								<span class="tag">{t}</span>
							{/each}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</DataRows>
{/if}

<style>
	.items {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.item {
		padding: 12px var(--space-3);
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.item:last-child {
		border-bottom: none;
	}

	.item-head {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin-bottom: 4px;
	}

	.title {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.slug {
		font-size: 10.5px;
		color: var(--color-text-muted);
	}

	.summary {
		margin: 0 0 6px;
		font-size: 12.5px;
		line-height: 1.55;
		color: var(--color-text-secondary);
	}

	.tech {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
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

	.mono {
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
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
