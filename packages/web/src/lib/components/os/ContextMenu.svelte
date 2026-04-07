<script lang="ts">
	export interface MenuItem {
		label: string;
		action: () => void;
		separator?: boolean;
	}

	let {
		items,
		x,
		y,
		onclose
	}: {
		items: MenuItem[];
		x: number;
		y: number;
		onclose: () => void;
	} = $props();

	let menuEl: HTMLDivElement | undefined = $state();

	// Clamp position to viewport
	const clampedX = $derived(() => {
		if (!menuEl) return x;
		const menuWidth = menuEl.offsetWidth;
		return Math.min(x, window.innerWidth - menuWidth - 8);
	});

	const clampedY = $derived(() => {
		if (!menuEl) return y;
		const menuHeight = menuEl.offsetHeight;
		return Math.min(y, window.innerHeight - menuHeight - 8);
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	function handleWindowClick() {
		onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} onclick={handleWindowClick} />

<div
	class="context-menu"
	role="menu"
	bind:this={menuEl}
	style="left: {clampedX()}px; top: {clampedY()}px;"
>
	{#each items as item, i (i)}
		{#if item.separator}
			<div class="separator" role="separator"></div>
		{/if}
		<button
			class="menu-item"
			role="menuitem"
			onclick={(e) => {
				e.stopPropagation();
				item.action();
				onclose();
			}}
		>
			{item.label}
		</button>
	{/each}
</div>

<style>
	.context-menu {
		position: fixed;
		z-index: 10003;
		min-width: 160px;
		background: var(--color-window-bg);
		border: 1px solid var(--color-window-border);
		border-radius: var(--radius-window);
		box-shadow: var(--shadow-window-focused);
		padding: var(--space-1);
		animation: menu-in var(--duration-fast) var(--ease-out);
	}

	@keyframes menu-in {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
	}

	.menu-item {
		display: block;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: none;
		border-radius: var(--radius-button);
		background: transparent;
		color: var(--color-text-primary);
		font-family: inherit;
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.menu-item:hover {
		background: var(--color-explorer-item-hover);
	}

	.menu-item:active {
		background: var(--color-explorer-item-active);
	}

	.separator {
		height: 1px;
		background: var(--color-explorer-border);
		margin: var(--space-1) var(--space-2);
	}
</style>
