<script lang="ts">
	let visible = $state(false);

	function toggle() {
		visible = !visible;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') visible = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="contact-wrapper">
	<button class="contact-trigger" onclick={toggle} title="Contact info">
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
			<polyline points="22,6 12,13 2,6" />
		</svg>
	</button>

	{#if visible}
		<button class="card-backdrop" onclick={toggle} aria-label="Close contact card"></button>
		<div class="card">
			<div class="card-header">
				<span class="card-name">Mattias Ubbesen</span>
				<span class="card-title">Full Stack Developer</span>
			</div>
			<div class="card-links">
				<a href="mailto:hello@mattic.dev" class="card-link">
					<span class="link-label">Email</span>
					<span class="link-value">hello@mattic.dev</span>
				</a>
				<a
					href="https://github.com/legitmattias"
					target="_blank"
					rel="noopener external"
					class="card-link"
				>
					<span class="link-label">GitHub</span>
					<span class="link-value">legitmattias</span>
				</a>
				<a
					href="https://linkedin.com/in/placeholder"
					target="_blank"
					rel="noopener external"
					class="card-link"
				>
					<span class="link-label">LinkedIn</span>
					<span class="link-value">Mattias Ubbesen</span>
				</a>
			</div>
		</div>
	{/if}
</div>

<style>
	.contact-wrapper {
		position: relative;
	}

	.contact-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: var(--radius-button);
		background: transparent;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.contact-trigger:hover {
		background: var(--color-taskbar-entry-hover);
		color: var(--color-text-primary);
	}

	.card-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1;
		border: none;
		background: transparent;
		cursor: default;
		padding: 0;
	}

	.card {
		position: absolute;
		bottom: calc(100% + var(--space-2));
		right: 0;
		width: 260px;
		background: var(--color-window-bg);
		border: 1px solid var(--color-window-border);
		border-radius: var(--radius-window);
		box-shadow: var(--shadow-window-focused);
		padding: var(--space-4);
		z-index: 2;
		animation: card-in var(--duration-fast) var(--ease-out);
	}

	@keyframes card-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
	}

	.card-header {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-bottom: var(--space-3);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.card-name {
		font-size: var(--text-base);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.card-title {
		font-size: var(--text-xs);
		color: var(--color-accent);
	}

	.card-links {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.card-link {
		display: flex;
		flex-direction: column;
		gap: 1px;
		text-decoration: none;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-button);
		transition: background var(--transition-fast);
	}

	.card-link:hover {
		background: var(--color-explorer-item-hover);
	}

	.link-label {
		font-size: 0.6rem;
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.link-value {
		font-size: var(--text-sm);
		color: var(--color-text-primary);
	}
</style>
