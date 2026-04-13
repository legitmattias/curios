export type Mode = 'dark' | 'light' | 'high-contrast';
export type Accent = 'teal' | 'purple' | 'amber' | 'slate';

const MODES: Mode[] = ['dark', 'light', 'high-contrast'];
const ACCENTS: Accent[] = ['teal', 'purple', 'amber', 'slate'];

const MODE_KEY = 'curios-mode';
const ACCENT_KEY = 'curios-accent';
const OLD_THEME_KEY = 'curios-theme';

function getSystemModePreference(): Mode {
	if (typeof window === 'undefined') return 'dark';
	if (window.matchMedia('(prefers-contrast: more)').matches) return 'high-contrast';
	if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
	return 'dark';
}

/** Migrate from old single-key format to mode+accent */
function migrateOldTheme(): { mode: Mode; accent: Accent } | null {
	if (typeof window === 'undefined') return null;
	const old = localStorage.getItem(OLD_THEME_KEY);
	if (!old) return null;

	const map: Record<string, { mode: Mode; accent: Accent }> = {
		dark: { mode: 'dark', accent: 'teal' },
		purple: { mode: 'dark', accent: 'purple' },
		amber: { mode: 'dark', accent: 'amber' },
		slate: { mode: 'dark', accent: 'slate' },
		light: { mode: 'light', accent: 'teal' },
		'high-contrast': { mode: 'high-contrast', accent: 'teal' }
	};

	const result = map[old] ?? null;
	localStorage.removeItem(OLD_THEME_KEY);
	return result;
}

function loadMode(): Mode {
	if (typeof window === 'undefined') return 'dark';
	const migrated = migrateOldTheme();
	if (migrated) {
		localStorage.setItem(MODE_KEY, migrated.mode);
		localStorage.setItem(ACCENT_KEY, migrated.accent);
		return migrated.mode;
	}
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

class ThemeStore {
	mode = $state<Mode>(loadMode());
	accent = $state<Accent>(loadAccent());

	constructor() {
		applyMode(this.mode);
		applyAccent(this.accent);
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
}

export const themeStore = new ThemeStore();
