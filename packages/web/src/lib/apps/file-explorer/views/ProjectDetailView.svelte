<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';
	import { localeStore } from '$lib/os/locale-store.svelte.js';
	import type { Project, TranslationMeta } from '@curios/shared/types';
	import { fetchProject } from '../api.js';
	import TranslationBadge from '$lib/components/os/TranslationBadge.svelte';

	let {
		slug,
		onapimeta
	}: {
		slug: string;
		onapimeta: (url: string, response: unknown) => void;
	} = $props();

	let project = $state<Project | null>(null);
	let translationMeta = $state<TranslationMeta | undefined>(undefined);
	let loading = $state(true);
	let error = $state<string | null>(null);

	function isLlmTranslated(entityId: string, field: string): boolean {
		return translationMeta?.[`${entityId}:${field}`]?.translatedBy === 'llm';
	}

	$effect(() => {
		void localeStore.current; // track locale changes for re-fetch
		loading = true;
		error = null;
		fetchProject(slug)
			.then((result) => {
				project = result.data;
				translationMeta = result.translationMeta;
				onapimeta(result.url, result.raw);
			})
			.catch((err) => {
				error = err.message;
			})
			.finally(() => {
				loading = false;
			});
	});
</script>

<div class="view">
	{#if loading}
		<p class="status">{t('explorer.loading')}</p>
	{:else if error}
		<p class="status error">{error}</p>
	{:else if project}
		<h2 class="title">
			{project.title}
			<TranslationBadge
				show={localeStore.current !== 'en' && isLlmTranslated(project.id, 'title')}
			/>
		</h2>
		<p class="description">
			{project.description}
			<TranslationBadge
				show={localeStore.current !== 'en' && isLlmTranslated(project.id, 'description')}
			/>
		</p>

		<div class="section">
			<h3 class="section-title">{t('explorer.detail.techStack')}</h3>
			<div class="tags">
				{#each project.tech as tech (tech)}
					<span class="tag">{tech}</span>
				{/each}
			</div>
		</div>

		{#if project.url || project.repo}
			<div class="section">
				<h3 class="section-title">{t('explorer.detail.links')}</h3>
				<div class="links">
					{#if project.url}
						<a href={project.url} target="_blank" rel="noopener external">{project.url}</a>
					{/if}
					{#if project.repo}
						<a href={project.repo} target="_blank" rel="noopener external">{project.repo}</a>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.view {
		padding: var(--space-4);
		height: 100%;
		overflow: auto;
	}

	.status {
		color: var(--color-text-secondary);
		font-size: 0.85rem;
	}

	.status.error {
		color: var(--color-control-close);
	}

	.title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: var(--space-2);
	}

	.description {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		line-height: 1.6;
		margin-bottom: var(--space-4);
	}

	.section {
		margin-bottom: var(--space-4);
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: var(--space-2);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.tag {
		padding: 2px var(--space-2);
		border-radius: var(--radius-button);
		background: var(--color-explorer-item-hover);
		color: var(--color-text-primary);
		font-size: 0.75rem;
		font-family: var(--font-mono);
	}

	.links {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.links a {
		color: var(--color-accent);
		font-size: 0.85rem;
		text-decoration: none;
	}

	.links a:hover {
		text-decoration: underline;
	}
</style>
