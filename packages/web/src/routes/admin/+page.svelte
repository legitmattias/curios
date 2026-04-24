<script lang="ts">
	import { resolve } from '$app/paths';
	import Tooltip from '$lib/admin/components/Tooltip.svelte';
	import RelativeTime from '$lib/admin/components/RelativeTime.svelte';
	import KbdHint from '$lib/admin/components/KbdHint.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Admin · Dashboard · CuriOS</title>
</svelte:head>

<section class="section">
	<header class="section-head">
		<h1 class="eyebrow">Dashboard</h1>
		<p class="lede">
			Current state of the CuriOS database. Tiles link to the related sync operation.
		</p>
	</header>

	<div class="tiles">
		{#each data.tiles as tile (tile.key)}
			<a class="tile" href={resolve(tile.href as '/admin/sync')}>
				<div class="tile-head">
					<span class="tile-label">{tile.label}</span>
					<Tooltip label={tile.hint} side="left">
						<span class="hint-dot" aria-hidden="true">?</span>
					</Tooltip>
				</div>
				<div class="tile-count">{tile.count}</div>
				<div class="tile-meta">
					<span class="meta-key">updated</span>
					<RelativeTime iso={tile.lastUpdated} placeholder="never" />
				</div>
			</a>
		{/each}
	</div>
</section>

<section class="section">
	<header class="section-head row">
		<h2 class="eyebrow">Quick actions</h2>
	</header>

	<div class="actions">
		<a class="action" href={resolve('/admin/sync')}>
			<span class="action-label">Open sync panel</span>
			<KbdHint keys="G S" compact />
		</a>
	</div>
</section>

<section class="section">
	<header class="section-head">
		<h2 class="eyebrow">Data origin</h2>
	</header>
	<div class="origin">
		<div class="origin-row">
			<span class="origin-key">Projects + Skills</span>
			<span class="origin-val">
				Synced from Dossier via <code>/api/sync/projects</code> and
				<code>/api/sync/skills</code>.
			</span>
		</div>
		<div class="origin-row">
			<span class="origin-key">Experience + Education + Profile</span>
			<span class="origin-val">
				Seeded from <code>curios-dev/seed/content.json</code> on every deploy.
			</span>
		</div>
		<div class="origin-row">
			<span class="origin-key">CV clusters + summaries</span>
			<span class="origin-val">
				LLM-generated via <code>/api/sync/cv-skills</code> and
				<code>/api/sync/cv-projects</code>. Cost a few cents per run.
			</span>
		</div>
		<div class="origin-row">
			<span class="origin-key">Languages</span>
			<span class="origin-val">
				Featured spoken languages synced from Dossier via <code>/api/sync/languages</code>.
			</span>
		</div>
	</div>
</section>

<style>
	.section {
		margin-bottom: var(--space-5);
		max-width: 960px;
	}

	.section-head {
		margin-bottom: var(--space-3);
	}

	.section-head.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.eyebrow {
		margin: 0 0 4px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-accent);
	}

	.lede {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--color-text-secondary);
		max-width: 60ch;
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0;
		border: 1px solid var(--color-explorer-border);
		border-radius: 4px;
		overflow: hidden;
	}

	.tile {
		display: block;
		padding: var(--space-3);
		text-decoration: none;
		color: var(--color-text-primary);
		border-right: 1px solid var(--color-explorer-border);
		border-bottom: 1px solid var(--color-explorer-border);
		background: var(--color-window-bg);
		transition: background var(--transition-fast);
	}

	.tile:hover {
		background: var(--color-explorer-item-hover);
	}

	.tile-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6px;
	}

	.tile-label {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.hint-dot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 9px;
		color: var(--color-text-muted);
		border: 1px dashed var(--color-explorer-border);
		border-radius: 50%;
		cursor: help;
	}

	.tile-count {
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 28px;
		font-weight: 500;
		line-height: 1;
		letter-spacing: -0.02em;
		color: var(--color-text-primary);
		margin-bottom: 8px;
	}

	.tile-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		color: var(--color-text-muted);
	}

	.meta-key {
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.action {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		font-size: 12.5px;
		color: var(--color-text-primary);
		text-decoration: none;
		background: var(--color-window-bg);
		border: 1px solid var(--color-explorer-border);
		border-radius: 3px;
		transition:
			border-color var(--transition-fast),
			background var(--transition-fast);
	}

	.action:hover {
		border-color: var(--color-accent);
		background: var(--color-explorer-item-hover);
	}

	.origin {
		border: 1px solid var(--color-explorer-border);
		border-radius: 4px;
		overflow: hidden;
		background: var(--color-window-bg);
	}

	.origin-row {
		display: grid;
		grid-template-columns: 220px 1fr;
		gap: var(--space-3);
		padding: 10px var(--space-3);
		font-size: 12.5px;
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.origin-row:last-child {
		border-bottom: none;
	}

	.origin-key {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.origin-val {
		color: var(--color-text-secondary);
		line-height: 1.5;
	}

	code {
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 12px;
		padding: 1px 5px;
		background: var(--color-explorer-item-hover);
		border-radius: 2px;
	}

	@media (max-width: 640px) {
		.origin-row {
			grid-template-columns: 1fr;
			gap: 4px;
		}
	}
</style>
