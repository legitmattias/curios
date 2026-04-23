<script lang="ts">
	import { t } from '$lib/os/i18n.svelte.js';
	import { profileStore, githubHandle } from '$lib/os/profile-store.svelte.js';

	let visible = $state(false);
	let emailMenu = $state(false);
	let copied = $state(false);
	let wrapper: HTMLDivElement;
	let emailMenuEl: HTMLDivElement | undefined = $state();

	const email = $derived(profileStore.data?.email ?? '');
	const name = $derived(profileStore.data?.name ?? '');
	const githubUrl = $derived(profileStore.data?.github ?? '');
	const githubLabel = $derived(githubHandle(profileStore.data?.github));
	const linkedinUrl = $derived(profileStore.data?.linkedin ?? '');

	function toggle() {
		visible = !visible;
		emailMenu = false;
		copied = false;
	}

	function handleWindowClick(e: MouseEvent) {
		if (visible && wrapper && !wrapper.contains(e.target as Node)) {
			visible = false;
			emailMenu = false;
			return;
		}
		if (emailMenu && emailMenuEl && !emailMenuEl.contains(e.target as Node)) {
			emailMenu = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (emailMenu) {
				emailMenu = false;
			} else {
				visible = false;
			}
		}
	}

	function showEmailMenu(e: MouseEvent) {
		e.stopPropagation();
		emailMenu = !emailMenu;
		copied = false;
	}

	async function copyEmail() {
		if (!email) return;
		await navigator.clipboard.writeText(email);
		copied = true;
		setTimeout(() => {
			copied = false;
			emailMenu = false;
		}, 1500);
	}

	function openMailClient() {
		if (!email) return;
		window.location.href = `mailto:${email}`;
		emailMenu = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} onclick={handleWindowClick} />

<div class="contact-wrapper" bind:this={wrapper}>
	<button class="contact-trigger" onclick={toggle} title={t('contact.trigger')}>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
			<polyline points="22,6 12,13 2,6" />
		</svg>
	</button>

	{#if visible && profileStore.data}
		<div class="card">
			<div class="card-header">
				<span class="card-name">{name}</span>
				<span class="card-title">{t('contact.title')}</span>
			</div>
			<div class="card-links">
				{#if email}
					<button class="card-link" onclick={showEmailMenu}>
						<span class="link-label">{t('contact.email')}</span>
						<span class="link-value">{email}</span>
					</button>

					{#if emailMenu}
						<div class="email-menu" bind:this={emailMenuEl}>
							<button class="email-option" onclick={copyEmail}>
								{copied ? t('contact.copied') : t('contact.copy')}
							</button>
							<button class="email-option" onclick={openMailClient}>
								{t('contact.openClient')}
							</button>
						</div>
					{/if}
				{/if}

				{#if githubUrl}
					<a
						href={githubUrl}
						target="_blank"
						rel="noopener external"
						class="card-link"
						class:disabled={emailMenu}
					>
						<span class="link-label">{t('contact.github')}</span>
						<span class="link-value">{githubLabel}</span>
					</a>
				{/if}
				{#if linkedinUrl}
					<a
						href={linkedinUrl}
						target="_blank"
						rel="noopener external"
						class="card-link"
						class:disabled={emailMenu}
					>
						<span class="link-label">{t('contact.linkedin')}</span>
						<span class="link-value">{name}</span>
					</a>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.contact-wrapper {
		position: relative;
	}

	.contact-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: var(--radius-button);
		background: transparent;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.contact-trigger:hover {
		background: var(--color-taskbar-entry-hover);
		color: var(--color-text-primary);
	}

	.card {
		position: absolute;
		bottom: calc(100% + var(--space-2));
		right: 0;
		width: 260px;
		background: var(--color-window-bg);
		border: 1px solid var(--color-window-border);
		border-radius: var(--radius-window);
		box-shadow: var(--shadow-window-focused);
		padding: var(--space-4);
		z-index: 10002;
		animation: card-in var(--duration-fast) var(--ease-out);
	}

	@keyframes card-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
	}

	.card-header {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-bottom: var(--space-3);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.card-name {
		font-size: var(--text-base);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.card-title {
		font-size: var(--text-xs);
		color: var(--color-accent);
	}

	.card-links {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		position: relative;
	}

	.card-link {
		display: flex;
		flex-direction: column;
		gap: 1px;
		text-decoration: none;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-button);
		transition: background var(--transition-fast);
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		font-family: inherit;
	}

	.card-link:hover {
		background: var(--color-explorer-item-hover);
	}

	.link-label {
		font-size: 0.6rem;
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.link-value {
		font-size: var(--text-sm);
		color: var(--color-text-primary);
	}

	.card-link.disabled {
		opacity: 0.3;
		pointer-events: none;
	}

	.email-menu {
		position: absolute;
		left: var(--space-2);
		right: var(--space-2);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-2);
		background: var(--color-window-header-focused);
		border: 1px solid var(--color-window-border-focused);
		border-radius: var(--radius-button);
		box-shadow: var(--shadow-window);
		z-index: 1;
		animation: card-in var(--duration-fast) var(--ease-out);
	}

	.email-option {
		padding: var(--space-1) var(--space-2);
		border: none;
		border-radius: var(--radius-button);
		background: none;
		color: var(--color-text-secondary);
		font-family: inherit;
		font-size: var(--text-xs);
		cursor: pointer;
		text-align: left;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.email-option:hover {
		background: var(--color-explorer-item-active);
		color: var(--color-text-primary);
	}
</style>
