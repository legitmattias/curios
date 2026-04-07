<script lang="ts">
	import { windowManager } from '$lib/os/window-manager.svelte.js';
	import { themeStore } from '$lib/os/theme-store.svelte.js';
	import { getAllApps, getApp } from '$lib/os/app-registry.js';
	import DesktopIcon from './DesktopIcon.svelte';
	import Taskbar from './Taskbar.svelte';
	import Window from './Window.svelte';
	import ContextMenu, { type MenuItem } from './ContextMenu.svelte';

	const apps = getAllApps();

	let contextMenu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);

	function handleOpenApp(appId: string) {
		const app = getApp(appId);
		if (app) windowManager.open(app);
	}

	function handleTaskbarClick(id: string) {
		windowManager.handleTaskbarClick(id);
	}

	function getViewportHeight(): number {
		return window.innerHeight - 48;
	}

	function handleDesktopContextMenu(e: MouseEvent) {
		e.preventDefault();
		contextMenu = {
			x: e.clientX,
			y: e.clientY,
			items: [
				{ label: 'Dark theme', action: () => themeStore.set('dark') },
				{ label: 'Light theme', action: () => themeStore.set('light') },
				{ label: 'High contrast', action: () => themeStore.set('high-contrast'), separator: true },
				{ label: 'Open Terminal', action: () => handleOpenApp('terminal') },
				{ label: 'Open Settings', action: () => handleOpenApp('settings') }
			]
		};
	}
</script>

<div class="desktop" role="application" aria-label="CuriOS Desktop" oncontextmenu={handleDesktopContextMenu}>
	<div class="icon-grid" role="group" aria-label="Applications">
		{#each apps as app (app.id)}
			<DesktopIcon {app} onopen={handleOpenApp} />
		{/each}
	</div>

	{#each windowManager.windows as win (win.id)}
		{@const app = getApp(win.appId)}
		{#if app}
			<Window
				{win}
				appComponent={app.component}
				appTitle={app.title}
				onclose={() => windowManager.close(win.id)}
				onminimize={() => windowManager.minimize(win.id)}
				onmaximize={() => windowManager.maximize(win.id, window.innerWidth, getViewportHeight())}
				onfocus={() => windowManager.focus(win.id)}
				onmove={(x, y) => windowManager.move(win.id, x, y)}
				onresize={(x, y, w, h) => windowManager.setRect(win.id, x, y, w, h)}
			/>
		{/if}
	{/each}

	<div class="watermark-logo">CuriOS</div>

	<div class="watermark">
		<span class="watermark-name">Mattias Ubbesen</span>
		<span class="watermark-title">Full Stack Developer</span>
		<span class="watermark-domain">mattic.dev</span>
	</div>

	{#if contextMenu}
		<ContextMenu
			items={contextMenu.items}
			x={contextMenu.x}
			y={contextMenu.y}
			onclose={() => (contextMenu = null)}
		/>
	{/if}

	<Taskbar windows={windowManager.windows} onEntryClick={handleTaskbarClick} />
</div>

<style>
	.desktop {
		position: fixed;
		inset: 0;
		background: var(--gradient-desktop, var(--color-desktop-bg));
		overflow: hidden;
	}

	.icon-grid {
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		align-content: flex-start;
		gap: var(--space-2);
		padding: var(--space-4);
		height: calc(100% - var(--taskbar-height));
	}

	.watermark-logo {
		position: absolute;
		top: var(--space-5);
		right: var(--space-6);
		font-size: 2.5rem;
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		opacity: var(--opacity-watermark-logo);
		pointer-events: none;
		user-select: none;
		letter-spacing: 0.05em;
	}

	.watermark {
		position: absolute;
		bottom: calc(var(--taskbar-height) + var(--space-4));
		right: var(--space-5);
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
		pointer-events: none;
		user-select: none;
		opacity: var(--opacity-watermark);
	}

	.watermark-name {
		font-size: 1rem;
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
		letter-spacing: 0.03em;
	}

	.watermark-title {
		font-size: var(--text-xs);
		color: var(--color-text-primary);
	}

	.watermark-domain {
		font-size: var(--text-xs);
		font-family: var(--font-mono);
		color: var(--color-text-primary);
	}
</style>
