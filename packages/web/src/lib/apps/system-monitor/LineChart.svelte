<script lang="ts">
	let {
		data,
		label,
		unit,
		color = 'var(--color-monitor-chart-stroke)'
	}: {
		data: number[];
		label: string;
		unit: string;
		color?: string;
	} = $props();

	const WIDTH = 300;
	const HEIGHT = 60;
	const PADDING = 2;

	const currentValue = $derived(data.length > 0 ? data[data.length - 1] : 0);

	const points = $derived(() => {
		if (data.length === 0) return '';
		const max = Math.max(...data, 1); // avoid division by zero
		const usableHeight = HEIGHT - PADDING * 2;
		const step = WIDTH / Math.max(data.length - 1, 1);

		return data
			.map((v, i) => {
				const x = i * step;
				const y = PADDING + usableHeight - (v / max) * usableHeight;
				return `${x},${y}`;
			})
			.join(' ');
	});

	const fillPoints = $derived(() => {
		if (data.length === 0) return '';
		const polyline = points();
		return `0,${HEIGHT} ${polyline} ${WIDTH},${HEIGHT}`;
	});
</script>

<div class="chart">
	<div class="chart-header">
		<span class="chart-label">{label}</span>
		<span class="chart-value">{Math.round(currentValue * 100) / 100}{unit}</span>
	</div>
	<svg viewBox="0 0 {WIDTH} {HEIGHT}" preserveAspectRatio="none" class="chart-svg">
		<!-- Grid lines -->
		<line x1="0" y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} class="grid-line" />

		<!-- Fill area -->
		<polygon points={fillPoints()} fill={color} opacity="0.08" />

		<!-- Line -->
		<polyline points={points()} fill="none" stroke={color} stroke-width="1.5" />
	</svg>
</div>

<style>
	.chart {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.chart-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.chart-value {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text-primary);
	}

	.chart-svg {
		width: 100%;
		height: 60px;
		border-radius: var(--radius-button);
		background: var(--color-monitor-bg);
	}

	.grid-line {
		stroke: var(--color-monitor-grid);
		stroke-width: 0.5;
	}
</style>
