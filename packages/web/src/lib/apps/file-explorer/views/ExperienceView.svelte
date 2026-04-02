<script lang="ts">
	import type { Experience } from '@curios/shared/types';
	import { fetchExperience } from '../api.js';

	let {
		onapimeta
	}: {
		onapimeta: (url: string, response: unknown) => void;
	} = $props();

	let entries = $state<Experience[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	function formatDate(date: string | null): string {
		if (!date) return 'Present';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
	}

	$effect(() => {
		fetchExperience()
			.then((result) => {
				entries = result.data;
				onapimeta(result.url, result.raw);
			})
			.catch((err) => {
				error = err.message;
			})
			.finally(() => {
				loading = false;
			});
	});
</script>

<div class="view">
	{#if loading}
		<p class="status">Loading experience...</p>
	{:else if error}
		<p class="status error">{error}</p>
	{:else}
		<div class="timeline">
			{#each entries as entry (entry.id)}
				<div class="entry">
					<div class="entry-header">
						<h3 class="role">{entry.role}</h3>
						<span class="dates">{formatDate(entry.startDate)} — {formatDate(entry.endDate)}</span>
					</div>
					<p class="company">{entry.company}</p>
					<p class="description">{entry.description}</p>
					<div class="tags">
						{#each entry.tech as tech (tech)}
							<span class="tag">{tech}</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.view {
		padding: var(--space-4);
		height: 100%;
		overflow: auto;
	}

	.status {
		color: var(--color-text-secondary);
		font-size: 0.85rem;
	}

	.status.error {
		color: var(--color-control-close);
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.entry {
		border-left: 2px solid var(--color-accent);
		padding-left: var(--space-4);
	}

	.entry-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.role {
		font-size: 1rem;
		font-weight: 600;
	}

	.dates {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		flex-shrink: 0;
	}

	.company {
		font-size: 0.85rem;
		color: var(--color-accent);
		margin: var(--space-1) 0 var(--space-2);
	}

	.description {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin-bottom: var(--space-2);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.tag {
		padding: 2px var(--space-2);
		border-radius: var(--radius-button);
		background: var(--color-explorer-item-hover);
		color: var(--color-text-primary);
		font-size: 0.7rem;
		font-family: var(--font-mono);
	}
</style>
