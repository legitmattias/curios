<script lang="ts">
	import type { Component } from 'svelte';
	import type { CardId } from './mobile-store.svelte.js';

	let {
		id,
		index,
		title,
		icon: Icon,
		isActive,
		onActivate,
		onOpen
	}: {
		id: CardId;
		index: number;
		title: string;
		icon: Component<{ size?: number }>;
		isActive: boolean;
		// Tap on a non-centered tile scrolls it to center.
		onActivate: (index: number) => void;
		// Tap on the centered tile opens the app full-screen.
		onOpen: (id: CardId) => void;
	} = $props();

	function handleTap() {
		if (isActive) onOpen(id);
		else onActivate(index);
	}
</script>

<button
	class="tile"
	class:active={isActive}
	type="button"
	onclick={handleTap}
	style:view-transition-name={isActive ? `card-${id}` : undefined}
	aria-label={title}
>
	<span class="glyph"><Icon size={64} /></span>
	<span class="label">{title}</span>
</button>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 14px;
		width: 100%;
		height: 100%;
		aspect-ratio: 1 / 1;
		padding: 0;
		background: radial-gradient(
			circle at 50% 40%,
			var(--color-window-header-focused) 0%,
			var(--color-window-bg) 70%
		);
		border: 1px solid var(--color-explorer-border);
		border-radius: 22px;
		color: var(--color-text-primary);
		font: inherit;
		cursor: pointer;
		transform: scale(var(--mobile-side-scale, 0.82));
		opacity: var(--mobile-side-opacity, 0.5);
		transition:
			transform var(--mobile-ease-dur, 220ms)
				var(--mobile-ease, cubic-bezier(0.25, 0.46, 0.45, 0.94)),
			opacity var(--mobile-ease-dur, 220ms) var(--mobile-ease, cubic-bezier(0.25, 0.46, 0.45, 0.94)),
			border-color var(--transition-fast),
			box-shadow var(--mobile-ease-dur, 220ms) var(--mobile-ease, ease-out);
	}

	.tile.active {
		transform: scale(1);
		opacity: 1;
		border-color: var(--color-accent);
		/* Soft outer glow sells the "selected" state, evoking the backlit
		   highlight on early-2000s phone menus. */
		box-shadow:
			0 0 0 1px var(--color-accent),
			0 10px 30px -10px color-mix(in srgb, var(--color-accent) 40%, transparent);
	}

	.tile:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	.glyph {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 96px;
		height: 96px;
		border-radius: 50%;
		color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
	}

	.label {
		font-size: 15px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--color-text-primary);
	}
</style>
