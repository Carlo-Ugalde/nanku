/**
 * Single source of truth for when the restaurant is closed.
 * Keep in sync with the Google Business Profile hours.
 */

/**
 * Weekdays closed every week (0 = Sunday … 6 = Saturday).
 * Currently none. To close a weekday every week, add its number here (e.g. [3] = Wednesdays).
 */
export const CLOSED_WEEKDAYS: number[] = []

/**
 * Temporary closures (inclusive, YYYY-MM-DD, Costa Rica dates).
 * Past ranges are harmless and can be left in place or removed.
 */
export const CLOSURE_RANGES: { from: string; to: string; es: string; en: string }[] = [
  {
    from: '2026-10-12',
    to: '2026-10-25',
    es: 'Cerrado del 12 al 25 de octubre — reabrimos el lunes 26.',
    en: 'Closed October 12–25 — we reopen on Monday, October 26.',
  },
]

/** True when the given calendar date (YYYY-MM-DD) is a closed day. */
export function isClosedDate(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return false
  // Build the date in UTC so the weekday doesn't depend on the server timezone.
  if (CLOSED_WEEKDAYS.includes(new Date(Date.UTC(y, m - 1, d)).getUTCDay())) return true
  // YYYY-MM-DD strings compare correctly as plain strings.
  return CLOSURE_RANGES.some(r => dateStr >= r.from && dateStr <= r.to)
}

/** Notice for the next/active temporary closure (ends on or after `todayStr`), or null. */
export function closureNotice(lang: 'en' | 'es', todayStr: string): string | null {
  const r = CLOSURE_RANGES.find(range => range.to >= todayStr)
  return r ? (lang === 'es' ? r.es : r.en) : null
}
