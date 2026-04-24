<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import PageHeader from '$lib/admin/components/PageHeader.svelte';
	import DataRows from '$lib/admin/components/DataRows.svelte';
	import Tooltip from '$lib/admin/components/Tooltip.svelte';
	import ConfirmModal from '$lib/admin/components/ConfirmModal.svelte';
	import StatusPill, { type Status } from '$lib/admin/components/StatusPill.svelte';

	let { data } = $props();

	// Local working copy of the order — kept in sync with server data via the
	// $effect below; on drop we diff against the server-loaded order and prompt
	// to commit.
	let order = $state<string[]>([]);
	let dragSlug = $state<string | null>(null);
	let draggedOver = $state<string | null>(null);
	let confirmOpen = $state(false);
	let saveStatus = $state<Status>('idle');
	let saveError = $state<string | null>(null);

	// Re-sync local order when the server data changes (e.g. after invalidateAll).
	$effect(() => {
		order = data.projects.map((p) => p.slug);
	});

	const projectBySlug = $derived(new Map(data.projects.map((p) => [p.slug, p])));

	const isDirty = $derived(order.join(',') !== data.projects.map((p) => p.slug).join(','));

	function onDragStart(slug: string, e: DragEvent) {
		dragSlug = slug;
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}

	function onDragOver(slug: string, e: DragEvent) {
		e.preventDefault();
		draggedOver = slug;
	}

	function onDrop(target: string, e: DragEvent) {
		e.preventDefault();
		draggedOver = null;
		if (!dragSlug || dragSlug === target) return;
		const from = order.indexOf(dragSlug);
		const to = order.indexOf(target);
		if (from < 0 || to < 0) return;
		const next = order.slice();
		next.splice(from, 1);
		next.splice(to, 0, dragSlug);
		order = next;
		dragSlug = null;
	}

	function onDragEnd() {
		dragSlug = null;
		draggedOver = null;
	}

	async function saveOrder() {
		saveStatus = 'running';
		saveError = null;
		try {
			const res = await fetch('/admin/projects/order', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(order)
			});
			const body = (await res.json()) as {
				ok: boolean;
				error: string | null;
			};
			if (!body.ok) {
				saveStatus = 'error';
				saveError = body.error ?? 'Reorder failed';
				return;
			}
			saveStatus = 'success';
			// Refresh loaded data so isDirty returns to false.
			await invalidateAll();
		} catch (err) {
			saveStatus = 'error';
			saveError = err instanceof Error ? err.message : String(err);
		}
	}

	function revertOrder() {
		order = data.projects.map((p) => p.slug);
		saveStatus = 'idle';
		saveError = null;
	}
</script>

<svelte:head>
	<title>Admin · Projects · CuriOS</title>
</svelte:head>

<PageHeader
	eyebrow="Projects · {data.projects.length}"
	lede="Synced from Dossier. Drag rows to reorder — the File Explorer app renders them in this order. Descriptions and tech tags are LLM-generated."
