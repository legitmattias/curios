<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';

	let {
		url,
		response,
		visible,
		ontoggle
	}: {
		url: string;
		response: unknown;
		visible: boolean;
		ontoggle: () => void;
	} = $props();

	const curlCommand = $derived(`curl -s ${url}`);
	const formattedJson = $derived(JSON.stringify(response, null, 2));
</script>

<div class="inspector-wrapper">
	<button class="toggle-btn" onclick={ontoggle} title="View API call">
		{visible ? t('explorer.apiBtn.hide') : t('explorer.apiBtn.show')}
	</button>

	{#if visible}
		<div class="inspector">
			<div class="section">
				<span class="label">{t('explorer.api.request')}</span>
				<pre class="code">{curlCommand}</pre>
			</div>
			<div class="section response-section">
				<span class="label">{t('explorer.api.response')}</span>
				<pre class="code">{formattedJson}</pre>
			</div>
		</div>
	{/if}
</div>

<style>
	.inspector-wrapper {
		display: contents;
	}

	.toggle-btn {
		position: relative;
		z-index: 11;
		padding: var(--space-1) var(--space-2);
		border: 1px solid var(--color-explorer-border);
		border-radius: var(--radius-button);
		background: transparent;
		color: var(--color-text-secondary);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
		flex-shrink: 0;
	}

	.toggle-btn:hover {
		background: var(--color-explorer-item-hover);
		color: var(--color-text-primary);
	}

	.inspector {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 50%;
		min-width: 280px;
		background: var(--color-window-bg);
		border-left: 1px solid var(--color-explorer-border);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		z-index: 10;
	}

	.section {
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.response-section {
		flex: 1;
		overflow: auto;
		border-bottom: none;
	}

	.label {
		display: block;
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: var(--space-1);
	}

	.code {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-primary);
		white-space: pre-wrap;
		word-break: break-all;
		margin: 0;
	}
</style>
