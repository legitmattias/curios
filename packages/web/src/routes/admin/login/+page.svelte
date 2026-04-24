<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import type { ActionData, PageData } from './$types.js';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let password = $state('');
	let submitting = $state(false);
	let input: HTMLInputElement | undefined = $state();

	onMount(() => input?.focus());
</script>

<svelte:head>
	<title>Admin · Sign in · CuriOS</title>
</svelte:head>

<div class="shell">
	<div class="grid-bg" aria-hidden="true"></div>

	<main class="card">
		<div class="mark">
			<span class="wordmark">CuriOS</span>
			<span class="divider">/</span>
			<span class="sub">ADMIN</span>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<label class="field">
				<span class="label-text">Password</span>
				<input
					bind:this={input}
					type="password"
					name="password"
					bind:value={password}
					autocomplete="current-password"
					required
					disabled={submitting}
				/>
			</label>

			{#if !data.configured}
				<p class="error" role="alert">
					Admin is not configured on this server. Set <code>ADMIN_PASSWORD</code> and
					<code>ADMIN_SESSION_SECRET</code>.
				</p>
			{:else if form?.message}
				<p class="error" role="alert">{form.message}</p>
			{/if}

			<button type="submit" class="submit" disabled={submitting || !password || !data.configured}>
				{submitting ? 'Signing in…' : 'Sign in'}
			</button>
		</form>

		<p class="hint">
			Access is restricted to the site owner. Unauthorised attempts are rate-limited.
		</p>
	</main>
</div>

<style>
	.shell {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-5);
		background: var(--color-desktop-bg);
		overflow: hidden;
	}

	.grid-bg {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(var(--color-explorer-border) 1px, transparent 1px),
			linear-gradient(90deg, var(--color-explorer-border) 1px, transparent 1px);
		background-size: 32px 32px;
		opacity: 0.25;
		mask-image: radial-gradient(ellipse at center, black 0%, transparent 75%);
		pointer-events: none;
	}

	.card {
		position: relative;
		width: min(360px, 100%);
		background: var(--color-window-bg);
		border: 1px solid var(--color-explorer-border);
		border-radius: 4px;
		padding: var(--space-5) var(--space-5) var(--space-4);
	}

	.mark {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		margin-bottom: var(--space-5);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.wordmark {
		font-family: inherit;
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--color-text-primary);
	}

	.divider {
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 13px;
		color: var(--color-text-muted);
	}

	.sub {
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-accent);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.label-text {
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	input[type='password'] {
		height: 34px;
		padding: 0 10px;
		font-family: inherit;
		font-size: 13px;
		color: var(--color-text-primary);
		background: transparent;
		border: 1px solid var(--color-explorer-border);
		border-radius: 3px;
		transition: border-color var(--transition-fast);
	}

	input[type='password']:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.error {
		margin: 0;
		padding: 8px 10px;
		font-size: 12px;
		color: var(--color-control-close);
		background: transparent;
		border: 1px solid var(--color-control-close);
		border-radius: 3px;
		line-height: 1.4;
	}

	.submit {
		height: 34px;
		padding: 0 14px;
		font-family: inherit;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: #ffffff;
		background: var(--color-accent);
		border: 1px solid var(--color-accent);
		border-radius: 3px;
		cursor: pointer;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast);
	}

	.submit:hover:not(:disabled) {
		background: var(--color-accent-hover);
		border-color: var(--color-accent-hover);
	}

	.submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.hint {
		margin: var(--space-4) 0 0;
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-explorer-border);
		font-size: 11px;
		line-height: 1.5;
		color: var(--color-text-muted);
	}
</style>
