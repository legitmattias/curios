<script lang="ts">
	import { onDestroy } from 'svelte';
	import Tooltip from '$lib/admin/components/Tooltip.svelte';
	import StatusPill from '$lib/admin/components/StatusPill.svelte';
	import ConfirmModal from '$lib/admin/components/ConfirmModal.svelte';
	import RelativeTime from '$lib/admin/components/RelativeTime.svelte';
	import type { SyncStateRow } from './+page.server.js';

	let { data } = $props();

	type OpKey = 'projects' | 'skills' | 'languages' | 'cv-skills' | 'cv-projects';

	interface SyncOp {
		key: OpKey;
		title: string;
		description: string;
		cost: 'free' | 'llm';
		supportsForce: boolean;
		// Position in the typical fresh-DB sync order; operations with the same
		// order value are interchangeable. Pure ordering hint — nothing enforces it.
		order: number;
		// Short note explaining why the position matters / dependencies.
		orderNote: string;
	}

	const ops: SyncOp[] = [
		{
			key: 'skills',
			title: 'Skills',
			description:
				'Pulls featured + public skills from Dossier (excluding Spoken Languages). LLM generates skill descriptions with project cross-references. Hash cache skips unchanged skills unless force is on.',
			cost: 'llm',
			supportsForce: true,
			order: 1,
			orderNote: 'Run first so Projects can align tech names against the skill list.'
		},
		{
			key: 'projects',
			title: 'Projects',
			description:
				'Pulls featured projects from Dossier. LLM generates tech descriptions per project. Hash cache skips unchanged projects unless force is on.',
			cost: 'llm',
			supportsForce: true,
			order: 2,
			orderNote: 'Uses the skill catalog for tech-name alignment.'
		},
		{
			key: 'languages',
			title: 'Languages',
			description:
				'Pulls featured spoken languages from Dossier and stores them on the profile, sorted by proficiency. No LLM call.',
			cost: 'free',
			supportsForce: false,
			order: 3,
			orderNote: 'Independent — can run at any time.'
		},
		{
			key: 'cv-skills',
			title: 'CV skill clusters',
			description:
				'LLM condenses the ~50 featured skills into ~10–14 thematic clusters for the CV sidebar. Always regenerates.',
			cost: 'llm',
			supportsForce: false,
			order: 4,
			orderNote: 'Requires skills to be synced first.'
		},
		{
			key: 'cv-projects',
			title: 'CV project summaries',
			description:
				'LLM writes a one-sentence CV summary + pared-down tech for each project. Always regenerates.',
			cost: 'llm',
			supportsForce: false,
			order: 5,
			orderNote: 'Requires projects to be synced first.'
		}
	];

	// ── Per-op runtime state ──
	interface OpState {
		status: 'idle' | 'running' | 'success' | 'error';
		lastRunAt: string | null;
		lastDuration: number | null;
		lastResult: unknown;
		lastError: string | null;
	}

	function fromServerRow(op: OpKey): OpState {
		const row = data.syncState[op];
		if (!row) return blank();
		return {
			// Pass 'running' through so in-flight syncs stay visible across reloads.
			// Successful finishes collapse to 'idle' (the row still shows the
			// result + timestamp); errors surface as 'error' until the next run.
			status:
				row.lastStatus === 'running' ? 'running' : row.lastStatus === 'error' ? 'error' : 'idle',
			lastRunAt: row.lastRunAt,
			lastDuration: row.lastDurationMs,
			lastResult: row.lastResult,
			lastError: row.lastError
		};
	}

	const initial: Record<OpKey, OpState> = {
		projects: fromServerRow('projects'),
		skills: fromServerRow('skills'),
		languages: fromServerRow('languages'),
		'cv-skills': fromServerRow('cv-skills'),
		'cv-projects': fromServerRow('cv-projects')
	};

	let runState = $state<Record<OpKey, OpState>>(initial);
	let force = $state<Record<OpKey, boolean>>({
		projects: false,
		skills: false,
		languages: false,
		'cv-skills': false,
		'cv-projects': false
	});

	// ── Confirmation modal ──
	let confirmOpen = $state(false);
	let pendingOp: SyncOp | null = $state(null);
	let pendingForce = $state(false);

	// ── Toast ──
	let toast = $state<{ text: string; kind: 'success' | 'error' } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	function showToast(text: string, kind: 'success' | 'error') {
		toast = { text, kind };
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 4500);
	}

	function blank(): OpState {
		return {
			status: 'idle',
			lastRunAt: null,
			lastDuration: null,
			lastResult: null,
			lastError: null
		};
	}

	function needsConfirm(op: SyncOp, force: boolean): boolean {
		if (op.cost === 'llm' && !op.supportsForce) return true; // always LLM cost
		if (op.cost === 'llm' && force) return true; // force bypass of hash cache
		return false;
	}

	function triggerRun(op: SyncOp) {
		if (needsConfirm(op, force[op.key])) {
			pendingOp = op;
			pendingForce = force[op.key];
			confirmOpen = true;
		} else {
			void run(op, force[op.key]);
		}
	}

	// Auto-fade success state back to idle after this many ms.
	const SUCCESS_FADE_MS = 15_000;
	const fadeTimers: Partial<Record<OpKey, ReturnType<typeof setTimeout>>> = {};

	function scheduleFade(key: OpKey) {
		const existing = fadeTimers[key];
		if (existing) clearTimeout(existing);
		fadeTimers[key] = setTimeout(() => {
			if (runState[key].status === 'success') {
				runState[key] = { ...runState[key], status: 'idle' };
			}
		}, SUCCESS_FADE_MS);
	}

	// ── Background polling ──
	// While any operation is 'running' (including runs started in a prior
	// session or another tab), poll /admin/sync/state so the page picks up
	// the outcome and fires a toast — even if the user reloaded or navigated
	// away while the API server was still working.
	const POLL_INTERVAL_MS = 3000;
	let pollTimer: ReturnType<typeof setInterval> | undefined;

	async function pollTick() {
		try {
			const res = await fetch('/admin/sync/state');
			if (!res.ok) return;
			const body = (await res.json()) as { data: SyncStateRow[] };
			for (const row of body.data) {
				const op = row.operation as OpKey;
				if (!(op in runState)) continue;
				const prev = runState[op].status;
				const title = ops.find((o) => o.key === op)?.title ?? op;

				if (row.lastStatus === 'running') {
					if (prev !== 'running') {
						runState[op] = fromServerRow(op);
					}
					continue;
				}

				// Terminal status in DB. If we were observing a run (local or
				// resumed after reload), surface the transition.
				if (prev === 'running') {
					if (row.lastStatus === 'success') {
						runState[op] = {
							status: 'success',
							lastRunAt: row.lastRunAt,
							lastDuration: row.lastDurationMs,
							lastResult: row.lastResult,
							lastError: row.lastError
						};
						scheduleFade(op);
						const secs =
							row.lastDurationMs !== null ? Math.round(row.lastDurationMs / 100) / 10 : null;
						showToast(`${title}: done${secs !== null ? ` (${secs}s)` : ''}`, 'success');
					} else {
						runState[op] = {
							status: 'error',
							lastRunAt: row.lastRunAt,
							lastDuration: row.lastDurationMs,
							lastResult: null,
							lastError: row.lastError
						};
						showToast(`${title}: ${row.lastError ?? 'failed'}`, 'error');
					}
				}
			}
		} catch {
			// Transient network error — keep polling; next tick may succeed.
		}
	}

	// Start/stop the poll based on whether anything is running. Rerun each time
	// runState changes, which covers: initial hydration, in-session triggers,
	// and transitions observed by polling itself (at which point we can stop).
	$effect(() => {
		const anyRunning = (Object.keys(runState) as OpKey[]).some(
			(k) => runState[k].status === 'running'
		);
		if (anyRunning && !pollTimer) {
			pollTimer = setInterval(() => void pollTick(), POLL_INTERVAL_MS);
		} else if (!anyRunning && pollTimer) {
			clearInterval(pollTimer);
			pollTimer = undefined;
		}
	});

	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
		if (toastTimer) clearTimeout(toastTimer);
		for (const t of Object.values(fadeTimers)) if (t) clearTimeout(t);
	});

	async function run(op: SyncOp, doForce: boolean) {
		runState[op.key] = { ...runState[op.key], status: 'running', lastError: null };
		const start = performance.now();

		try {
			const res = await fetch('/admin/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					operation: op.key,
					force: op.supportsForce ? doForce : undefined
				})
			});
			const body = (await res.json()) as {
				ok: boolean;
				status: number;
				data: unknown;
				error: string | null;
			};

			const duration = performance.now() - start;

			if (!body.ok) {
				runState[op.key] = {
					status: 'error',
					lastRunAt: new Date().toISOString(),
					lastDuration: duration,
					lastResult: null,
					lastError: body.error ?? `HTTP ${body.status}`
				};
				showToast(`${op.title}: ${body.error ?? 'failed'}`, 'error');
				return;
			}

			runState[op.key] = {
				status: 'success',
				lastRunAt: new Date().toISOString(),
				lastDuration: duration,
				lastResult: body.data,
				lastError: null
			};
			scheduleFade(op.key);
			showToast(`${op.title}: done (${Math.round(duration / 100) / 10}s)`, 'success');
		} catch (err) {
			runState[op.key] = {
				...runState[op.key],
				status: 'error',
				lastRunAt: new Date().toISOString(),
				lastDuration: performance.now() - start,
				lastError: err instanceof Error ? err.message : String(err)
			};
			showToast(`${op.title}: ${err instanceof Error ? err.message : 'failed'}`, 'error');
		}
	}

	function confirmAndRun() {
		if (!pendingOp) return;
		const op = pendingOp;
		const f = pendingForce;
		pendingOp = null;
		// Fire-and-forget so the modal closes immediately while the sync runs
		// in the background. Row's status pill handles the running/success state.
		void run(op, f);
	}

	function confirmBodyMessage(op: SyncOp | null, f: boolean): string {
		if (!op) return '';
		if (op.cost === 'llm' && !op.supportsForce) {
			return `This will regenerate all ${op.title.toLowerCase()} via Claude. Cost: a few cents. Proceed?`;
		}
		if (f) {
			return `Force sync bypasses the content-hash cache and re-runs the LLM for every item in ${op.title.toLowerCase()}. Cost: a few cents. Proceed?`;
		}
		return 'Proceed?';
	}

	function formatDuration(ms: number | null): string {
		if (ms === null) return '—';
		if (ms < 1000) return `${Math.round(ms)}ms`;
		return `${Math.round(ms / 100) / 10}s`;
	}

	function resultSummary(op: OpKey, result: unknown): string {
		if (!result || typeof result !== 'object') return '';
		const r = result as Record<string, unknown>;
		if (op === 'projects' && 'synced' in r)
			return `synced ${r.synced}${'removed' in r && Number(r.removed) > 0 ? `, removed ${r.removed}` : ''}`;
		if (op === 'skills' && 'synced' in r)
			return `synced ${r.synced}${'removed' in r && Number(r.removed) > 0 ? `, removed ${r.removed}` : ''}`;
		if (op === 'languages' && 'languages' in r)
			return `${r.languages} languages${'skipped' in r && Number(r.skipped) > 0 ? `, skipped ${r.skipped}` : ''}`;
		if (op === 'cv-skills' && 'clusters' in r) return `${r.clusters} clusters`;
		if (op === 'cv-projects' && 'projects' in r) return `${r.projects} summaries`;
		return '';
	}
