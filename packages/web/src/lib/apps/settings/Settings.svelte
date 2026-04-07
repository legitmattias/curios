<script lang="ts">
	import AppearanceTab from './AppearanceTab.svelte';
	import SystemInfoTab from './SystemInfoTab.svelte';

	type Tab = 'appearance' | 'system';
	let activeTab = $state<Tab>('appearance');

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'appearance', label: 'Appearance' },
		{ id: 'system', label: 'System Info' }
	];
</script>

<div class="settings">
	<nav class="sidebar" aria-label="Settings sections">
		{#each tabs as tab (tab.id)}
			<button
				class="tab-btn"
				class:active={activeTab === tab.id}
				onclick={() => (activeTab = tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</nav>

	<main class="content">
		{#if activeTab === 'appearance'}
			<AppearanceTab />
		{:else if activeTab === 'system'}
			<SystemInfoTab />
		{/if}
	</main>
</div>

<style>
	.settings {
		display: flex;
		height: 100%;
		overflow: hidden;
	}

	.sidebar {
		width: 140px;
		flex-shrink: 0;
		border-right: 1px solid var(--color-explorer-border);
		padding: var(--space-2);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.tab-btn {
		padding: var(--space-2) var(--space-3);
		border: none;
		border-radius: var(--radius-button);
		background: transparent;
		color: var(--color-text-secondary);
		font-family: inherit;
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.tab-btn:hover {
		background: var(--color-explorer-item-hover);
		color: var(--color-text-primary);
	}

	.tab-btn.active {
		background: var(--color-explorer-item-active);
		color: var(--color-text-primary);
	}

	.content {
		flex: 1;
		overflow-y: auto;
		min-width: 0;
	}
</style>
