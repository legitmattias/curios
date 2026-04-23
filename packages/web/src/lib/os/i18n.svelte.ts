import { localeStore } from './locale-store.svelte.js';
import en from '../i18n/en.json';
import sv from '../i18n/sv.json';

const translations: Record<string, Record<string, string>> = { en, sv };

/**
 * Translate a key to the current locale.
 * Falls back to English, then to the raw key.
 *
 * `params` interpolates `{placeholders}` in the translated string
 * (e.g. `t('chat.welcome', { name: 'Mattias' })`). Unknown placeholders
 * are left as-is so missing params degrade visibly, not silently.
 *
 * Reactive: reads localeStore.current ($state),
 * so Svelte re-renders when the locale changes.
 */
export function t(key: string, params?: Record<string, string>): string {
	const locale = localeStore.current;
	const raw = translations[locale]?.[key] ?? translations.en[key] ?? key;
	if (!params) return raw;
	return raw.replace(/\{(\w+)\}/g, (match, placeholder: string) =>
		placeholder in params ? params[placeholder] : match
	);
}