>
	{#snippet actions()}
		<div class="head-actions">
			{#if isDirty}
				<span class="dirty-chip">Unsaved order</span>
				<Tooltip label="Discard your pending drag-and-drop changes">
					<button class="btn ghost" onclick={revertOrder} disabled={saveStatus === 'running'}>
						Revert
					</button>
				</Tooltip>
				<Tooltip label="Commit the new display order to the database">
					<button
						class="btn primary"
						onclick={() => (confirmOpen = true)}
						disabled={saveStatus === 'running'}
					>
						{saveStatus === 'running' ? 'Saving…' : 'Save order'}
					</button>
				</Tooltip>
			{:else}
				<StatusPill status={saveStatus} label={saveStatus === 'success' ? 'Saved' : undefined} />
			{/if}
		</div>
	{/snippet}
</PageHeader>

{#if saveError}
	<div class="error-banner" role="alert">{saveError}</div>
{/if}

<DataRows>
	<ol class="rows">
		{#each order as slug, index (slug)}
			{@const p = projectBySlug.get(slug)}
			{#if p}
				<li
					class="row"
					class:dragging={dragSlug === slug}
					class:drop-target={draggedOver === slug && dragSlug !== slug}
					draggable="true"
					ondragstart={(e) => onDragStart(slug, e)}
					ondragover={(e) => onDragOver(slug, e)}
					ondrop={(e) => onDrop(slug, e)}
					ondragend={onDragEnd}
				>
					<Tooltip label="Drag to reorder">
						<span class="handle" aria-hidden="true">⋮⋮</span>
					</Tooltip>
					<span class="index mono">{index + 1}</span>
					<div class="body">
						<div class="title-line">
							<span class="title">{p.title}</span>
							<span class="slug mono">{p.slug}</span>
						</div>
						<p class="desc">{p.description}</p>
						{#if p.tech && p.tech.length > 0}
							<div class="tech">
								{#each p.tech as t (typeof t === 'string' ? t : t.name)}
									<span class="tag">{typeof t === 'string' ? t : t.name}</span>
								{/each}
							</div>
						{/if}
					</div>
					<div class="links mono">
						{#if p.repo}
							<a href={p.repo} target="_blank" rel="noopener external">repo ↗</a>
						{/if}
						{#if p.url && p.url !== p.repo}
							<a href={p.url} target="_blank" rel="noopener external">url ↗</a>
						{/if}
					</div>
				</li>
			{/if}
		{/each}
	</ol>
</DataRows>

<ConfirmModal
	bind:open={confirmOpen}
	title="Save new project order?"
	message="The File Explorer and PDF CV will render projects in this order immediately. You can reorder again at any time."
	confirmLabel="Save"
	onconfirm={saveOrder}
/>

<style>
	.head-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.dirty-chip {
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: var(--color-control-minimize);
		border: 1px solid var(--color-control-minimize);
		border-radius: 2px;
	}

	.btn {
		height: 28px;
		padding: 0 12px;
		font-family: inherit;
		font-size: 12px;
		font-weight: 500;
		border-radius: 3px;
		cursor: pointer;
		border: 1px solid var(--color-explorer-border);
		background: transparent;
		color: var(--color-text-primary);
		transition:
			border-color var(--transition-fast),
			background var(--transition-fast);
	}

	.btn.ghost:hover:not(:disabled) {
		background: var(--color-explorer-item-hover);
	}

	.btn.primary {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: #ffffff;
	}

	.btn.primary:hover:not(:disabled) {
		background: var(--color-accent-hover);
		border-color: var(--color-accent-hover);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error-banner {
		padding: 10px var(--space-3);
		margin-bottom: var(--space-3);
		font-size: 12.5px;
		color: var(--color-control-close);
		border: 1px solid var(--color-control-close);
		border-radius: 3px;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.row {
		display: grid;
		grid-template-columns: 20px 28px 1fr auto;
		gap: 12px;
		align-items: start;
		padding: 10px var(--space-3);
		border-bottom: 1px solid var(--color-explorer-border);
		cursor: grab;
		transition: background var(--transition-fast);
	}

	.row:last-child {
		border-bottom: none;
	}

	.row:hover {
		background: var(--color-explorer-item-hover);
	}

	.row.dragging {
		opacity: 0.4;
	}

	.row.drop-target {
		background: var(--color-explorer-item-active);
		box-shadow: inset 0 2px 0 var(--color-accent);
	}

	.handle {
		color: var(--color-text-muted);
		font-size: 14px;
		line-height: 1;
		user-select: none;
		padding-top: 2px;
	}

	.index {
		font-size: 11px;
		color: var(--color-text-muted);
		padding-top: 3px;
		text-align: right;
	}

	.body {
		min-width: 0;
	}

	.title-line {
		display: flex;
		align-items: baseline;
		gap: 10px;
		flex-wrap: wrap;
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

	.desc {
		margin: 4px 0 6px;
		font-size: 12px;
		line-height: 1.5;
		color: var(--color-text-secondary);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
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

	.links {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-top: 2px;
		font-size: 11px;
	}

	.links a {
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.links a:hover {
		color: var(--color-accent);
	}

	@media (max-width: 640px) {
		.row {
			grid-template-columns: 20px 1fr;
		}
		.index,
		.links {
			display: none;
		}
	}
</style>
