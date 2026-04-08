<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';
	import type { VirtualNode } from './filesystem.js';
	import ApiInspector from './ApiInspector.svelte';
	import ProjectListView from './views/ProjectListView.svelte';
	import ProjectDetailView from './views/ProjectDetailView.svelte';
	import SkillsView from './views/SkillsView.svelte';
	import ExperienceView from './views/ExperienceView.svelte';
	import AboutView from './views/AboutView.svelte';
	import ContactView from './views/ContactView.svelte';

	let {
		node,
		onnavigate
	}: {
		node: VirtualNode | null;
		onnavigate: (path: string) => void;
	} = $props();

	let inspectorVisible = $state(false);
	let apiUrl = $state('');
	let apiResponse = $state<unknown>(null);

	function handleApiMeta(url: string, response: unknown) {
		apiUrl = url;
		apiResponse = response;
	}
</script>

<div class="content-panel">
	<div class="toolbar">
		<span class="path">{node?.path ?? '/'}</span>
		{#if apiUrl}
			<ApiInspector
				url={apiUrl}
				response={apiResponse}
				visible={inspectorVisible}
				ontoggle={() => (inspectorVisible = !inspectorVisible)}
			/>
		{/if}
	</div>

	<div class="content-area">
		{#if !node || node.view === 'root'}
			<div class="root-view">
				<p class="hint">{t('explorer.selectFolder')}</p>
			</div>
		{:else if node.view === 'project-list'}
			<ProjectListView {onnavigate} onapimeta={handleApiMeta} />
		{:else if node.view === 'project-detail' && node.param}
			<ProjectDetailView slug={node.param} onapimeta={handleApiMeta} />
		{:else if node.view === 'skills'}
			<SkillsView onapimeta={handleApiMeta} />
		{:else if node.view === 'experience'}
			<ExperienceView onapimeta={handleApiMeta} />
		{:else if node.view === 'about'}
			<AboutView onapimeta={handleApiMeta} />
		{:else if node.view === 'contact'}
			<ContactView onapimeta={handleApiMeta} />
		{/if}
	</div>
</div>

<style>
	.content-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
		overflow: hidden;
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-1) var(--space-3);
		border-bottom: 1px solid var(--color-explorer-border);
		flex-shrink: 0;
		min-height: 32px;
	}

	.path {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	.content-area {
		flex: 1;
		overflow: auto;
		min-height: 0;
	}

	.root-view {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	.hint {
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}
</style>
