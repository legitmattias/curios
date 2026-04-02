<script lang="ts">
	let {
		title,
		focused = false,
		minimized = false,
		onclick
	}: {
		title: string;
		focused?: boolean;
		minimized?: boolean;
		onclick: () => void;
	} = $props();
</script>

<button class="taskbar-entry" class:focused class:minimized {onclick} {title}>
	<span class="entry-label">{title}</span>
	{#if focused}
		<span class="focus-indicator"></span>
	{/if}
</button>

<style>
	.taskbar-entry {
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		height: 36px;
		padding: 0 var(--space-3);
		border: none;
		border-radius: var(--radius-button);
		background: var(--color-taskbar-entry);
		color: var(--color-text-primary);
		font-size: 0.8rem;
		font-family: inherit;
		cursor: pointer;
		transition: background var(--transition-fast);
		user-select: none;
		max-width: 160px;
	}

	.taskbar-entry:hover {
		background: var(--color-taskbar-entry-hover);
	}

	.taskbar-entry.focused {
		background: var(--color-taskbar-entry-active);
	}

	.taskbar-entry.minimized {
		opacity: 0.6;
	}

	.entry-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.focus-indicator {
		position: absolute;
		bottom: 2px;
		left: 50%;
		transform: translateX(-50%);
		width: 16px;
		height: 2px;
		background: var(--color-accent);
		border-radius: 1px;
	}
</style>
