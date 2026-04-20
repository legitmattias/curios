/**
 * Format a CV-style date with month precision fallback.
 *
 * Convention: the seed stores year-only dates as `YYYY-01-01` and
 * month-only dates as `YYYY-MM-01`. This formatter respects that
 * convention and avoids rendering a literal "Jan" when only the year
 * was known.
 */
export function formatCvDate(date: string | null, locale: string, presentLabel: string): string {
	if (!date) return presentLabel;
	const [yearStr, monthStr, dayStr] = date.split('-');
	const monthNum = parseInt(monthStr ?? '1', 10);
	const dayNum = parseInt(dayStr ?? '1', 10);
	if (dayNum === 1 && monthNum === 1) return yearStr;
	const intlLocale = locale === 'sv' ? 'sv-SE' : 'en-US';
	return new Date(date).toLocaleDateString(intlLocale, {
		year: 'numeric',
		month: 'short'
	});
}
