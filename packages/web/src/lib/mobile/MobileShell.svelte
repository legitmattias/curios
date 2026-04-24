<script lang="ts">
	import type { Component } from 'svelte';
	import { onMount } from 'svelte';
	import { t } from '$lib/os/i18n.svelte.js';
	import { profileStore } from '$lib/os/profile-store.svelte.js';
	import { localeStore } from '$lib/os/locale-store.svelte.js';
	import { themeStore, type Accent } from '$lib/os/theme-store.svelte.js';
	import IconChat from '$lib/components/icons/IconChat.svelte';
	import IconPerson from './icons/IconPerson.svelte';
	import IconSprout from './icons/IconSprout.svelte';
	import IconStack from './icons/IconStack.svelte';
	import IconGlobe from './icons/IconGlobe.svelte';
	import Carousel, { type CarouselCard } from './Carousel.svelte';
	import ExpandedCard from './ExpandedCard.svelte';
	import AboutCard from './cards/AboutCard.svelte';
	import BuiltCard from './cards/BuiltCard.svelte';
	import GrowingCard from './cards/GrowingCard.svelte';
	import MobileChat from './cards/MobileChat.svelte';
	import { mobileStore, type CardId } from './mobile-store.svelte.js';

	const name = $derived(profileStore.data?.name ?? '');
	const title = $derived(profileStore.data?.title ?? '');

	// Icons are static; titles re-derive when the locale changes.
	const icons: Record<CardId, Component<{ size?: number }>> = {
		ask: IconChat,
		about: IconPerson,
		growing: IconSprout,
		built: IconStack
	};

	const meta = $derived<Record<CardId, { title: string; icon: Component<{ size?: number }> }>>({
		ask: { title: t('mobile.card.ask'), icon: icons.ask },
		about: { title: t('mobile.card.about'), icon: icons.about },
		growing: { title: t('mobile.card.growing'), icon: icons.growing },
		built: { title: t('mobile.card.built'), icon: icons.built }
	});

	const cards = $derived<CarouselCard[]>([
		{ id: 'ask', title: meta.ask.title, icon: meta.ask.icon },
		{ id: 'about', title: meta.about.title, icon: meta.about.icon },
		{ id: 'growing', title: meta.growing.title, icon: meta.growing.icon },
		{ id: 'built', title: meta.built.title, icon: meta.built.icon }
	]);

	const ACCENTS: Accent[] = ['teal', 'purple', 'amber', 'slate'];
	function cycleAccent() {
		const idx = ACCENTS.indexOf(themeStore.accent);
		themeStore.setAccent(ACCENTS[(idx + 1) % ACCENTS.length]);
	}

	onMount(() => {
		const handler = (e: PopStateEvent) => mobileStore.onHistoryChange(e.state);
		window.addEventListener('popstate', handler);

		// The mobile shell is a dark-only design — light mode breaks the
		// visual identity. Strip the class while we're mounted, restore on
		// unmount so the user's stored preference survives for desktop.
		const root = document.documentElement;
		const hadLight = root.classList.contains('mode-light');
		const hadHc = root.classList.contains('high-contrast');
		root.classList.remove('mode-light', 'high-contrast');

		return () => {
			window.removeEventListener('popstate', handler);
			if (hadLight) root.classList.add('mode-light');
			if (hadHc) root.classList.add('high-contrast');
		};
	});
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

		<div class="head-actions">
			<button
				class="accent-toggle"
				type="button"
				onclick={cycleAccent}
				aria-label={t('mobile.cycleAccent')}
			>
				<span class="swatch"></span>
			</button>

			<button
				class="lang-toggle"
				type="button"
				onclick={() => localeStore.toggle()}
				aria-label={t('mobile.switchLanguage')}
			>
				<IconGlobe size={14} />
				<span class="lang-code">{localeStore.current.toUpperCase()}</span>
			</button>
		</div>
	</header>

	<main class="stage">
		<Carousel {cards} />
	</main>
</div>

{#if mobileStore.expandedCard}
	{@const expId = mobileStore.expandedCard}
	<ExpandedCard
		id={expId}
		title={meta[expId].title}
		icon={meta[expId].icon}
		fullBleed={expId === 'ask'}
	>
		{#if expId === 'ask'}
			<MobileChat />
		{:else if expId === 'about'}
			<AboutCard />
		{:else if expId === 'growing'}
			<GrowingCard />
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
		grid-template-rows: auto 1fr;
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

	.head-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.accent-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		background: transparent;
		border: 1px solid var(--color-explorer-border);
		border-radius: 50%;
		cursor: pointer;
		transition: border-color var(--transition-fast);
	}

	.accent-toggle:active,
	.accent-toggle:focus-visible {
		border-color: var(--color-accent);
		outline: none;
	}

	.swatch {
		display: block;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--color-accent);
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
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
