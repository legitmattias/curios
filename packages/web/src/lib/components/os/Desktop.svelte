<script lang="ts">
	import { windowManager } from '$lib/os/window-manager.svelte.js';
	import { getAllApps, getApp } from '$lib/os/app-registry.js';
	import DesktopIcon from './DesktopIcon.svelte';
	import Taskbar from './Taskbar.svelte';
	import Window from './Window.svelte';

	const apps = getAllApps();

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
</script>

<div class="desktop">
	<div class="icon-grid">
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
</style>
