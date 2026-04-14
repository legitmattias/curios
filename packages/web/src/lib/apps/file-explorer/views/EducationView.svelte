<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';
	import { localeStore } from '$lib/os/locale-store.svelte.js';
	import type { Education, TranslationMeta } from '@curios/shared/types';
	import { fetchEducation } from '../api.js';
	import TranslationBadge from '$lib/components/os/TranslationBadge.svelte';

	let {
		onapimeta
	}: {
		onapimeta: (url: string, response: unknown) => void;
	} = $props();

	let entries = $state<Education[]>([]);
	let translationMeta = $state<TranslationMeta | undefined>(undefined);
	let loading = $state(true);
	let error = $state<string | null>(null);

	function isLlmTranslated(entityId: string, field: string): boolean {
		return translationMeta?.[`${entityId}:${field}`]?.translatedBy === 'llm';
	}

	function formatDate(date: string | null): string {
		if (!date) return t('cv.present');
		const d = new Date(date);
		return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
	}

	$effect(() => {
		void localeStore.current;
		fetchEducation()
			.then((result) => {
				entries = result.data;
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
		<p class="status">{t('explorer.loadingEducation')}</p>
	{:else if error}
		<p class="status error">{error}</p>
	{:else}
		<div class="timeline">
			{#each entries as entry (entry.id)}
				<div class="entry">
					<div class="entry-header">
						<h3 class="degree">
							{entry.degree}
							<TranslationBadge
								show={localeStore.current !== 'en' && isLlmTranslated(entry.id, 'degree')}
							/>
						</h3>
						<span class="dates">{formatDate(entry.startDate)} — {formatDate(entry.endDate)}</span>
					</div>
					<p class="field">
						{entry.field}
						<TranslationBadge
							show={localeStore.current !== 'en' && isLlmTranslated(entry.id, 'field')}
						/>
					</p>
					<p class="institution">
						{entry.institution}
						<TranslationBadge
							show={localeStore.current !== 'en' && isLlmTranslated(entry.id, 'institution')}
						/>
					</p>
					{#if entry.description}
						<p class="description">
							{entry.description}
							<TranslationBadge
								show={localeStore.current !== 'en' && isLlmTranslated(entry.id, 'description')}
							/>
						</p>
					{/if}
				</div>
			{/each}
		</div>
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

	.timeline {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.entry {
		border-left: 2px solid var(--color-accent);
		padding-left: var(--space-4);
	}

	.entry-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.degree {
		font-size: 1rem;
		font-weight: 600;
	}

	.dates {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		flex-shrink: 0;
	}

	.field {
		font-size: 0.85rem;
		color: var(--color-accent);
		margin: var(--space-1) 0 0;
	}

	.institution {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		margin: var(--space-1) 0 var(--space-2);
	}

	.description {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		line-height: 1.6;
	}
</style>
