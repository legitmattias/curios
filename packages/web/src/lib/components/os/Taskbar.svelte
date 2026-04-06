<script lang="ts">
	import type { WindowState } from '$lib/os/types.js';
	import TaskbarEntry from './TaskbarEntry.svelte';
	import ContactCard from './ContactCard.svelte';
	import Clock from './Clock.svelte';

	let {
		windows,
		onEntryClick
	}: {
		windows: WindowState[];
		onEntryClick: (id: string) => void;
	} = $props();
</script>

<div class="taskbar">
	<div class="taskbar-entries">
		{#each windows as win (win.id)}
			<TaskbarEntry
				title={win.title}
				focused={win.focused}
				minimized={win.status === 'minimized'}
				onclick={() => onEntryClick(win.id)}
			/>
		{/each}
	</div>

	<div class="taskbar-tray">
		<ContactCard />
		<Clock />
	</div>
</div>

<style>
	.taskbar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: var(--taskbar-height);
		background: var(--color-taskbar-glass);
		backdrop-filter: var(--blur-taskbar);
		-webkit-backdrop-filter: var(--blur-taskbar);
		box-shadow: var(--shadow-taskbar);
		display: flex;
		align-items: center;
		padding: 0 var(--space-3);
		z-index: var(--z-taskbar);
		user-select: none;
	}

	.taskbar-entries {
		display: flex;
		gap: var(--space-1);
		flex: 1;
		overflow-x: auto;
		min-width: 0;
	}

	.taskbar-tray {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		flex-shrink: 0;
	}
</style>
