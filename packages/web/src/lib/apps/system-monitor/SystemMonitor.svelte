<script lang="ts">
	import { untrack } from 'svelte';
	import { t } from '$lib/os/i18n.svelte.js';
	import type { MetricsSnapshot } from '@curios/shared/types';
	import { createMetricsConnection } from './metrics-ws.js';
	import MetricsSummaryBar from './MetricsSummaryBar.svelte';
	import LineChart from './LineChart.svelte';
	import StatusCodeBar from './StatusCodeBar.svelte';
	import RecentRequests from './RecentRequests.svelte';

	let snapshot = $state<MetricsSnapshot | null>(null);
	let connectionStatus = $state<'connecting' | 'live' | 'stale'>('connecting');

	$effect(() => {
		const conn = untrack(() =>
			createMetricsConnection(
				(s) => {
					snapshot = s;
				},
				(status) => {
					connectionStatus = status;
				}
			)
		);
		return () => conn.close();
	});
</script>

<div class="system-monitor">
	{#if snapshot}
		<MetricsSummaryBar
			uptimeSeconds={snapshot.uptimeSeconds}
			activeConnections={snapshot.activeConnections}
			totalRequests={snapshot.totalRequests}
		/>

		<div class="dashboard">
			<div class="column">
				<LineChart
					data={snapshot.requestRateSeries}
					label={t('monitor.requestRate')}
					unit=" req/s"
				/>
				<LineChart
					data={snapshot.responseTimeSeries}
					label={t('monitor.responseTime')}
					unit="ms"
					color="var(--color-control-maximize)"
				/>
				<StatusCodeBar counts={snapshot.statusCounts} />
			</div>

			<div class="column">
				<RecentRequests requests={snapshot.recentRequests} />
			</div>
		</div>
	{:else}
		<div class="loading">
			<span class="status-indicator {connectionStatus}"></span>
			{connectionStatus === 'connecting' ? t('monitor.connecting') : t('monitor.connectionLost')}
		</div>
	{/if}

	<div class="status-bar">
		<span class="status-indicator {connectionStatus}"></span>
		<span class="status-text">{connectionStatus}</span>
		{#if snapshot}
			<span class="rps">{snapshot.requestsPerSecond} req/s</span>
			<span class="avg-ms">{snapshot.avgResponseTimeMs}ms avg</span>
		{/if}
	</div>
</div>

<style>
	.system-monitor {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		background: var(--color-window-bg);
	}

	.dashboard {
		display: flex;
		flex: 1;
		min-height: 0;
		gap: var(--space-4);
		padding: var(--space-4);
		overflow-y: auto;
	}

	.column {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-width: 0;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		flex: 1;
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.status-bar {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-1) var(--space-3);
		border-top: 1px solid var(--color-explorer-border);
		font-family: var(--font-mono);
		font-size: 0.65rem;
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.status-indicator {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status-indicator.live {
		background: var(--color-control-maximize);
	}

	.status-indicator.connecting {
		background: var(--color-control-minimize);
		animation: pulse 1s infinite;
	}

	.status-indicator.stale {
		background: var(--color-control-close);
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	.status-text {
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.rps,
	.avg-ms {
		margin-left: auto;
		color: var(--color-text-secondary);
	}

	.avg-ms {
		margin-left: var(--space-3);
	}
</style>
