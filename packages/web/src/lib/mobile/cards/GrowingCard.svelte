<script lang="ts">
	import { fetchNow, type NowGoal } from '$lib/apps/file-explorer/api.js';
	import { t } from '$lib/os/i18n.svelte.js';

	let goals = $state<NowGoal[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		void (async () => {
			loading = true;
			error = null;
			try {
				const res = await fetchNow();
				goals = res.data;
			} catch (err) {
				error = err instanceof Error ? err.message : String(err);
			} finally {
				loading = false;
			}
		})();
	});
</script>

{#if loading}
	<p class="state">{t('mobile.loading')}</p>
{:else if error}
	<p class="state error">{error}</p>
{:else if goals.length === 0}
	<p class="state">{t('mobile.growing.empty')}</p>
{:else}
	<ul class="list">
		{#each goals as g (g.id)}
			<li class="goal">
				<div class="head">
					<span class="name">{g.name}</span>
					<span class="priority" data-priority={g.priority}>{g.priority}</span>
				</div>
				{#if g.description}
					<p class="desc">{g.description}</p>
				{/if}
				{#if g.progress !== null && g.progress > 0}
					<div class="progress" aria-label="Progress {g.progress}%">
						<div class="track">
							<div class="fill" style:width="{g.progress}%"></div>
						</div>
						<span class="pct">{g.progress}%</span>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.state {
		color: var(--color-text-muted);
		font-size: 13px;
	}

	.state.error {
		color: var(--color-control-close);
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.goal {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 16px 0;
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.goal:last-child {
		border-bottom: none;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.name {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text-primary);
		letter-spacing: -0.01em;
	}

	.priority {
		padding: 1px 7px;
		font-family: var(--font-mono);
		font-size: 9.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border-radius: 3px;
		border: 1px solid currentColor;
		color: var(--color-text-muted);
	}

	.priority[data-priority='high'] {
		color: var(--color-accent);
	}

	.desc {
		margin: 0;
		font-size: 13px;
		line-height: 1.55;
		color: var(--color-text-secondary);
		/* Clamp to 3 lines; many Dossier descriptions are long and only the
		   first bit matters on the mobile tile. */
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.progress {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}

	.track {
		flex: 1;
		height: 4px;
		background: var(--color-explorer-border);
		border-radius: 2px;
		overflow: hidden;
	}

	.fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: inherit;
	}

	.pct {
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: var(--color-text-muted);
		min-width: 32px;
		text-align: right;
	}
</style>
