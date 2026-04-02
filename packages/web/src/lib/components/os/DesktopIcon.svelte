<script lang="ts">
	import type { AppMeta } from '$lib/os/types.js';

	let {
		app,
		onopen
	}: {
		app: AppMeta;
		onopen: (appId: string) => void;
	} = $props();
</script>

<button class="desktop-icon" ondblclick={() => onopen(app.id)}>
	<span class="icon-glyph">{app.icon}</span>
	<span class="icon-label">{app.title}</span>
</button>

<style>
	.desktop-icon {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		width: 80px;
		padding: var(--space-2);
		border: 2px solid transparent;
		border-radius: var(--radius-button);
		background: transparent;
		color: var(--color-text-primary);
		cursor: pointer;
		user-select: none;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast);
		font-family: inherit;
	}

	.desktop-icon:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.desktop-icon:focus-visible {
		border-color: var(--color-focus-ring);
		outline: none;
	}

	.icon-glyph {
		font-size: 2rem;
		line-height: 1;
	}

	.icon-label {
		font-size: 0.7rem;
		text-align: center;
		word-break: break-word;
		line-height: 1.2;
	}
</style>
