<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';

	let {
		uptimeSeconds,
		activeConnections,
		totalRequests
	}: {
		uptimeSeconds: number;
		activeConnections: number;
		totalRequests: number;
	} = $props();

	const formattedUptime = $derived(() => {
		const d = Math.floor(uptimeSeconds / 86400);
		const h = Math.floor((uptimeSeconds % 86400) / 3600);
		const m = Math.floor((uptimeSeconds % 3600) / 60);
		const s = Math.floor(uptimeSeconds % 60);
		const parts: string[] = [];
		if (d > 0) parts.push(`${d}d`);
		if (h > 0) parts.push(`${h}h`);
		if (m > 0) parts.push(`${m}m`);
		parts.push(`${s}s`);
		return parts.join(' ');
	});
</script>

<div class="summary-bar">
	<div class="stat">
		<span class="stat-label">{t('monitor.uptime')}</span>
		<span class="stat-value">{formattedUptime()}</span>
	</div>
	<div class="stat">
		<span class="stat-label">{t('monitor.connections')}</span>
		<span class="stat-value">{activeConnections}</span>
	</div>
	<div class="stat">
		<span class="stat-label">{t('monitor.totalRequests')}</span>
		<span class="stat-value">{totalRequests.toLocaleString()}</span>
	</div>
</div>

<style>
	.summary-bar {
		display: flex;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat-label {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.stat-value {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		color: var(--color-text-primary);
	}
</style>
