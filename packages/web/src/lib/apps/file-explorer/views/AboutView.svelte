<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';
	import { localeStore } from '$lib/os/locale-store.svelte.js';
	import type { Profile, TranslationMeta } from '@curios/shared/types';
	import { fetchProfile } from '../api.js';
	import TranslationBadge from '$lib/components/os/TranslationBadge.svelte';

	let {
		onapimeta
	}: {
		onapimeta: (url: string, response: unknown) => void;
	} = $props();

	let profile = $state<Profile | null>(null);
	let translationMeta = $state<TranslationMeta | undefined>(undefined);
	let loading = $state(true);
	let error = $state<string | null>(null);

	function isLlmTranslated(entityId: string, field: string): boolean {
		return translationMeta?.[`${entityId}:${field}`]?.translatedBy === 'llm';
	}

	$effect(() => {
		void localeStore.current; // track locale changes for re-fetch
		fetchProfile()
			.then((result) => {
				profile = result.data;
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
	{:else if profile}
		<h2 class="name">{profile.name}</h2>
		<p class="title">
			{profile.title}
			<TranslationBadge
				show={localeStore.current !== 'en' && isLlmTranslated(profile.id, 'title')}
			/>
		</p>
		<p class="location">{profile.location}</p>
		<p class="bio">
			{profile.bio}
			<TranslationBadge show={localeStore.current !== 'en' && isLlmTranslated(profile.id, 'bio')} />
		</p>
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

	.name {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: var(--space-1);
	}

	.title {
		font-size: 1rem;
		color: var(--color-accent);
		margin-bottom: var(--space-1);
	}

	.location {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin-bottom: var(--space-4);
	}

	.bio {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		line-height: 1.7;
		max-width: 60ch;
	}
</style>
