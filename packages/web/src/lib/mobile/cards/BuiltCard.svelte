<script lang="ts">
	import { fetchProjects } from '$lib/apps/file-explorer/api.js';
	import { localeStore } from '$lib/os/locale-store.svelte.js';
	import { t } from '$lib/os/i18n.svelte.js';
	import type { Project } from '@curios/shared/types';

	let projects = $state<Project[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Refetch when the locale changes so translated content follows.
	$effect(() => {
		const currentLocale = localeStore.current;
		void (async () => {
			loading = true;
			error = null;
			try {
				const res = await fetchProjects();
				projects = res.data;
			} catch (err) {
				error = err instanceof Error ? err.message : String(err);
			} finally {
				loading = false;
			}
			// Reference the locale to establish the dependency.
			void currentLocale;
		})();
	});

	const MAX_TECH = 6;

	function displayTech(p: Project): string[] {
		if (!p.tech) return [];
		return p.tech.slice(0, MAX_TECH).map((t) => (typeof t === 'string' ? t : t.name));
	}

	function primaryLink(p: Project): string | null {
		return p.url ?? p.repo ?? null;
	}

	function prettyUrl(url: string): string {
		return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
	}
</script>

{#if loading}
	<p class="state">{t('mobile.loading')}</p>
{:else if error}
	<p class="state error">{error}</p>
{:else if projects.length === 0}
	<p class="state">{t('mobile.built.empty')}</p>
{:else}
	<p class="lede">{t('mobile.built.intro')}</p>
	<ul class="list">
		{#each projects as p (p.slug)}
			{@const link = primaryLink(p)}
			<li class="project">
				<h3 class="title">
					{#if link}
						<a href={link} target="_blank" rel="noopener external">{p.title}</a>
					{:else}
						{p.title}
					{/if}
				</h3>
				<p class="desc">{p.description}</p>
				{#if p.tech && p.tech.length > 0}
					<div class="tech">
						{#each displayTech(p) as tag (tag)}
							<span class="tag">{tag}</span>
						{/each}
						{#if p.tech.length > MAX_TECH}
							<span class="tag more">+{p.tech.length - MAX_TECH}</span>
						{/if}
					</div>
				{/if}
				{#if p.url || p.repo}
					<div class="links">
						{#if p.url}
							<a class="link" href={p.url} target="_blank" rel="noopener external"
								>{prettyUrl(p.url)}</a
							>
						{/if}
						{#if p.repo && p.repo !== p.url}
							<a class="link" href={p.repo} target="_blank" rel="noopener external"
								>{prettyUrl(p.repo)}</a
							>
						{/if}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.lede {
		margin: 0 0 16px;
		font-size: 13px;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.state {
		color: var(--color-text-muted);
		font-size: 13px;
	}

	.state.error {
		color: var(--color-control-close);
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.project {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 16px 0;
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.project:last-child {
		border-bottom: none;
	}

	.title {
		margin: 0;
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text-primary);
		letter-spacing: -0.01em;
	}

	.title a {
		color: inherit;
		text-decoration: none;
	}

	.title a:active {
		color: var(--color-accent);
	}

	.desc {
		margin: 0;
		font-size: 13.5px;
		line-height: 1.55;
		color: var(--color-text-secondary);
	}

	.tech {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-top: 4px;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		padding: 2px 7px;
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.02em;
		color: var(--color-text-secondary);
		border: 1px solid var(--color-explorer-border);
		border-radius: 3px;
	}

	.tag.more {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.links {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-top: 6px;
	}

	.link {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-accent);
		text-decoration: none;
		word-break: break-all;
	}

	.link:active {
		text-decoration: underline;
	}
</style>
