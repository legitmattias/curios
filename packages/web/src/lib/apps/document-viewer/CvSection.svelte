<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		children
	}: {
		title: string;
		children: Snippet;
	} = $props();
</script>

<section class="cv-section">
	<h2 class="section-title">{title}</h2>
	<div class="section-content">
		{@render children()}
	</div>
</section>

<style>
	.cv-section {
		margin-bottom: var(--space-5);
	}

	.section-title {
		font-size: var(--text-xs);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-accent);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--color-explorer-border);
		margin-bottom: var(--space-3);
	}

	.section-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
</style>
