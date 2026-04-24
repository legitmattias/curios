<script lang="ts">
	export type Status = 'idle' | 'running' | 'success' | 'error' | 'warn';

	let { status, label }: { status: Status; label?: string } = $props();

	const defaultLabels: Record<Status, string> = {
		idle: 'Idle',
		running: 'Running',
		success: 'OK',
		error: 'Error',
		warn: 'Warning'
	};

	const glyphs: Record<Status, string> = {
		idle: '◌',
		running: '●',
		success: '✓',
		error: '✗',
		warn: '!'
	};
</script>

<span class="pill status-{status}">
	<span class="dot" aria-hidden="true">{glyphs[status]}</span>
	<span class="label">{label ?? defaultLabels[status]}</span>
</span>

<style>
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 2px 7px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		font-weight: 500;
		line-height: 1.2;
		border: 1px solid var(--color-explorer-border);
		border-radius: 3px;
		background: transparent;
		white-space: nowrap;
	}

	.dot {
		font-size: 11px;
		line-height: 1;
	}

	.status-idle .dot {
		color: var(--color-text-muted);
	}
	.status-idle .label {
		color: var(--color-text-muted);
	}

	.status-running .dot {
		color: var(--color-accent);
		animation: pulse 1.2s ease-in-out infinite;
	}
	.status-running .label {
		color: var(--color-text-primary);
	}

	.status-success .dot {
		color: var(--color-control-maximize, var(--color-accent));
	}
	.status-success .label {
		color: var(--color-text-primary);
	}

	.status-error .dot {
		color: var(--color-control-close);
	}
	.status-error .label {
		color: var(--color-text-primary);
	}

	.status-warn .dot {
		color: var(--color-control-minimize);
	}
	.status-warn .label {
		color: var(--color-text-primary);
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}
</style>
