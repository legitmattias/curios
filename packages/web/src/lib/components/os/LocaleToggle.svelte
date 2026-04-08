<script lang="ts">
	import { localeStore } from '$lib/os/locale-store.svelte.js';
</script>

<button
	class="locale-toggle"
	onclick={() => localeStore.toggle()}
	title={localeStore.current === 'en' ? 'Byt till svenska' : 'Switch to English'}
	aria-label={localeStore.current === 'en' ? 'Byt till svenska' : 'Switch to English'}
>
	{localeStore.current.toUpperCase()}
</button>

<style>
	.locale-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 28px;
		padding: 0 var(--space-2);
		border: none;
		border-radius: var(--radius-button);
		background: transparent;
		color: var(--color-text-secondary);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: var(--font-weight-semibold);
		letter-spacing: 0.05em;
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.locale-toggle:hover {
		background: var(--color-taskbar-entry-hover);
		color: var(--color-text-primary);
	}

	.locale-toggle:active {
		transform: scale(0.9);
	}
</style>
