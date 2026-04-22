<script lang="ts">
	import type { AppMeta } from '$lib/os/types.js';
	import { t } from '$lib/os/i18n.svelte.js';

	let {
		app,
		onopen
	}: {
		app: AppMeta;
		onopen: (appId: string) => void;
	} = $props();

	const IconComponent = $derived(app.icon);
</script>

<button class="desktop-icon" aria-label={t(app.title)} ondblclick={() => onopen(app.id)}>
	<span class="icon-glyph">
		<IconComponent size={32} />
	</span>
	<span class="icon-label">{t(app.title)}</span>
</button>

<style>
	/* Desktop icons sit on the dark accent bg regardless of Mode, so color
	   is pinned to white-alpha (not --color-text-*) to stay legible. */
	.desktop-icon {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 80px;
		padding: var(--space-2);
		border: 2px solid transparent;
		border-radius: var(--radius-button);
		background: transparent;
		color: rgba(255, 255, 255, 0.78);
		cursor: pointer;
		user-select: none;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast),
			color var(--transition-fast),
			transform var(--transition-fast);
		font-family: inherit;
	}

	.desktop-icon:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.08);
		color: #ffffff;
	}

	.desktop-icon:active {
		background: rgba(255, 255, 255, 0.08);
		transform: scale(0.96);
	}

	.desktop-icon:focus-visible {
		border-color: var(--color-focus-ring);
		outline: none;
	}

	.icon-glyph {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 36px;
	}

	.icon-label {
		font-size: var(--text-xs);
		text-align: center;
		word-break: break-word;
		line-height: 1.2;
	}
</style>
