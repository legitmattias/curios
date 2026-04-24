<script lang="ts">
	import type { Component } from 'svelte';
	import { onMount } from 'svelte';
	import { mobileStore, type CardId } from './mobile-store.svelte.js';
	import Card from './Card.svelte';

	export interface CarouselCard {
		id: CardId;
		title: string;
		icon: Component<{ size?: number }>;
	}

	let { cards }: { cards: CarouselCard[] } = $props();

	// Triple the list so the user can spin endlessly — when they drift into
	// the first or last copy, we silently teleport them to the equivalent
	// slide in the middle copy. Cards are identical in every copy so the
	// jump is invisible.
	const COPIES = 3;
	const displayList = $derived(
		Array.from({ length: cards.length * COPIES }, (_, i) => ({
			card: cards[i % cards.length],
			displayIndex: i
		}))
	);

	let trackEl = $state<HTMLDivElement | null>(null);
	const slideEls: HTMLDivElement[] = [];
	const dotEls: HTMLButtonElement[] = [];
	// Suppress the active-index update while programmatically teleporting,
	// otherwise the teleport causes a flicker in the dot indicator.
	let teleporting = false;
	let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		// Start centered on the first card of the MIDDLE copy.
		centerDisplayIndex(cards.length, 'instant');
	});

	function centerDisplayIndex(displayIdx: number, behavior: ScrollBehavior = 'smooth') {
		const el = slideEls[displayIdx];
		if (!el) return;
		el.scrollIntoView({ behavior, inline: 'center', block: 'nearest' });
	}

	// Returns [closestDisplayIdx, logicalIdx (0..N-1)].
	function findClosestSlide(): [number, number] {
		if (!trackEl) return [cards.length, 0];
		const mid = trackEl.scrollLeft + trackEl.clientWidth / 2;
		let closest = 0;
		let closestDist = Infinity;
		for (let i = 0; i < slideEls.length; i++) {
			const el = slideEls[i];
			if (!el) continue;
			const center = el.offsetLeft + el.offsetWidth / 2;
			const dist = Math.abs(center - mid);
			if (dist < closestDist) {
				closestDist = dist;
				closest = i;
			}
		}
		return [closest, closest % cards.length];
	}

	function onScroll() {
		if (teleporting) return;
		const [, logical] = findClosestSlide();
		if (logical !== mobileStore.activeIndex) {
			mobileStore.activeIndex = logical;
		}
		// Debounce a scrollend detection — when scrolling settles in an edge
		// copy, teleport to the matching slide in the middle copy.
		if (scrollEndTimer) clearTimeout(scrollEndTimer);
		scrollEndTimer = setTimeout(maybeTeleport, 140);
	}

	function maybeTeleport() {
		const [closest, logical] = findClosestSlide();
		const middleIdx = cards.length + logical;
		if (closest === middleIdx) return;
		teleporting = true;
		centerDisplayIndex(middleIdx, 'instant');
		// One frame later: allow scroll events again.
		requestAnimationFrame(() => {
			teleporting = false;
		});
	}

	function scrollToLogical(logical: number) {
		// Scroll to the copy nearest to where the user currently is, so the
		// animation feels natural (user doesn't see a long jump).
		const [closest] = findClosestSlide();
		const currentCopy = Math.floor(closest / cards.length);
		centerDisplayIndex(currentCopy * cards.length + logical);
	}

	function onDotKey(e: KeyboardEvent, currentLogical: number) {
		const n = cards.length;
		let target: number | null = null;
		if (e.key === 'ArrowLeft') target = (currentLogical - 1 + n) % n;
		else if (e.key === 'ArrowRight') target = (currentLogical + 1) % n;
		else if (e.key === 'Home') target = 0;
		else if (e.key === 'End') target = n - 1;
		if (target !== null) {
			e.preventDefault();
			scrollToLogical(target);
			queueMicrotask(() => dotEls[target]?.focus());
		}
	}
</script>

<div class="wrap">
	<div
		class="track"
		role="region"
		aria-roledescription="carousel"
		aria-label="CuriOS"
		onscroll={onScroll}
		bind:this={trackEl}
	>
		{#each displayList as entry (entry.displayIndex)}
			<div class="slide" bind:this={slideEls[entry.displayIndex]}>
				<Card
					id={entry.card.id}
					index={entry.displayIndex}
					title={entry.card.title}
					icon={entry.card.icon}
					isActive={mobileStore.activeIndex === entry.displayIndex % cards.length}
					onActivate={() => scrollToLogical(entry.displayIndex % cards.length)}
					onOpen={(id) => mobileStore.expand(id)}
				/>
			</div>
		{/each}
	</div>

	<div class="dots" aria-label="Card indicator">
		{#each cards as card, i (card.id)}
			<button
				class="dot"
				class:active={mobileStore.activeIndex === i}
				type="button"
				aria-label={card.title}
				aria-current={mobileStore.activeIndex === i ? 'true' : undefined}
				tabindex={mobileStore.activeIndex === i ? 0 : -1}
				onclick={() => scrollToLogical(i)}
				onkeydown={(e) => onDotKey(e, i)}
				bind:this={dotEls[i]}
			></button>
		{/each}
	</div>
</div>

<style>
	.wrap {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 20px;
		width: 100%;
		height: 100%;
		padding-block: 14px;
	}

	.track {
		display: flex;
		overflow-x: auto;
		overflow-y: hidden;
		scroll-snap-type: x mandatory;
		gap: var(--mobile-gap);
		padding-inline: calc((100% - var(--mobile-slide-size)) / 2);
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
	}

	.track::-webkit-scrollbar {
		display: none;
	}

	.slide {
		flex: 0 0 var(--mobile-slide-size);
		aspect-ratio: 1 / 1;
		scroll-snap-align: center;
		scroll-snap-stop: always;
	}

	.dots {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding-bottom: 4px;
	}

	.dot {
		width: 7px;
		height: 7px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: var(--color-text-muted);
		opacity: 0.35;
		cursor: pointer;
		transition:
			opacity var(--mobile-ease-dur, 220ms) var(--mobile-ease, ease-out),
			transform var(--mobile-ease-dur, 220ms) var(--mobile-ease, ease-out),
			background var(--mobile-ease-dur, 220ms) var(--mobile-ease, ease-out);
	}

	.dot.active {
		background: var(--color-accent);
		opacity: 1;
		transform: scale(1.35);
	}
</style>
