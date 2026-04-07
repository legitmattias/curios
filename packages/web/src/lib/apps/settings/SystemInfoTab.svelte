<script lang="ts">
	const info = [
		{ label: 'OS', value: 'CuriOS v0.1.0' },
		{ label: 'Owner', value: 'Mattias Ubbesen' },
		{ label: 'Domain', value: 'mattic.dev' },
		{ label: 'Frontend', value: 'SvelteKit (Svelte 5)' },
		{ label: 'Backend', value: 'Hono + Bun' },
		{ label: 'Database', value: 'PostgreSQL 17' },
		{ label: 'Deployment', value: 'Docker + Caddy on Hetzner' },
		{ label: 'CI/CD', value: 'GitHub Actions' },
		{ label: 'Monorepo', value: 'pnpm workspaces' }
	];

	const links = [
		{ label: 'Source Code', url: 'https://github.com/legitmattias/curios' },
		{ label: 'API Docs', url: 'https://api.mattic.dev/doc' }
	];
</script>

<div class="system-info">
	<h3 class="section-title">System</h3>
	<dl class="info-list">
		{#each info as item (item.label)}
			<div class="info-row">
				<dt>{item.label}</dt>
				<dd>{item.value}</dd>
			</div>
		{/each}
	</dl>

	<h3 class="section-title links-title">Links</h3>
	<div class="link-list">
		{#each links as link (link.url)}
			<a href={link.url} target="_blank" rel="noopener external" class="info-link">
				{link.label}
				<svg
					width="10"
					height="10"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
					<polyline points="15 3 21 3 21 9" />
					<line x1="10" y1="14" x2="21" y2="3" />
				</svg>
			</a>
		{/each}
	</div>

	<div class="about">
		<h3 class="section-title">About</h3>
		<p class="about-text">
			CuriOS is a portfolio site that presents as a browser-based operating system. Every app is a
			real, functional piece of software — the terminal runs commands against a real API, the system
			monitor shows live metrics, and the file explorer browses actual database content.
		</p>
	</div>
</div>

<style>
	.system-info {
		padding: var(--space-4);
	}

	.section-title {
		font-size: var(--text-xs);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		margin-bottom: var(--space-3);
	}

	.links-title {
		margin-top: var(--space-5);
	}

	.info-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.info-row {
		display: flex;
		gap: var(--space-3);
		font-size: var(--text-sm);
		padding: var(--space-1) 0;
	}

	dt {
		color: var(--color-text-muted);
		min-width: 100px;
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	dd {
		margin: 0;
		color: var(--color-text-primary);
	}

	.link-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.info-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--color-accent);
		font-size: var(--text-sm);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.info-link:hover {
		color: var(--color-accent-hover);
	}

	.about {
		margin-top: var(--space-5);
	}

	.about-text {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		line-height: 1.7;
		max-width: 50ch;
	}
</style>
