<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		side = 'top',
		children
	}: {
		label: string;
		side?: 'top' | 'right' | 'bottom' | 'left';
		children: Snippet;
	} = $props();

	let visible = $state(false);
	let anchor: HTMLSpanElement | undefined = $state();
	let bubbleStyle = $state('');

	// Positioning: anchor measured on show; we place the bubble relative to it.
	// Using position:fixed ensures the tooltip isn't clipped by overflow:hidden ancestors.
	function show() {
		visible = true;
		requestAnimationFrame(() => {
			if (!anchor) return;
			const r = anchor.getBoundingClientRect();
			const GAP = 6;
			switch (side) {
				case 'top':
					bubbleStyle = `left: ${r.left + r.width / 2}px; top: ${r.top - GAP}px; transform: translate(-50%, -100%);`;
					break;
				case 'bottom':
					bubbleStyle = `left: ${r.left + r.width / 2}px; top: ${r.bottom + GAP}px; transform: translate(-50%, 0);`;
					break;
				case 'right':
					bubbleStyle = `left: ${r.right + GAP}px; top: ${r.top + r.height / 2}px; transform: translate(0, -50%);`;
					break;
				case 'left':
					bubbleStyle = `left: ${r.left - GAP}px; top: ${r.top + r.height / 2}px; transform: translate(-100%, -50%);`;
					break;
			}
		});
	}

	function hide() {
		visible = false;
	}
</script>

<span
	bind:this={anchor}
	class="anchor"
	role="presentation"
	onmouseenter={show}
	onmouseleave={hide}
	onfocusin={show}
	onfocusout={hide}
>
	{@render children()}
</span>

{#if visible}
	<span class="bubble" style={bubbleStyle} role="tooltip">{label}</span>
{/if}

<style>
	.anchor {
		display: inline-flex;
		align-items: center;
	}

	.bubble {
		position: fixed;
		z-index: 10050;
		padding: 4px 8px;
		font-size: 11px;
		font-weight: 500;
		line-height: 1.3;
		color: var(--color-text-primary);
		background: var(--color-window-bg);
		border: 1px solid var(--color-explorer-border);
		border-radius: 3px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
		pointer-events: none;
		max-width: 260px;
		white-space: normal;
	}
</style>
