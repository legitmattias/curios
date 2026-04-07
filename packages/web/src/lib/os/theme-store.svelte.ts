export type Theme = 'dark' | 'light' | 'high-contrast';

const THEMES: Theme[] = ['dark', 'light', 'high-contrast'];
const STORAGE_KEY = 'curios-theme';

function getSystemPreference(): Theme {
	if (typeof window === 'undefined') return 'dark';
	if (window.matchMedia('(prefers-contrast: more)').matches) return 'high-contrast';
	if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
	return 'dark';
}

function loadTheme(): Theme {
	if (typeof window === 'undefined') return 'dark';
	const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
	if (stored && THEMES.includes(stored)) return stored;
	return getSystemPreference();
}

function applyTheme(theme: Theme): void {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	// Remove all theme classes
	for (const t of THEMES) {
		root.classList.remove(`theme-${t}`);
	}
	// Dark is the default (no class needed), others get a class
	if (theme !== 'dark') {
		root.classList.add(`theme-${theme}`);
	}
}

class ThemeStore {
	current = $state<Theme>(loadTheme());

	constructor() {
		$effect(() => {
			applyTheme(this.current);
			localStorage.setItem(STORAGE_KEY, this.current);
		});
	}

	cycle(): void {
		const index = THEMES.indexOf(this.current);
		this.current = THEMES[(index + 1) % THEMES.length];
	}

	set(theme: Theme): void {
		this.current = theme;
	}
}

export const themeStore = new ThemeStore();
