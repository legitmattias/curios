export type CardId = 'ask' | 'about' | 'growing' | 'built';

// History-state marker so hardware/gesture back on the browser closes the
// expanded card instead of navigating away.
interface ExpandedState {
	curiosExpanded: CardId;
}

function isExpandedState(state: unknown): state is ExpandedState {
	return typeof state === 'object' && state !== null && 'curiosExpanded' in state;
}

// Singleton store for the mobile shell. Tracks which card is centered in
// the carousel and whether a card has been expanded to full screen.
class MobileStore {
	activeIndex = $state(0);
	expandedCard = $state<CardId | null>(null);

	private setExpanded(next: CardId | null) {
		const prefersReduced =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!prefersReduced && typeof document !== 'undefined' && document.startViewTransition) {
			document.startViewTransition(() => {
				this.expandedCard = next;
			});
		} else {
			this.expandedCard = next;
		}
	}

	expand(id: CardId) {
		if (typeof history !== 'undefined') {
			history.pushState({ curiosExpanded: id } satisfies ExpandedState, '');
		}
		this.setExpanded(id);
	}

	collapse() {
		// When our pushState marker is in the history, go back one step and
		// let the popstate handler clear the expanded state — keeps the
		// browser's back stack consistent with the UI.
		if (typeof history !== 'undefined' && isExpandedState(history.state)) {
			history.back();
		} else {
			this.setExpanded(null);
		}
	}

	// Called by the MobileShell popstate listener.
	onHistoryChange(state: unknown) {
		if (isExpandedState(state)) {
			this.setExpanded(state.curiosExpanded);
		} else {
			this.setExpanded(null);
		}
	}
}

export const mobileStore = new MobileStore();
