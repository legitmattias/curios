<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';
	import { localeStore, type Locale } from '$lib/os/locale-store.svelte.js';

	// Native names — always shown in each language's own spelling so a visitor
	// currently seeing the "wrong" locale can still find their option.
	const locales: { id: Locale; native: string }[] = [
		{ id: 'en', native: 'English' },
		{ id: 'sv', native: 'Svenska' }
	];
</script>

<div class="language">
	<h3 class="section-title">{t('settings.language')}</h3>
	<div class="locale-cards">
		{#each locales as locale (locale.id)}
			<button
				class="locale-card"
				class:active={localeStore.current === locale.id}
				onclick={() => localeStore.set(locale.id)}
				aria-label={locale.native}
			>
				<span class="locale-label">{locale.native}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.language {
		padding: var(--space-4);
	}

	.section-title {
		font-size: var(--text-xs);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		margin-bottom: var(--space-4);
	}

	.locale-cards {
		display: flex;
		gap: var(--space-3);
	}

	.locale-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		border: 2px solid var(--color-explorer-border);
		border-radius: var(--radius-window);
		background: transparent;
		color: var(--color-text-primary);
		cursor: pointer;
		font-family: inherit;
		flex: 1;
		transition:
			border-color var(--transition-fast),
			background var(--transition-fast);
	}

	.locale-card:hover {
		background: var(--color-explorer-item-hover);
	}

	.locale-card.active {
		border-color: var(--color-accent);
		background: var(--color-explorer-item-active);
	}

	.locale-label {
		font-size: var(--text-sm);
		font-weight: var(--font-weight-medium);
	}
</style>
