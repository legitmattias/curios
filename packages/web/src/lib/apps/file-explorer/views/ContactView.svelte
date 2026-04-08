<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';
	import type { Profile } from '@curios/shared/types';
	import { fetchProfile } from '../api.js';

	let {
		onapimeta
	}: {
		onapimeta: (url: string, response: unknown) => void;
	} = $props();

	let profile = $state<Profile | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		fetchProfile()
			.then((result) => {
				profile = result.data;
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
		<h2 class="heading">{t('explorer.contact.heading')}</h2>
		<dl class="contact-list">
			<div class="contact-row">
				<dt>{t('explorer.contact.email')}</dt>
				<dd><a href="mailto:{profile.email}">{profile.email}</a></dd>
			</div>
			<div class="contact-row">
				<dt>{t('explorer.contact.github')}</dt>
				<dd>
					<a href={profile.github} target="_blank" rel="noopener external">{profile.github}</a>
				</dd>
			</div>
			{#if profile.linkedin}
				<div class="contact-row">
					<dt>{t('explorer.contact.linkedin')}</dt>
					<dd>
						<a href={profile.linkedin} target="_blank" rel="noopener external">{profile.linkedin}</a
						>
					</dd>
				</div>
			{/if}
			{#if profile.website}
				<div class="contact-row">
					<dt>{t('explorer.contact.website')}</dt>
					<dd>
						<a href={profile.website} target="_blank" rel="noopener external">{profile.website}</a>
					</dd>
				</div>
			{/if}
		</dl>
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

	.heading {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: var(--space-4);
	}

	.contact-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.contact-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	dt {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	dd {
		margin: 0;
	}

	a {
		color: var(--color-accent);
		font-size: 0.9rem;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
