<script lang="ts">
	let { title = 'App' }: { title?: string } = $props();
</script>

<div class="placeholder-app">
	<p>{title}</p>
	<span class="hint">This app is under construction.</span>
</div>

<style>
	.placeholder-app {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: var(--space-2);
		color: var(--color-text-secondary);
		user-select: none;
	}

	.placeholder-app p {
		font-size: 1.25rem;
		color: var(--color-text-primary);
	}

	.hint {
		font-size: 0.8rem;
		opacity: 0.6;
	}
</style>
