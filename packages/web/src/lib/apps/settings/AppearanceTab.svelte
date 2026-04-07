<script lang="ts">
	import { themeStore, type Theme } from '$lib/os/theme-store.svelte.js';

	const themes: { id: Theme; label: string; description: string; colors: string[] }[] = [
		{
			id: 'dark',
			label: 'Dark',
			description: 'Default dark theme with purple accent',
			colors: ['#1a1a2e', '#1e1e2e', '#7c5cbf', '#e0e0ec']
		},
		{
			id: 'light',
			label: 'Light',
			description: 'Clean light theme for bright environments',
			colors: ['#e8e8f0', '#ffffff', '#6a4aaf', '#1a1a24']
		},
		{
			id: 'high-contrast',
			label: 'High Contrast',
			description: 'Maximum readability with bold borders',
			colors: ['#000000', '#0a0a0a', '#bb99ff', '#ffffff']
		}
	];
</script>

<div class="appearance">
	<h3 class="section-title">Theme</h3>
	<div class="theme-cards">
		{#each themes as theme (theme.id)}
			<button
				class="theme-card"
				class:active={themeStore.current === theme.id}
				onclick={() => themeStore.set(theme.id)}
				aria-label="Set {theme.label} theme"
			>
				<div class="preview">
					{#each theme.colors as color (color)}
						<div class="preview-swatch" style="background: {color}"></div>
					{/each}
				</div>
				<span class="theme-label">{theme.label}</span>
				<span class="theme-desc">{theme.description}</span>
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
