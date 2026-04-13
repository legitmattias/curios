export type Mode = 'dark' | 'light';
export type Accent = 'teal' | 'purple' | 'amber' | 'slate';

const MODES: Mode[] = ['dark', 'light'];
const ACCENTS: Accent[] = ['teal', 'purple', 'amber', 'slate'];

const MODE_KEY = 'curios-mode';
const ACCENT_KEY = 'curios-accent';
const HC_KEY = 'curios-high-contrast';
const OLD_THEME_KEY = 'curios-theme';

function getSystemModePreference(): Mode {
	if (typeof window === 'undefined') return 'dark';
	if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
	return 'dark';
}

function getSystemHcPreference(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-contrast: more)').matches;
}

/** Migrate from old single-key format */
function migrateOldTheme(): { mode: Mode; accent: Accent; highContrast: boolean } | null {
	if (typeof window === 'undefined') return null;
	const old = localStorage.getItem(OLD_THEME_KEY);
	if (!old) return null;

	const map: Record<string, { mode: Mode; accent: Accent; highContrast: boolean }> = {
		dark: { mode: 'dark', accent: 'teal', highContrast: false },
		purple: { mode: 'dark', accent: 'purple', highContrast: false },
		amber: { mode: 'dark', accent: 'amber', highContrast: false },
		slate: { mode: 'dark', accent: 'slate', highContrast: false },
		light: { mode: 'light', accent: 'teal', highContrast: false },
		'high-contrast': { mode: 'dark', accent: 'teal', highContrast: true }
	};

	const result = map[old] ?? null;
	localStorage.removeItem(OLD_THEME_KEY);
	return result;
}

/** Migrate from two-key format (mode included high-contrast as a mode) */
function migrateOldModeKey(): { mode: Mode; highContrast: boolean } | null {
	if (typeof window === 'undefined') return null;
	const stored = localStorage.getItem(MODE_KEY);
	if (stored === 'high-contrast') {
		localStorage.setItem(MODE_KEY, 'dark');
		localStorage.setItem(HC_KEY, 'true');
		return { mode: 'dark', highContrast: true };
	}
	return null;
}

function loadMode(): Mode {
	if (typeof window === 'undefined') return 'dark';
	const migrated = migrateOldTheme();
	if (migrated) {
		localStorage.setItem(MODE_KEY, migrated.mode);
		localStorage.setItem(ACCENT_KEY, migrated.accent);
		localStorage.setItem(HC_KEY, String(migrated.highContrast));
		return migrated.mode;
	}
	const hcMigrated = migrateOldModeKey();
	if (hcMigrated) return hcMigrated.mode;
	const stored = localStorage.getItem(MODE_KEY) as Mode | null;
	if (stored && MODES.includes(stored)) return stored;
	return getSystemModePreference();
}

function loadAccent(): Accent {
	if (typeof window === 'undefined') return 'teal';
	const stored = localStorage.getItem(ACCENT_KEY) as Accent | null;
	if (stored && ACCENTS.includes(stored)) return stored;
	return 'teal';
}

function loadHighContrast(): boolean {
	if (typeof window === 'undefined') return false;
	const stored = localStorage.getItem(HC_KEY);
	if (stored === 'true') return true;
	if (stored === 'false') return false;
	return getSystemHcPreference();
}

function applyMode(mode: Mode): void {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	for (const m of MODES) root.classList.remove(`mode-${m}`);
	if (mode !== 'dark') root.classList.add(`mode-${mode}`);
	localStorage.setItem(MODE_KEY, mode);
}

function applyAccent(accent: Accent): void {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	for (const a of ACCENTS) root.classList.remove(`accent-${a}`);
	if (accent !== 'teal') root.classList.add(`accent-${accent}`);
	localStorage.setItem(ACCENT_KEY, accent);
}

function applyHighContrast(enabled: boolean): void {
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('high-contrast', enabled);
	localStorage.setItem(HC_KEY, String(enabled));
}

class ThemeStore {
	mode = $state<Mode>(loadMode());
	accent = $state<Accent>(loadAccent());
	highContrast = $state<boolean>(loadHighContrast());

	constructor() {
		applyMode(this.mode);
		applyAccent(this.accent);
		applyHighContrast(this.highContrast);
	}

	cycleMode(): void {
		const index = MODES.indexOf(this.mode);
		this.mode = MODES[(index + 1) % MODES.length];
		applyMode(this.mode);
	}

	setMode(mode: Mode): void {
		this.mode = mode;
		applyMode(this.mode);
	}

	setAccent(accent: Accent): void {
		this.accent = accent;
		applyAccent(this.accent);
	}

	toggleHighContrast(): void {
		this.highContrast = !this.highContrast;
		applyHighContrast(this.highContrast);
	}

	setHighContrast(enabled: boolean): void {
		this.highContrast = enabled;
		applyHighContrast(this.highContrast);
	}
}

export const themeStore = new ThemeStore();
