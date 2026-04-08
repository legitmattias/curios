<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';
	import { localeStore } from '$lib/os/locale-store.svelte.js';
	import type { Skill, TranslationMeta } from '@curios/shared/types';
	import { fetchSkills } from '../api.js';
	import TranslationBadge from '$lib/components/os/TranslationBadge.svelte';

	let {
		onapimeta
	}: {
		onapimeta: (url: string, response: unknown) => void;
	} = $props();

	let skills = $state<Skill[]>([]);
	let translationMeta = $state<TranslationMeta | undefined>(undefined);
	let loading = $state(true);
	let error = $state<string | null>(null);

	function isLlmTranslated(entityId: string, field: string): boolean {
		return translationMeta?.[`${entityId}:${field}`]?.translatedBy === 'llm';
	}

	const grouped = $derived(() => {
		const groups: Record<string, Skill[]> = {};
		for (const skill of skills) {
			if (!groups[skill.category]) groups[skill.category] = [];
			groups[skill.category].push(skill);
		}
		return groups;
	});

	$effect(() => {
		void localeStore.current; // track locale changes for re-fetch
		fetchSkills()
			.then((result) => {
				skills = result.data;
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
		<p class="status">{t('explorer.loadingSkills')}</p>
	{:else if error}
		<p class="status error">{error}</p>
	{:else}
		{#each Object.entries(grouped()) as [category, items] (category)}
			<div class="category">
				<h3 class="category-title">
					{category}
					<TranslationBadge
						show={localeStore.current !== 'en' && isLlmTranslated(items[0].id, 'category')}
					/>
				</h3>
				<ul class="skill-list">
					{#each items as skill (skill.id)}
						<li class="skill-item">{skill.name}</li>
					{/each}
				</ul>
			</div>
		{/each}
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

	.category {
		margin-bottom: var(--space-4);
	}

	.category-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: var(--space-2);
	}

	.skill-list {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.skill-item {
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-button);
		background: var(--color-explorer-item-hover);
		color: var(--color-text-primary);
		font-size: 0.85rem;
	}
</style>
