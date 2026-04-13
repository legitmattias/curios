export type Theme = 'dark' | 'purple' | 'amber' | 'slate' | 'light' | 'high-contrast';

const THEMES: Theme[] = ['dark', 'purple', 'amber', 'slate', 'light', 'high-contrast'];

// Base modes for taskbar toggle and terminal — accent themes are settings-only
const BASE_MODES: Theme[] = ['dark', 'light', 'high-contrast'];
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
	for (const t of THEMES) {
		root.classList.remove(`theme-${t}`);
	}
	if (theme !== 'dark') {
		root.classList.add(`theme-${theme}`);
	}
	localStorage.setItem(STORAGE_KEY, theme);
}

class ThemeStore {
	current = $state<Theme>(loadTheme());

	constructor() {
		// Apply immediately on creation
		applyTheme(this.current);
	}

	/** Cycle through base modes only (dark → light → high-contrast) */
	cycle(): void {
		const currentBase = BASE_MODES.includes(this.current) ? this.current : 'dark';
		const index = BASE_MODES.indexOf(currentBase);
		this.current = BASE_MODES[(index + 1) % BASE_MODES.length];
		applyTheme(this.current);
	}

	set(theme: Theme): void {
		this.current = theme;
		applyTheme(this.current);
	}
}

export const themeStore = new ThemeStore();
