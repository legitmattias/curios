<script lang="ts">
	import type { VirtualNode } from './filesystem.js';
	import FolderTree from './FolderTree.svelte';
	import { t } from '$lib/os/i18n.svelte.js';

	let {
		nodes,
		currentPath,
		onnavigate,
		depth = 0
	}: {
		nodes: VirtualNode[];
		currentPath: string;
		onnavigate: (path: string) => void;
		depth?: number;
	} = $props();
</script>

<ul
	class="tree"
	role={depth === 0 ? 'tree' : 'group'}
	aria-label={depth === 0 ? 'Folders' : undefined}
	style="--depth: {depth}"
>
	{#each nodes as node (node.path)}
		<li>
			<button
				class="tree-item"
				class:active={currentPath === node.path}
				onclick={() => onnavigate(node.path)}
			>
				<span class="icon">{node.icon}</span>
				<span class="label"
					>{t(`explorer.${node.name}`) !== `explorer.${node.name}`
						? t(`explorer.${node.name}`)
						: node.name}</span
				>
			</button>
			{#if node.children && node.children.length > 0}
				<FolderTree nodes={node.children} {currentPath} {onnavigate} depth={depth + 1} />
			{/if}
		</li>
	{/each}
</ul>

<style>
	.tree {
		list-style: none;
		padding-left: calc(var(--depth) * var(--space-3));
	}

	li {
		display: flex;
		flex-direction: column;
	}

	.tree-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-1) var(--space-2);
		border: none;
		border-radius: var(--radius-button);
		background: none;
		color: var(--color-text-secondary);
		font-family: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		text-align: left;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
		white-space: nowrap;
	}

	.tree-item:hover {
		background: var(--color-explorer-item-hover);
		color: var(--color-text-primary);
	}

	.tree-item.active {
		background: var(--color-explorer-item-active);
		color: var(--color-text-primary);
	}

	.icon {
		font-size: 0.9rem;
		flex-shrink: 0;
	}

	.label {
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
