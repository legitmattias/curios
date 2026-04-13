<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';
	import { themeStore, type Mode, type Accent } from '$lib/os/theme-store.svelte.js';

	const modes: { id: Mode; labelKey: string; descKey: string; colors: string[] }[] = [
		{
			id: 'dark',
			labelKey: 'settings.mode.dark',
			descKey: 'settings.mode.darkDesc',
			colors: ['#141820', '#181e26', '#dce0e8']
		},
		{
			id: 'light',
			labelKey: 'settings.mode.light',
			descKey: 'settings.mode.lightDesc',
			colors: ['#e8e8f0', '#ffffff', '#1a1a24']
		}
	];

	const accents: { id: Accent; labelKey: string; descKey: string; color: string }[] = [
		{
			id: 'teal',
			labelKey: 'settings.accent.teal',
			descKey: 'settings.accent.tealDesc',
			color: '#20b2aa'
		},
		{
			id: 'purple',
			labelKey: 'settings.accent.purple',
			descKey: 'settings.accent.purpleDesc',
			color: '#7c5cbf'
		},
		{
			id: 'amber',
			labelKey: 'settings.accent.amber',
			descKey: 'settings.accent.amberDesc',
			color: '#d4883a'
		},
		{
			id: 'slate',
			labelKey: 'settings.accent.slate',
			descKey: 'settings.accent.slateDesc',
			color: '#4a9fd4'
		}
	];
</script>

<div class="appearance">
	<h3 class="section-title">{t('settings.mode')}</h3>
	<div class="theme-cards">
		{#each modes as mode (mode.id)}
			<button
				class="theme-card"
				class:active={themeStore.mode === mode.id}
				onclick={() => themeStore.setMode(mode.id)}
				aria-label={t(mode.labelKey)}
			>
				<div class="preview">
					{#each mode.colors as color (color)}
						<div class="preview-swatch" style="background: {color}"></div>
					{/each}
				</div>
				<span class="theme-label">{t(mode.labelKey)}</span>
				<span class="theme-desc">{t(mode.descKey)}</span>
			</button>
		{/each}
	</div>

	<button
		class="hc-toggle"
		class:active={themeStore.highContrast}
		onclick={() => themeStore.toggleHighContrast()}
	>
		<span class="hc-check">{themeStore.highContrast ? '✓' : ''}</span>
		<span class="hc-text">
			<span class="theme-label">{t('settings.mode.highContrast')}</span>
			<span class="theme-desc">{t('settings.mode.highContrastDesc')}</span>
		</span>
	</button>

	<h3 class="section-title accent-title">{t('settings.accent')}</h3>
	<div class="accent-cards">
		{#each accents as accent (accent.id)}
			<button
				class="accent-card"
				class:active={themeStore.accent === accent.id}
				onclick={() => themeStore.setAccent(accent.id)}
				aria-label={t(accent.labelKey)}
			>
				<div class="accent-swatch" style="background: {accent.color}"></div>
				<span class="accent-label">{t(accent.labelKey)}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.appearance {
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

	.hc-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		margin-top: var(--space-3);
		border: 1px solid var(--color-explorer-border);
		border-radius: var(--radius-button);
		background: transparent;
		color: var(--color-text-primary);
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		transition:
			border-color var(--transition-fast),
			background var(--transition-fast);
	}

	.hc-toggle:hover {
		background: var(--color-explorer-item-hover);
	}

	.hc-toggle.active {
		border-color: var(--color-accent);
	}

	.hc-check {
		width: 1.2em;
		text-align: center;
		flex-shrink: 0;
		font-size: var(--text-base);
		color: var(--color-accent);
	}

	.hc-text {
		display: flex;
		gap: var(--space-3);
		align-items: center;
	}

	.accent-title {
		margin-top: var(--space-5);
	}

	.theme-cards {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.theme-card {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		border: 2px solid var(--color-explorer-border);
		border-radius: var(--radius-window);
		background: transparent;
		color: var(--color-text-primary);
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		transition:
			border-color var(--transition-fast),
			background var(--transition-fast);
	}

	.theme-card:hover {
		background: var(--color-explorer-item-hover);
	}

	.theme-card.active {
		border-color: var(--color-accent);
		background: var(--color-explorer-item-active);
	}

	.preview {
		display: flex;
		gap: 2px;
		flex-shrink: 0;
	}

	.preview-swatch {
		width: 16px;
		height: 32px;
		border-radius: 3px;
	}

	.preview-swatch:first-child {
		border-radius: 3px 0 0 3px;
	}

	.preview-swatch:last-child {
		border-radius: 0 3px 3px 0;
	}

	.theme-label {
		font-size: var(--text-base);
		font-weight: var(--font-weight-medium);
		min-width: 100px;
	}

	.theme-desc {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}

	.accent-cards {
		display: flex;
		gap: var(--space-3);
	}

	.accent-card {
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

	.accent-card:hover {
		background: var(--color-explorer-item-hover);
	}

	.accent-card.active {
		border-color: var(--color-accent);
		background: var(--color-explorer-item-active);
	}

	.accent-swatch {
		width: 32px;
		height: 32px;
		border-radius: 50%;
	}

	.accent-label {
		font-size: var(--text-sm);
		font-weight: var(--font-weight-medium);
	}
</style>
