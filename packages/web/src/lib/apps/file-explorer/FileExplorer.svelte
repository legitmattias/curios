<script lang="ts">
	import { FILESYSTEM, findNode, type VirtualNode } from './filesystem.js';
	import { fetchProjects } from './api.js';
	import FolderTree from './FolderTree.svelte';
	import Breadcrumb from './Breadcrumb.svelte';
	import ContentPanel from './ContentPanel.svelte';

	let currentPath = $state('/projects');
	let tree = $state<VirtualNode>(structuredClone(FILESYSTEM));

	const currentNode = $derived(resolveNode(currentPath));

	function resolveNode(path: string): VirtualNode | null {
		// Handle dynamic project detail paths
		const projectMatch = path.match(/^\/projects\/(.+)$/);
		if (projectMatch) {
			return {
				name: projectMatch[1],
				path,
				icon: '📋',
				view: 'project-detail',
				param: projectMatch[1]
			};
		}
		return findNode(tree, path);
	}

	function navigate(path: string) {
		currentPath = path;
	}

	// Populate the projects folder with children from the API
	$effect(() => {
		fetchProjects().then((result) => {
			const projectsNode = findNode(tree, '/projects');
			if (projectsNode) {
				projectsNode.children = result.data.map((p) => ({
					name: p.slug,
					path: `/projects/${p.slug}`,
					icon: '📋',
					view: 'project-detail' as const,
					param: p.slug
				}));
			}
		});
	});
</script>

<div class="file-explorer">
	<Breadcrumb path={currentPath} onnavigate={navigate} />
	<div class="panels">
		<aside class="sidebar">
			<FolderTree nodes={tree.children ?? []} {currentPath} onnavigate={navigate} />
		</aside>
		<main class="main">
			<ContentPanel node={currentNode} onnavigate={navigate} />
		</main>
	</div>
</div>

<style>
	.file-explorer {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.panels {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.sidebar {
		width: 180px;
		flex-shrink: 0;
		border-right: 1px solid var(--color-explorer-border);
		padding: var(--space-2);
		overflow-y: auto;
	}

	.main {
		flex: 1;
		min-width: 0;
	}
</style>
