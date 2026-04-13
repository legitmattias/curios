<script lang="ts">
	import { themeStore } from '$lib/os/theme-store.svelte.js';
	import { t } from '$lib/os/i18n.svelte.js';
	import type { Mode } from '$lib/os/theme-store.svelte.js';

	const icons: Record<Mode, { viewBox: string; path: string }> = {
		dark: {
			viewBox: '0 0 24 24',
			path: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'
		},
		light: {
			viewBox: '0 0 24 24',
			path: 'M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.73-12.73l1.41-1.41M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z'
		}
	};

	const labelKeys: Record<Mode, string> = {
		dark: 'theme.dark',
		light: 'theme.light'
	};

	const icon = $derived(icons[themeStore.mode]);
	const label = $derived(t(labelKeys[themeStore.mode]));
</script>

<button
	class="theme-toggle"
	onclick={() => themeStore.cycleMode()}
	title={label}
	aria-label={label}
>
	<svg
		width="14"
		height="14"
		viewBox={icon.viewBox}
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d={icon.path} />
	</svg>
</button>

<style>
	.theme-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: var(--radius-button);
		background: transparent;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.theme-toggle:hover {
		background: var(--color-taskbar-entry-hover);
		color: var(--color-text-primary);
	}

	.theme-toggle:active {
		transform: scale(0.9);
	}
</style>