</script>

<svelte:head>
	<title>Admin · Sync · CuriOS</title>
</svelte:head>

<section class="section">
	<header class="section-head">
		<h1 class="eyebrow">Sync operations</h1>
		<p class="lede">
			Each operation writes to the CuriOS database. Operations tagged
			<span class="cost-tag llm">LLM</span> spend Anthropic credits. Force re-runs always prompt for confirmation.
		</p>
		<p class="meta-line">
			Typical order on a fresh database: <strong>1. Skills</strong> → <strong>2. Projects</strong>
			→ <strong>3. Languages</strong> → <strong>4. CV skills</strong>
			→ <strong>5. CV projects</strong>. Day-to-day, run only what changed — hover the number badge
			on a row to see its dependency.
		</p>
		<p class="meta-line quiet">
			Sync jobs run on the API server. <em>Last run</em> and <em>Status</em> are persisted, so closing
			the tab or reloading won't interrupt a running job — you'll see the outcome when you return.
		</p>
	</header>

	<div class="ops">
		<div class="ops-head">
			<div>Operation</div>
			<div>Last run</div>
			<div>Status</div>
			<div class="right">Action</div>
		</div>

		{#each ops as op (op.key)}
			{@const s = runState[op.key]}
			<div class="op-row">
				<div class="op-meta">
					<div class="op-title">
						<Tooltip label={op.orderNote} side="right">
							<span class="order-badge" aria-label="Order position {op.order}">{op.order}</span>
						</Tooltip>
						<span>{op.title}</span>
						{#if op.cost === 'llm'}
							<Tooltip label="Spends Anthropic LLM credits">
								<span class="cost-tag llm">LLM</span>
							</Tooltip>
						{:else}
							<Tooltip label="Free to run (no LLM call)">
								<span class="cost-tag free">FREE</span>
							</Tooltip>
						{/if}
					</div>
					<p class="op-desc">{op.description}</p>
					{#if op.supportsForce}
						<label class="force-toggle">
							<input type="checkbox" bind:checked={force[op.key]} />
							<span>Force (bypass hash cache)</span>
							<Tooltip
								label="Normally a content-hash cache skips items whose input hasn't changed, keeping the LLM cost near zero. Force re-runs everything."
								side="top"
							>
								<span class="info" aria-hidden="true">?</span>
							</Tooltip>
						</label>
					{/if}
				</div>

				<div class="op-last">
					<RelativeTime iso={s.lastRunAt} placeholder="—" />
					{#if s.lastDuration !== null}
						<span class="dim">· {formatDuration(s.lastDuration)}</span>
					{/if}
					{#if s.lastError}
						<div class="err" title={s.lastError}>{s.lastError}</div>
					{:else if s.lastResult}
						<div class="result">{resultSummary(op.key, s.lastResult)}</div>
					{/if}
				</div>

				<div class="op-status">
					<StatusPill status={s.status} />
				</div>

				<div class="op-action">
					<Tooltip
						label={needsConfirm(op, force[op.key])
							? 'You will be asked to confirm — this operation costs LLM credits.'
							: `Run ${op.title.toLowerCase()} now`}
					>
						<button
							class="run-btn"
							onclick={() => triggerRun(op)}
							disabled={s.status === 'running'}
						>
							{s.status === 'running' ? 'Running…' : 'Run'}
						</button>
					</Tooltip>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- Confirmation for LLM-cost operations -->
<ConfirmModal
	bind:open={confirmOpen}
	title={pendingOp ? `Run ${pendingOp.title}?` : ''}
	message={confirmBodyMessage(pendingOp, pendingForce)}
	confirmLabel="Run"
	onconfirm={confirmAndRun}
	oncancel={() => (pendingOp = null)}
/>

<!-- Toast -->
{#if toast}
	<div class="toast toast-{toast.kind}" role="status">{toast.text}</div>
{/if}

<style>
	.section {
		max-width: 1100px;
		margin-bottom: var(--space-5);
	}

	.section-head {
		margin-bottom: var(--space-3);
	}

	.eyebrow {
		margin: 0 0 4px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-accent);
	}

	.lede {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--color-text-secondary);
		max-width: 70ch;
	}

	.meta-line {
		margin: 8px 0 0;
		font-size: 12px;
		line-height: 1.5;
		color: var(--color-text-secondary);
		max-width: 78ch;
	}

	.meta-line.quiet {
		color: var(--color-text-muted);
		font-size: 11.5px;
	}

	.meta-line strong {
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.order-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		font-weight: 600;
		color: var(--color-text-muted);
		background: var(--color-explorer-item-hover);
		border: 1px solid var(--color-explorer-border);
		border-radius: 2px;
		cursor: help;
	}

	.ops {
		border: 1px solid var(--color-explorer-border);
		border-radius: 4px;
		overflow: hidden;
		background: var(--color-window-bg);
	}

	.ops-head,
	.op-row {
		display: grid;
		grid-template-columns: 1fr 200px 110px 110px;
		gap: var(--space-3);
		padding: 10px var(--space-3);
		align-items: start;
	}

	.ops-head {
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-explorer-border);
		background: var(--color-explorer-item-hover);
	}

	.op-row {
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.op-row:last-child {
		border-bottom: none;
	}

	.right {
		text-align: right;
	}

	.op-title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.cost-tag {
		display: inline-flex;
		align-items: center;
		padding: 1px 6px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 9.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		border-radius: 2px;
		border: 1px solid var(--color-explorer-border);
		color: var(--color-text-muted);
	}

	.cost-tag.llm {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.op-desc {
		margin: 6px 0 0;
		font-size: 12px;
		line-height: 1.5;
		color: var(--color-text-secondary);
	}

	.force-toggle {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
		font-size: 11.5px;
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.force-toggle input {
		margin: 0;
		accent-color: var(--color-accent);
	}

	.info {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 9px;
		color: var(--color-text-muted);
		border: 1px dashed var(--color-explorer-border);
		border-radius: 50%;
		cursor: help;
	}

	.op-last {
		font-size: 12px;
		color: var(--color-text-secondary);
	}

	.op-last .dim {
		color: var(--color-text-muted);
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
	}

	.result {
		margin-top: 4px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 10.5px;
		color: var(--color-text-muted);
	}

	.err {
		margin-top: 4px;
		font-size: 11px;
		color: var(--color-control-close);
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.op-action {
		text-align: right;
	}

	.run-btn {
		height: 28px;
		padding: 0 14px;
		font-family: inherit;
		font-size: 12px;
		font-weight: 500;
		color: #ffffff;
		background: var(--color-accent);
		border: 1px solid var(--color-accent);
		border-radius: 3px;
		cursor: pointer;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast),
			opacity var(--transition-fast);
	}

	.run-btn:hover:not(:disabled) {
		background: var(--color-accent-hover);
		border-color: var(--color-accent-hover);
	}

	.run-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.toast {
		position: fixed;
		right: var(--space-4);
		bottom: var(--space-4);
		padding: 10px 14px;
		font-size: 12px;
		font-weight: 500;
		color: var(--color-text-primary);
		background: var(--color-window-bg);
		border: 1px solid var(--color-explorer-border);
		border-left-width: 3px;
		border-radius: 3px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
		max-width: 380px;
		z-index: 10030;
		animation: slide-in 0.15s ease-out;
	}

	.toast-success {
		border-left-color: var(--color-accent);
	}

	.toast-error {
		border-left-color: var(--color-control-close);
	}

	@keyframes slide-in {
		from {
			transform: translateY(6px);
			opacity: 0;
		}
	}

	@media (max-width: 720px) {
		.ops-head,
		.op-row {
			grid-template-columns: 1fr;
			gap: 6px;
		}
		.ops-head > div:not(:first-child) {
			display: none;
		}
		.right {
			text-align: left;
		}
	}
</style>
