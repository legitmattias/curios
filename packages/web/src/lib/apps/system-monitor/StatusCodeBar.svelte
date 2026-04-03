<script lang="ts">
	let {
		counts
	}: {
		counts: { '2xx': number; '4xx': number; '5xx': number };
	} = $props();

	const total = $derived(counts['2xx'] + counts['4xx'] + counts['5xx']);

	function pct(n: number): number {
		return total > 0 ? (n / total) * 100 : 0;
	}
</script>

<div class="status-codes">
	<div class="bar-header">
		<span class="bar-label">Status Codes</span>
		<span class="bar-total">{total} total</span>
	</div>

	<div class="bar-row">
		<span class="code success">2xx</span>
		<div class="bar-track">
			<div class="bar-fill success" style="width: {pct(counts['2xx'])}%"></div>
		</div>
		<span class="count">{counts['2xx']}</span>
	</div>

	<div class="bar-row">
		<span class="code warning">4xx</span>
		<div class="bar-track">
			<div class="bar-fill warning" style="width: {pct(counts['4xx'])}%"></div>
		</div>
		<span class="count">{counts['4xx']}</span>
	</div>

	<div class="bar-row">
		<span class="code error">5xx</span>
		<div class="bar-track">
			<div class="bar-fill error" style="width: {pct(counts['5xx'])}%"></div>
		</div>
		<span class="count">{counts['5xx']}</span>
	</div>
</div>

<style>
	.status-codes {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.bar-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.bar-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.bar-total {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.bar-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.code {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		width: 28px;
	}

	.code.success {
		color: var(--color-control-maximize);
	}

	.code.warning {
		color: var(--color-control-minimize);
	}

	.code.error {
		color: var(--color-control-close);
	}

	.bar-track {
		flex: 1;
		height: 6px;
		background: var(--color-monitor-bg);
		border-radius: 3px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 3px;
		transition: width var(--transition-normal);
	}

	.bar-fill.success {
		background: var(--color-control-maximize);
	}

	.bar-fill.warning {
		background: var(--color-control-minimize);
	}

	.bar-fill.error {
		background: var(--color-control-close);
	}

	.count {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		width: 40px;
		text-align: right;
	}
</style>
