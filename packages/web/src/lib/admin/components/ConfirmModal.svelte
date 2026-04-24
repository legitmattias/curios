<script lang="ts">
	import { onMount } from 'svelte';

	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		variant = 'default',
		onconfirm,
		oncancel
	}: {
		open?: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'default' | 'danger';
		onconfirm: () => void | Promise<void>;
		oncancel?: () => void;
	} = $props();

	let busy = $state(false);
	let dialog: HTMLDivElement | undefined = $state();
	let firstButton: HTMLButtonElement | undefined = $state();

	function close() {
		if (busy) return;
		open = false;
		oncancel?.();
	}

	async function confirm() {
		if (busy) return;
		busy = true;
		try {
			await onconfirm();
			open = false;
		} finally {
			busy = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		} else if (e.key === 'Enter' && !busy) {
			e.preventDefault();
			void confirm();
		} else if (e.key === 'Tab' && dialog) {
			// Minimal focus trap — keep Tab within the dialog.
			const focusables = dialog.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			if (focusables.length === 0) return;
			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});

	$effect(() => {
		if (open) {
			// Focus the cancel button by default (safer).
			setTimeout(() => firstButton?.focus(), 0);
		}
	});
</script>

{#if open}
	<!-- Backdrop is a <button> so the click-to-close behaviour has an implicit
	keyboard affordance (Space/Enter) without svelte/a11y warnings. -->
	<button type="button" class="backdrop" onclick={close} aria-label="Close dialog"></button>
	<div
		bind:this={dialog}
		class="dialog"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="confirm-title"
	>
		<h2 id="confirm-title" class="title">{title}</h2>
		<p class="message">{message}</p>
		<div class="actions">
			<button
				bind:this={firstButton}
				type="button"
				class="btn btn-ghost"
				onclick={close}
				disabled={busy}
			>
				{cancelLabel}
			</button>
			<button
				type="button"
				class="btn btn-confirm"
				class:danger={variant === 'danger'}
				onclick={confirm}
				disabled={busy}
			>
				{busy ? 'Working…' : confirmLabel}
			</button>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 10040;
		border: none;
		padding: 0;
		cursor: default;
	}

	.dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(440px, calc(100% - var(--space-4) * 2));
		background: var(--color-window-bg);
		border: 1px solid var(--color-explorer-border);
		border-radius: 4px;
		padding: var(--space-4) var(--space-4) var(--space-3);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		z-index: 10041;
		outline: none;
	}

	.title {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0 0 var(--space-2);
		letter-spacing: -0.005em;
	}

	.message {
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0 0 var(--space-4);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
	}

	.btn {
		height: 28px;
		padding: 0 var(--space-3);
		font-size: 12px;
		font-weight: 500;
		font-family: inherit;
		border-radius: 3px;
		cursor: pointer;
		border: 1px solid var(--color-explorer-border);
		background: transparent;
		color: var(--color-text-primary);
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast),
			color var(--transition-fast);
	}

	.btn:hover:not(:disabled) {
		background: var(--color-explorer-item-hover);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-confirm {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: #ffffff;
	}

	.btn-confirm:hover:not(:disabled) {
		background: var(--color-accent-hover);
		border-color: var(--color-accent-hover);
	}

	.btn-confirm.danger {
		background: var(--color-control-close);
		border-color: var(--color-control-close);
	}

	.btn-confirm.danger:hover:not(:disabled) {
		background: var(--color-control-close-hover);
		border-color: var(--color-control-close-hover);
	}
</style>
