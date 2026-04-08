<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';
</script>

<span class="translation-badge" title={t('translation.tooltip')}>
	<svg
		width="10"
		height="10"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
		<path d="M2 12h20" />
		<path
			d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
		/>
	</svg>
</span>

<style>
	.translation-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		color: var(--color-text-muted);
		opacity: 0.6;
		cursor: help;
		vertical-align: middle;
		transition: opacity var(--transition-fast);
	}

	.translation-badge:hover {
		opacity: 1;
		color: var(--color-accent);
	}
</style>
