export type Locale = 'en' | 'sv';

const LOCALES: Locale[] = ['en', 'sv'];
const STORAGE_KEY = 'curios-locale';

function detectLocale(): Locale {
	if (typeof navigator === 'undefined') return 'en';
	const lang = navigator.language.toLowerCase();
	if (lang.startsWith('sv')) return 'sv';
	return 'en';
}

function loadLocale(): Locale {
	if (typeof window === 'undefined') return 'en';
	const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
	if (stored && LOCALES.includes(stored)) return stored;
	return detectLocale();
}

class LocaleStore {
	current = $state<Locale>(loadLocale());

	set(locale: Locale): void {
		this.current = locale;
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, locale);
			document.documentElement.lang = locale;
		}
	}

	toggle(): void {
		this.set(this.current === 'en' ? 'sv' : 'en');
	}
}

export const localeStore = new LocaleStore();

// Set initial lang attribute
if (typeof document !== 'undefined') {
	document.documentElement.lang = localeStore.current;
}
