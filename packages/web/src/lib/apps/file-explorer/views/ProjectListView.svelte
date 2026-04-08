<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';
	import type { Project } from '@curios/shared/types';
	import { fetchProjects } from '../api.js';

	let {
		onnavigate,
		onapimeta
	}: {
		onnavigate: (path: string) => void;
		onapimeta: (url: string, response: unknown) => void;
	} = $props();

	let projects = $state<Project[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		fetchProjects()
			.then((result) => {
				projects = result.data;
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
		<p class="status">{t('explorer.loadingProjects')}</p>
	{:else if error}
		<p class="status error">{error}</p>
	{:else}
		<ul class="file-list">
			{#each projects as project (project.slug)}
				<li>
					<button class="file-item" onclick={() => onnavigate(`/projects/${project.slug}`)}>
						<span class="file-icon">📋</span>
						<div class="file-info">
							<span class="file-name">{project.title}</span>
							<span class="file-meta">{project.tech.join(', ')}</span>
						</div>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.view {
		padding: var(--space-3);
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

	.file-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.file-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: none;
		border-radius: var(--radius-button);
		background: none;
		color: var(--color-text-primary);
		font-family: inherit;
		font-size: 0.85rem;
		cursor: pointer;
		text-align: left;
		transition: background var(--transition-fast);
	}

	.file-item:hover {
		background: var(--color-explorer-item-hover);
	}

	.file-icon {
		font-size: 1.2rem;
		flex-shrink: 0;
	}

	.file-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.file-name {
		font-weight: 500;
	}

	.file-meta {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
