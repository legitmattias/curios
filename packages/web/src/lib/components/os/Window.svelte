<script lang="ts">
	import type { Component } from 'svelte';
	import type { WindowState } from '$lib/os/types.js';
	import ContextMenu, { type MenuItem } from './ContextMenu.svelte';
	import { t } from '$lib/os/i18n.svelte.js';

	let {
		win,
		appComponent,
		appTitle,
		onclose,
		onminimize,
		onmaximize,
		onfocus,
		onmove,
		onresize
	}: {
		win: WindowState;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		appComponent: Component<any>;
		appTitle: string;
		onclose: () => void;
		onminimize: () => void;
		onmaximize: () => void;
		onfocus: () => void;
		onmove: (x: number, y: number) => void;
		onresize: (x: number, y: number, w: number, h: number) => void;
	} = $props();

	// ── Drag state ──
	let isDragging = $state(false);
	let dragOffsetX = 0;
	let dragOffsetY = 0;

	// ── Resize state ──
	type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
	let isResizing = $state(false);
	let resizeDir: ResizeDirection = 'se';
	let resizeStartX = 0;
	let resizeStartY = 0;
	let resizeStartRect = { x: 0, y: 0, w: 0, h: 0 };

	const MIN_WIDTH = 200;
	const MIN_HEIGHT = 150;

	// ── Drag handlers ──
	function onTitlePointerDown(e: PointerEvent) {
		if (win.status === 'maximized') return;
		isDragging = true;
		dragOffsetX = e.clientX - win.x;
		dragOffsetY = e.clientY - win.y;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		onfocus();
	}

	function onTitlePointerMove(e: PointerEvent) {
		if (!isDragging) return;
		const x = e.clientX - dragOffsetX;
		const y = Math.max(0, e.clientY - dragOffsetY); // keep title bar reachable
		onmove(x, y);
	}

	function onTitlePointerUp() {
		isDragging = false;
	}

	// ── Resize handlers ──
	function onResizePointerDown(dir: ResizeDirection) {
		return (e: PointerEvent) => {
			if (win.status === 'maximized') return;
			e.stopPropagation();
			isResizing = true;
			resizeDir = dir;
			resizeStartX = e.clientX;
			resizeStartY = e.clientY;
			resizeStartRect = { x: win.x, y: win.y, w: win.width, h: win.height };
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
			onfocus();
		};
	}

	function onResizePointerMove(e: PointerEvent) {
		if (!isResizing) return;
		const dx = e.clientX - resizeStartX;
		const dy = e.clientY - resizeStartY;

		let { x, y, w, h } = resizeStartRect;

		// Apply delta based on direction
		if (resizeDir.includes('e')) w += dx;
		if (resizeDir.includes('s')) h += dy;
		if (resizeDir.includes('w')) {
			w -= dx;
			if (w >= MIN_WIDTH) x += dx;
			else w = MIN_WIDTH;
		}
		if (resizeDir.includes('n')) {
			h -= dy;
			if (h >= MIN_HEIGHT) y += dy;
			else h = MIN_HEIGHT;
		}

		w = Math.max(w, MIN_WIDTH);
		h = Math.max(h, MIN_HEIGHT);

		onresize(x, y, w, h);
	}

	function onResizePointerUp() {
		isResizing = false;
	}

	const resizeHandles: { dir: ResizeDirection; class: string }[] = [
		{ dir: 'n', class: 'handle-n' },
		{ dir: 'ne', class: 'handle-ne' },
		{ dir: 'e', class: 'handle-e' },
		{ dir: 'se', class: 'handle-se' },
		{ dir: 's', class: 'handle-s' },
		{ dir: 'sw', class: 'handle-sw' },
		{ dir: 'w', class: 'handle-w' },
		{ dir: 'nw', class: 'handle-nw' }
	];

	const AppContent = $derived(appComponent);

	let titleBarMenu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);

	function handleTitleBarContextMenu(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		titleBarMenu = {
			x: e.clientX,
			y: e.clientY,
			items: [
				{ label: t('window.ctx.minimize'), action: onminimize },
				{
					label: win.status === 'maximized' ? t('window.ctx.restore') : t('window.ctx.maximize'),
					action: onmaximize
				},
				{ label: t('window.ctx.close'), action: onclose, separator: true }
			]
		};
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="window"
	role="dialog"
	aria-label={win.title}
	tabindex="-1"
	class:focused={win.focused}
	class:maximized={win.status === 'maximized'}
	class:minimized={win.status === 'minimized'}
	class:dragging={isDragging}
	class:resizing={isResizing}
	style="left: {win.x}px; top: {win.y}px; width: {win.width}px; height: {win.height}px; z-index: {win.zIndex};"
	onpointerdown={onfocus}
>
	<!-- Title bar -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="title-bar"
		onpointerdown={onTitlePointerDown}
		onpointermove={onTitlePointerMove}
		oncontextmenu={handleTitleBarContextMenu}
		onpointerup={onTitlePointerUp}
	>
		<span class="title-text">{win.title}</span>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="window-controls" onpointerdown={(e) => e.stopPropagation()}>
			<button
				class="control-btn minimize"
				onclick={(e) => {
					e.stopPropagation();
					onminimize();
				}}
				title={t('shell.minimize')}
			>
				<svg viewBox="0 0 12 12" width="12" height="12">
					<rect x="2" y="5" width="8" height="2" rx="0.5" fill="currentColor" />
				</svg>
			</button>
			<button
				class="control-btn maximize"
				onclick={(e) => {
					e.stopPropagation();
					onmaximize();
				}}
				title={win.status === 'maximized' ? t('shell.restore') : t('shell.maximize')}
			>
				<svg viewBox="0 0 12 12" width="12" height="12">
					{#if win.status === 'maximized'}
						<rect
							x="3"
							y="1"
							width="8"
							height="8"
							rx="1"
							fill="none"
							stroke="currentColor"
							stroke-width="1"
						/>
						<rect
							x="1"
							y="3"
							width="8"
							height="8"
							rx="1"
							fill="var(--color-window-header-focused)"
							stroke="currentColor"
							stroke-width="1"
						/>
					{:else}
						<rect
							x="1.5"
							y="1.5"
							width="9"
							height="9"
							rx="1"
							fill="none"
							stroke="currentColor"
							stroke-width="1"
						/>
					{/if}
				</svg>
			</button>
			<button
				class="control-btn close"
				onclick={(e) => {
					e.stopPropagation();
					onclose();
				}}
				title={t('shell.close')}
			>
				<svg viewBox="0 0 12 12" width="12" height="12">
					<path
						d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5"
						stroke="currentColor"
						stroke-width="1.2"
						stroke-linecap="round"
					/>
				</svg>
			</button>
		</div>
	</div>

	<!-- App content -->
	<div class="window-content">
		<AppContent title={appTitle} />
	</div>

	<!-- Resize handles -->
	{#if win.status !== 'maximized'}
		{#each resizeHandles as handle (handle.dir)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="resize-handle {handle.class}"
				onpointerdown={onResizePointerDown(handle.dir)}
				onpointermove={onResizePointerMove}
				onpointerup={onResizePointerUp}
			></div>
		{/each}
	{/if}

	{#if titleBarMenu}
		<ContextMenu
			items={titleBarMenu.items}
			x={titleBarMenu.x}
			y={titleBarMenu.y}
			onclose={() => (titleBarMenu = null)}
		/>
	{/if}
</div>

<style>
	.window {
		position: absolute;
		display: flex;
		flex-direction: column;
		background: var(--color-window-bg);
		border: 1px solid var(--color-window-border);
		border-top-color: var(--color-window-highlight);
		border-radius: var(--radius-window);
		box-shadow: var(--shadow-window);
		overflow: hidden;
		min-width: 200px;
		min-height: 150px;
		transform-origin: center bottom;
		transition:
			left var(--duration-normal) var(--ease-out),
			top var(--duration-normal) var(--ease-out),
			width var(--duration-normal) var(--ease-out),
			height var(--duration-normal) var(--ease-out),
			border-radius var(--duration-normal) var(--ease-out),
			box-shadow var(--duration-fast) var(--ease-out),
			border-color var(--duration-fast) var(--ease-out);
	}

	.window.minimized {
		pointer-events: none;
		opacity: 0;
		transform: scale(0.85) translateY(12px);
		transition:
			opacity var(--duration-normal) var(--ease-out),
			transform var(--duration-normal) var(--ease-out);
	}

	.window.focused {
		border-color: var(--color-window-border-focused);
		border-top-color: var(--color-window-highlight-focused);
		box-shadow: var(--shadow-window-focused);
	}

	.window.maximized {
		border-radius: 0;
	}

	/* Suppress position/size transitions during drag and resize */
	.window.dragging,
	.window.resizing {
		transition:
			box-shadow var(--duration-fast) var(--ease-out),
			border-color var(--duration-fast) var(--ease-out);
		user-select: none;
	}

	/* ── Title bar ── */
	.title-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 36px;
		padding: 0 var(--space-2) 0 var(--space-3);
		background: var(--color-window-header);
		cursor: grab;
		user-select: none;
		flex-shrink: 0;
	}

	.window.focused .title-bar {
		background: var(--color-window-header-focused);
	}

	.window.dragging .title-bar {
		cursor: grabbing;
	}

	.title-text {
		font-size: var(--text-base);
		font-weight: var(--font-weight-medium);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	/* ── Window controls ── */
	.window-controls {
		display: flex;
		gap: var(--space-1);
		align-items: center;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast),
			transform var(--transition-fast);
		padding: 0;
	}

	.control-btn:hover {
		color: var(--color-text-primary);
	}

	.control-btn:active {
		transform: scale(0.88);
	}

	.control-btn.close:hover {
		background: var(--color-control-close);
		color: white;
	}

	.control-btn.minimize:hover {
		background: var(--color-control-minimize);
		color: var(--color-desktop-bg);
	}

	.control-btn.maximize:hover {
		background: var(--color-control-maximize);
		color: var(--color-desktop-bg);
	}

	/* ── Content area ── */
	.window-content {
		flex: 1;
		overflow: auto;
		min-height: 0;
	}

	/* ── Resize handles ── */
	.resize-handle {
		position: absolute;
	}

	/* Edge handles */
	.handle-n {
		top: -3px;
		left: 8px;
		right: 8px;
		height: 6px;
		cursor: n-resize;
	}
	.handle-s {
		bottom: -3px;
		left: 8px;
		right: 8px;
		height: 6px;
		cursor: s-resize;
	}
	.handle-e {
		right: -3px;
		top: 8px;
		bottom: 8px;
		width: 6px;
		cursor: e-resize;
	}
	.handle-w {
		left: -3px;
		top: 8px;
		bottom: 8px;
		width: 6px;
		cursor: w-resize;
	}

	/* Corner handles */
	.handle-ne {
		top: -3px;
		right: -3px;
		width: 12px;
		height: 12px;
		cursor: ne-resize;
	}
	.handle-se {
		bottom: -3px;
		right: -3px;
		width: 12px;
		height: 12px;
		cursor: se-resize;
	}
	.handle-sw {
		bottom: -3px;
		left: -3px;
		width: 12px;
		height: 12px;
		cursor: sw-resize;
	}
	.handle-nw {
		top: -3px;
		left: -3px;
		width: 12px;
		height: 12px;
		cursor: nw-resize;
	}
</style>
