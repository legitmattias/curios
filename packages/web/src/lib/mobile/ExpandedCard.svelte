<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { mobileStore, type CardId } from './mobile-store.svelte.js';

	let {
		id,
		title,
		icon: Icon,
		// Drops the body padding + internal scroll so the content can manage
		// its own layout (used by the chat which needs to fill the full body).
		fullBleed = false,
		children
	}: {
		id: CardId;
		title: string;
		icon: Component<{ size?: number }>;
		fullBleed?: boolean;
		children: Snippet;
	} = $props();

	onMount(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') mobileStore.collapse();
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	});
</script>

<div
	class="expanded"
	role="dialog"
	aria-modal="true"
	aria-label={title}
	style:view-transition-name="card-{id}"
>
	<header class="bar">
		<button
			class="back"
			type="button"
			onclick={() => mobileStore.collapse()}
			aria-label="Back to cards"
		>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</button>

		<span class="title">
			<span class="icon"><Icon size={18} /></span>
			{title}
		</span>

		<span class="spacer"></span>
	</header>

	<div class="body" class:full-bleed={fullBleed}>
		{@render children()}
	</div>
</div>

<style>
	.expanded {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		grid-template-rows: auto 1fr;
		background: var(--color-window-bg);
		color: var(--color-text-primary);
		height: 100svh;
	}

	.bar {
		display: grid;
		grid-template-columns: 44px 1fr 44px;
		align-items: center;
		padding-top: env(safe-area-inset-top);
		height: calc(44px + env(safe-area-inset-top));
		border-bottom: 1px solid var(--color-explorer-border);
		background: var(--color-window-bg);
	}

	.back {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.back:active {
		color: var(--color-accent);
	}

	.title {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.icon {
		color: var(--color-accent);
		display: inline-flex;
	}

	.spacer {
		width: 44px;
	}

	.body {
		overflow-y: auto;
		padding: 16px;
		padding-bottom: calc(env(safe-area-inset-bottom) + 16px);
		font-size: 14px;
		line-height: 1.55;
		color: var(--color-text-secondary);
	}

	.body.full-bleed {
		overflow: hidden;
		padding: 0;
	}
</style>
