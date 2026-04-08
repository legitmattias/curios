import { localeStore } from './locale-store.svelte.js';
import en from '../i18n/en.json';
import sv from '../i18n/sv.json';

const translations: Record<string, Record<string, string>> = { en, sv };

/**
 * Translate a key to the current locale.
 * Falls back to English, then to the raw key.
 *
 * Reactive: reads localeStore.current ($state),
 * so Svelte re-renders when the locale changes.
 */
export function t(key: string): string {
	const locale = localeStore.current;
	return translations[locale]?.[key] ?? translations.en[key] ?? key;
}
