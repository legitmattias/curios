<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';
	import { themeStore, type Theme } from '$lib/os/theme-store.svelte.js';

	const themes: { id: Theme; labelKey: string; descKey: string; colors: string[] }[] = [
		{
			id: 'dark',
			labelKey: 'settings.theme.dark',
			descKey: 'settings.theme.darkDesc',
			colors: ['#141a20', '#1a2028', '#2a9d8f', '#dce4e8']
		},
		{
			id: 'purple',
			labelKey: 'settings.theme.purple',
			descKey: 'settings.theme.purpleDesc',
			colors: ['#1a1a2e', '#1e1e2e', '#7c5cbf', '#e0e0ec']
		},
		{
			id: 'amber',
			labelKey: 'settings.theme.amber',
			descKey: 'settings.theme.amberDesc',
			colors: ['#1a1610', '#201c16', '#d4883a', '#e8e0d4']
		},
		{
			id: 'slate',
			labelKey: 'settings.theme.slate',
			descKey: 'settings.theme.slateDesc',
			colors: ['#161a1e', '#1c2024', '#5488a8', '#d8dce0']
		},
		{
			id: 'light',
			labelKey: 'settings.theme.light',
			descKey: 'settings.theme.lightDesc',
			colors: ['#e8e8f0', '#ffffff', '#1f8a7e', '#1a1a24']
		},
		{
			id: 'high-contrast',
			labelKey: 'settings.theme.highContrast',
			descKey: 'settings.theme.highContrastDesc',
			colors: ['#000000', '#0a0a0a', '#bb99ff', '#ffffff']
		}
	];
</script>

<div class="appearance">
	<h3 class="section-title">{t('settings.theme')}</h3>
	<div class="theme-cards">
		{#each themes as theme (theme.id)}
			<button
				class="theme-card"
				class:active={themeStore.current === theme.id}
				onclick={() => themeStore.set(theme.id)}
				aria-label="Set {t(theme.labelKey)} theme"
			>
				<div class="preview">
					{#each theme.colors as color (color)}
						<div class="preview-swatch" style="background: {color}"></div>
					{/each}
				</div>
				<span class="theme-label">{t(theme.labelKey)}</span>
				<span class="theme-desc">{t(theme.descKey)}</span>
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
</style>
