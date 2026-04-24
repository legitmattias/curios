<script lang="ts">
	import PageHeader from '$lib/admin/components/PageHeader.svelte';
	import DataRows from '$lib/admin/components/DataRows.svelte';
	import Tooltip from '$lib/admin/components/Tooltip.svelte';

	let { data } = $props();
	const p = $derived(data.profile);

	function asList(value: unknown): string {
		if (!value) return '—';
		if (Array.isArray(value)) return value.join(', ');
		if (typeof value === 'object') return JSON.stringify(value);
		return String(value);
	}
</script>

<svelte:head>
	<title>Admin · Profile · CuriOS</title>
</svelte:head>

<PageHeader
	eyebrow="Profile"
	lede="Single-row identity record. Seeded from curios-dev/seed/content.json; sync does not touch this table."
/>

<DataRows>
	<dl class="kv">
		<div class="row">
			<dt>
				Name
				<Tooltip label="profile.name (used in watermark, CV title, agent prompts)">
					<span class="help">?</span>
				</Tooltip>
			</dt>
			<dd>{p.name}</dd>
		</div>
		<div class="row">
			<dt>Title</dt>
			<dd>{p.title}</dd>
		</div>
		<div class="row">
			<dt>
				Birth date
				<Tooltip
					label="profile.birthDate — used server-side to compute age for the chat agent. Month precision is enough."
				>
					<span class="help">?</span>
				</Tooltip>
			</dt>
			<dd><span class="mono">{p.birthDate ?? '—'}</span></dd>
		</div>
		<div class="row">
			<dt>Location</dt>
			<dd>{p.location}</dd>
		</div>
		<div class="row">
			<dt>Email</dt>
			<dd><span class="mono">{p.email}</span></dd>
		</div>
		<div class="row">
			<dt>GitHub</dt>
			<dd>
				<a class="mono" href={p.github} target="_blank" rel="noopener external">{p.github}</a>
			</dd>
		</div>
		<div class="row">
			<dt>LinkedIn</dt>
			<dd>
				{#if p.linkedin}
					<a class="mono" href={p.linkedin} target="_blank" rel="noopener external">{p.linkedin}</a>
				{:else}
					<span class="muted">—</span>
				{/if}
			</dd>
		</div>
		<div class="row">
			<dt>Website</dt>
			<dd>
				{#if p.website}
					<a class="mono" href={p.website} target="_blank" rel="noopener external">{p.website}</a>
				{:else}
					<span class="muted">—</span>
				{/if}
			</dd>
		</div>
		<div class="row bio">
			<dt>Bio (EN)</dt>
			<dd>{p.bio}</dd>
		</div>
		<div class="row">
			<dt>
				Other (EN)
				<Tooltip label="profile.otherInfo.en — rendered in the CV Other sidebar section.">
					<span class="help">?</span>
				</Tooltip>
			</dt>
			<dd>{asList(p.otherInfo?.en)}</dd>
		</div>
		<div class="row">
			<dt>Other (SV)</dt>
			<dd>{asList(p.otherInfo?.sv)}</dd>
		</div>
	</dl>
</DataRows>

<style>
	.kv {
		margin: 0;
	}

	.row {
		display: grid;
		grid-template-columns: 180px 1fr;
		gap: var(--space-3);
		padding: 9px var(--space-3);
		border-bottom: 1px solid var(--color-explorer-border);
		align-items: baseline;
		font-size: 12.5px;
	}

	.row:last-child {
		border-bottom: none;
	}

	dt {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin: 0;
	}

	dd {
		margin: 0;
		color: var(--color-text-primary);
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.bio dd {
		line-height: 1.55;
		color: var(--color-text-secondary);
	}

	.mono {
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 12px;
	}

	a {
		color: var(--color-accent);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	.muted {
		color: var(--color-text-muted);
	}

	.help {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 13px;
		height: 13px;
		font-size: 9px;
		color: var(--color-text-muted);
		border: 1px dashed var(--color-explorer-border);
		border-radius: 50%;
		cursor: help;
	}

	@media (max-width: 640px) {
		.row {
			grid-template-columns: 1fr;
			gap: 2px;
		}
	}
</style>
