export type CardId = 'ask' | 'about' | 'building' | 'built';

// Singleton store for the mobile shell. Tracks which card is centered in
// the carousel and whether a card has been expanded to full screen.
class MobileStore {
	activeIndex = $state(0);
	expandedCard = $state<CardId | null>(null);

	expand(id: CardId) {
		if (typeof document !== 'undefined' && document.startViewTransition) {
			document.startViewTransition(() => {
				this.expandedCard = id;
			});
		} else {
			this.expandedCard = id;
		}
	}

	collapse() {
		if (typeof document !== 'undefined' && document.startViewTransition) {
			document.startViewTransition(() => {
				this.expandedCard = null;
			});
		} else {
			this.expandedCard = null;
		}
	}
}

export const mobileStore = new MobileStore();
