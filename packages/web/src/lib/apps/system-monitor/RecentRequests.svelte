<script lang="ts">
	import type { MetricEvent } from '@curios/shared/types';

	let {
		requests
	}: {
		requests: MetricEvent[];
	} = $props();

	function statusColor(status: number): string {
		if (status >= 500) return 'var(--color-control-close)';
		if (status >= 400) return 'var(--color-control-minimize)';
		return 'var(--color-control-maximize)';
	}

	function methodClass(method: string): string {
		if (method === 'GET') return 'badge-get';
		if (method === 'POST') return 'badge-post';
		return 'badge-other';
	}
</script>

<div class="recent-requests">
	<div class="section-header">
		<span class="section-label">Recent Requests</span>
	</div>
	<div class="request-list">
		{#each requests as req (req.timestamp + req.path)}
			<div class="request-row">
				<span class="method {methodClass(req.method)}">{req.method}</span>
				<span class="path">{req.path}</span>
				<span class="status" style="color: {statusColor(req.status)}">{req.status}</span>
				<span class="duration">{Math.round(req.durationMs)}ms</span>
			</div>
		{/each}
		{#if requests.length === 0}
			<div class="empty">No requests yet</div>
		{/if}
	</div>
</div>

<style>
	.recent-requests {
		display: flex;
		flex-direction: column;
		min-height: 0;
		flex: 1;
	}

	.section-header {
		padding-bottom: var(--space-2);
	}

	.section-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.request-list {
		display: flex;
		flex-direction: column;
		gap: 1px;
		overflow-y: auto;
		min-height: 0;
		flex: 1;
	}

	.request-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) 0;
		font-family: var(--font-mono);
		font-size: 0.7rem;
	}

	.method {
		padding: 1px var(--space-1);
		border-radius: 2px;
		font-size: 0.6rem;
		font-weight: 600;
		width: 36px;
		text-align: center;
		flex-shrink: 0;
	}

	.badge-get {
		background: var(--color-monitor-badge-get);
		color: var(--color-control-maximize);
	}

	.badge-post {
		background: var(--color-monitor-badge-post);
		color: var(--color-accent);
	}

	.badge-other {
		background: var(--color-monitor-badge-other);
		color: var(--color-text-secondary);
	}

	.path {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--color-text-secondary);
	}

	.status {
		width: 28px;
		text-align: right;
		flex-shrink: 0;
		font-weight: 600;
	}

	.duration {
		width: 40px;
		text-align: right;
		flex-shrink: 0;
		color: var(--color-text-muted);
	}

	.empty {
		color: var(--color-text-muted);
		font-size: 0.75rem;
		padding: var(--space-2) 0;
	}
</style>
