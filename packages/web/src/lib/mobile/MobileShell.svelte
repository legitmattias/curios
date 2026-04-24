<script lang="ts">
	import type { Component } from 'svelte';
	import { t } from '$lib/os/i18n.svelte.js';
	import { profileStore } from '$lib/os/profile-store.svelte.js';
	import { localeStore } from '$lib/os/locale-store.svelte.js';
	import IconChat from '$lib/components/icons/IconChat.svelte';
	import IconPerson from './icons/IconPerson.svelte';
	import IconHammer from './icons/IconHammer.svelte';
	import IconStack from './icons/IconStack.svelte';
	import IconGlobe from './icons/IconGlobe.svelte';
	import Carousel, { type CarouselCard } from './Carousel.svelte';
	import ExpandedCard from './ExpandedCard.svelte';
	import AboutCard from './cards/AboutCard.svelte';
	import BuiltCard from './cards/BuiltCard.svelte';
	import { mobileStore, type CardId } from './mobile-store.svelte.js';

	const name = $derived(profileStore.data?.name ?? '');
	const title = $derived(profileStore.data?.title ?? '');

	// Icons are static; titles re-derive when the locale changes.
	const icons: Record<CardId, Component<{ size?: number }>> = {
		ask: IconChat,
		about: IconPerson,
		building: IconHammer,
		built: IconStack
	};

	const meta = $derived<Record<CardId, { title: string; icon: Component<{ size?: number }> }>>({
		ask: { title: t('mobile.card.ask'), icon: icons.ask },
		about: { title: t('mobile.card.about'), icon: icons.about },
		building: { title: t('mobile.card.building'), icon: icons.building },
		built: { title: t('mobile.card.built'), icon: icons.built }
	});

	const cards = $derived<CarouselCard[]>([
		{ id: 'ask', title: meta.ask.title, icon: meta.ask.icon },
		{ id: 'about', title: meta.about.title, icon: meta.about.icon },
		{ id: 'building', title: meta.building.title, icon: meta.building.icon },
		{ id: 'built', title: meta.built.title, icon: meta.built.icon }
	]);

	function switchToDesktop() {
		window.location.href = '/?force=desktop';
	}
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<title>{name ? `${name} — ${title}` : 'CuriOS'}</title>
</svelte:head>

<div class="shell">
	<header class="topbar">
		<div class="identity">
			<span class="name">{name}</span>
			<span class="role">{title}</span>
		</div>

		<button
			class="lang-toggle"
			type="button"
			onclick={() => localeStore.toggle()}
			aria-label={t('mobile.switchLanguage')}
		>
			<IconGlobe size={14} />
			<span class="lang-code">{localeStore.current.toUpperCase()}</span>
		</button>
	</header>

	<main class="stage">
		<Carousel {cards} />
	</main>

	<footer class="footer">
		<button class="desktop-link" type="button" onclick={switchToDesktop}>
			{t('mobile.desktopVersion')}
		</button>
	</footer>
</div>

{#if mobileStore.expandedCard}
	{@const expId = mobileStore.expandedCard}
	<ExpandedCard id={expId} title={meta[expId].title} icon={meta[expId].icon}>
		{#if expId === 'ask'}
			<p class="placeholder">Full-screen Ask (Phase D wires real chat here).</p>
		{:else if expId === 'about'}
			<AboutCard />
		{:else if expId === 'building'}
			<p class="placeholder">Full Building view (Phase E).</p>
		{:else}
			<BuiltCard />
		{/if}
	</ExpandedCard>
{/if}

<style>
	.shell {
		position: fixed;
		inset: 0;
		display: grid;
		grid-template-rows: auto 1fr auto;
		background: var(--gradient-desktop, var(--color-desktop-bg));
		color: var(--color-text-primary);
		font-family: var(--font-sans);
		height: 100svh;
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: calc(env(safe-area-inset-top) + 10px) var(--space-3) 10px;
		border-bottom: 1px solid var(--color-explorer-border);
		background: var(--color-window-bg);
	}

	.identity {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.name {
		font-size: 14px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--color-text-primary);
	}

	.role {
		font-size: 11px;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		letter-spacing: 0.04em;
	}

	.lang-toggle {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 9px;
		background: transparent;
		color: var(--color-text-secondary);
		border: 1px solid var(--color-explorer-border);
		border-radius: 999px;
		cursor: pointer;
		transition:
			color var(--transition-fast),
			border-color var(--transition-fast);
	}

	.lang-toggle:active,
	.lang-toggle:focus-visible {
		color: var(--color-accent);
		border-color: var(--color-accent);
		outline: none;
	}

	.lang-code {
		font-family: var(--font-mono);
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
	}

	.stage {
		min-height: 0;
		overflow: hidden;
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px var(--space-3) calc(env(safe-area-inset-bottom) + 8px);
		border-top: 1px solid var(--color-explorer-border);
		background: var(--color-window-bg);
	}

	.desktop-link {
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		background: transparent;
		border: none;
		padding: 4px 8px;
		cursor: pointer;
	}

	.desktop-link:active {
		color: var(--color-accent);
	}

	.placeholder {
		margin: 0;
	}
</style>
