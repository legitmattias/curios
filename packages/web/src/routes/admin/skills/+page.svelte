<script lang="ts">
	import PageHeader from '$lib/admin/components/PageHeader.svelte';
	import DataRows from '$lib/admin/components/DataRows.svelte';
	import Tooltip from '$lib/admin/components/Tooltip.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Admin · Skills · CuriOS</title>
</svelte:head>

<PageHeader
	eyebrow="Skills · {data.total}"
	lede="Featured + public skills synced from Dossier. Each skill's description is LLM-generated with project cross-references."
/>

{#each data.groups as group (group.category)}
	<DataRows title={group.category} count={group.items.length}>
		<ul class="items">
			{#each group.items as s (s.id)}
				<li class="item">
					<span class="name">{s.name}</span>
					{#if s.description}
						<Tooltip label={s.description} side="top">
							<span class="help" aria-label="Description">?</span>
						</Tooltip>
					{/if}
				</li>
			{/each}
		</ul>
	</DataRows>
{/each}

{#if data.groups.length === 0}
	<DataRows empty="No skills in the database — run the Skills sync to populate." />
{/if}

<style>
	.items {
		list-style: none;
		margin: 0;
		padding: 8px var(--space-3);
		display: flex;
		flex-wrap: wrap;
		gap: 4px 6px;
	}

	.item {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px;
		font-size: 12px;
		color: var(--color-text-primary);
		border: 1px solid var(--color-explorer-border);
		border-radius: 3px;
		background: transparent;
	}

	.name {
		line-height: 1.2;
	}

	.help {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 13px;
		height: 13px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 9px;
		color: var(--color-text-muted);
		border: 1px dashed var(--color-explorer-border);
		border-radius: 50%;
		cursor: help;
	}
</style>
