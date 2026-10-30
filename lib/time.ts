// Reservation times are stored as free text by three different writers:
// the web form ("7:00 PM"), the admin / WhatsApp bot ("19:00"), and legacy rows.
// Never compare them as strings — always go through these helpers.

const TIME_RE = /^\s*(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([ap])\.?\s*m?\.?\s*$/i
const TIME_24_RE = /^\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*$/

/** "7:00 PM" | "19:00" | "19:00:00" | "7pm" → minutes since midnight, or null. */
export function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null

  const m12 = TIME_RE.exec(time)
  if (m12) {
    const h = parseInt(m12[1], 10)
    const min = m12[2] ? parseInt(m12[2], 10) : 0
    if (h < 1 || h > 12 || min > 59) return null
    const pm = m12[3].toLowerCase() === 'p'
    return ((h % 12) + (pm ? 12 : 0)) * 60 + min
  }

  const m24 = TIME_24_RE.exec(time)
  if (m24) {
    const h = parseInt(m24[1], 10)
    const min = parseInt(m24[2], 10)
    if (h > 23 || min > 59) return null
    return h * 60 + min
  }

  return null
}

/** Canonical "HH:MM" (matches LUNCH_SLOTS / DINNER_SLOTS). Unparseable input is returned untouched. */
export function to24h(time: string | null | undefined): string {
  const mins = parseTimeToMinutes(time)
  if (mins === null) return time ?? ''
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

export function sameSlot(a: string | null | undefined, b: string | null | undefined): boolean {
  const ma = parseTimeToMinutes(a)
  const mb = parseTimeToMinutes(b)
  return ma !== null && ma === mb
}

/** "3-4" → 4, "7" → 7, "5 people" → 5. Upper bound of a range. Null when empty / zero. */
export function parsePartySize(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  const nums = String(raw).match(/\d+/g)
  if (!nums) return null
  const n = Math.max(...nums.map(x => parseInt(x, 10)))
  return n >= 1 ? n : null
}
