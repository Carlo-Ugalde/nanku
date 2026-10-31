// Pure table-assignment logic for automatic reservation acceptance.
// No I/O here — lib/auto-accept.ts feeds it data and persists the result.

import {
  ALL_TABLES,
  SALON_TABLES,
  TERRAZA_TABLES,
  TABLE_COMBINATIONS,
  expandTableIds,
} from './tables'

/** How long a party holds a table. Two bookings conflict if their starts are closer than this. */
export const SEATING_MINUTES = 120
/** Auto-accept only inside service hours; anything else goes to a human. Mirrors the WhatsApp bot (15:00–21:30). */
export const FIRST_SEATING_MIN = 15 * 60
export const LAST_SEATING_MIN = 21 * 60 + 30

export type Zone = 'salon' | 'terraza'

export type Booking = {
  startMin: number
  tableIds: string[]
}

export type Assignment = {
  zone: Zone
  tableIds: string[]
  capacity: number
  /** Human-readable remark when the pick is not the textbook one (e.g. terraza was full). */
  remark?: string
}

export type RejectionCode = 'bad_time' | 'bad_party' | 'outside_hours' | 'too_large' | 'full' | 'past' | 'closed'

export type Rejection = { code: RejectionCode; message: string }

export type AssignResult =
  | { ok: true; assignment: Assignment }
  | { ok: false; rejection: Rejection }

type Unit = { ids: string[]; capacity: number; zone: Zone; order: number }

// A "unit" is the smallest thing we can hand out: one table, or the 06SA+07SA long table.
const SINGLES: Unit[] = [
  ...SALON_TABLES.filter(t => !t.hidden).map(t => ({ ids: expandTableIds([t.id]), capacity: t.capacity, zone: 'salon' as const })),
  ...TERRAZA_TABLES.map(t => ({ ids: [t.id], capacity: t.capacity, zone: 'terraza' as const })),
].map((u, order) => ({ ...u, order }))

const COMBOS: Unit[] = TABLE_COMBINATIONS.map((c, order) => ({
  ids: c.ids,
  capacity: c.capacity,
  zone: 'salon' as const,
  order,
}))

// Neighbouring pairs inside each 3-table combo (combo ids are listed in physical order).
// Staff already seat 9-12 pax on 01SA+02SA; a 16p combo for them wastes 4+ seats.
const PAIRS: Unit[] = TABLE_COMBINATIONS
  .filter(c => c.ids.length > 2)
  .flatMap(c => c.ids.slice(0, -1).map(id => [id, c.ids[c.ids.indexOf(id) + 1]]))
  .map((ids, order) => ({
    ids,
    capacity: ids.reduce((sum, id) => sum + (ALL_TABLES.find(t => t.id === id)?.capacity ?? 0), 0),
    zone: 'salon' as const,
    order,
  }))

const MAX_SINGLE_CAPACITY =Math.max(...SINGLES.map(u => u.capacity))
const SALON_SINGLES = SINGLES.filter(u => u.zone === 'salon')
const MAX_AUTO_CAPACITY = SALON_SINGLES.reduce((sum, u) => sum + u.capacity, 0)

/** Table ids held by any booking whose seating window overlaps one starting at `startMin`. */
export function busyTables(startMin: number, bookings: Booking[]): Set<string> {
  const busy = new Set<string>()
  for (const b of bookings) {
    if (Math.abs(b.startMin - startMin) < SEATING_MINUTES) {
      for (const id of expandTableIds(b.tableIds)) busy.add(id)
    }
  }
  return busy
}

const isFree = (u: Unit, busy: Set<string>) => u.ids.every(id => !busy.has(id))

const fmtIds = (ids: string[]) => ids.filter(id => id !== '07SA').join('+')

/**
 * Pick the most efficient tables for `partySize` at `startMin`.
 *
 * Efficiency = least wasted seats. Ties are broken by how many still-intact salón
 * combos the pick would break (so 18/16-pax combos stay available for big groups).
 */
export function assignTables(
  partySize: number | null,
  startMin: number | null,
  bookings: Booking[],
): AssignResult {
  const reject = (code: RejectionCode, message: string): AssignResult => ({ ok: false, rejection: { code, message } })

  if (startMin === null) return reject('bad_time', 'Hora ilegible, no se puede asignar mesa.')
  if (partySize === null) return reject('bad_party', 'Tamaño del grupo ilegible o 0.')
  if (startMin < FIRST_SEATING_MIN || startMin > LAST_SEATING_MIN) {
    return reject('outside_hours', 'Hora fuera del horario de servicio (3:00 PM – 9:30 PM), revisar a mano.')
  }
  if (partySize > MAX_AUTO_CAPACITY) {
    return reject('too_large', `Grupo de ${partySize} pax excede la capacidad automática del salón (${MAX_AUTO_CAPACITY}).`)
  }

  const busy = busyTables(startMin, bookings)
  const freeSingles = SINGLES.filter(u => isFree(u, busy))
  const freeCombos = COMBOS.filter(u => isFree(u, busy))
  const freePairs = PAIRS.filter(u => isFree(u, busy))

  // ── Party fits on one table ────────────────────────────────────────────────
  if (partySize <= MAX_SINGLE_CAPACITY) {
    const breaks = (u: Unit) => freeCombos.filter(c => c.ids.some(id => u.ids.includes(id))).length
    const best = freeSingles
      .filter(u => u.capacity >= partySize)
      .sort((a, b) => a.capacity - b.capacity || breaks(a) - breaks(b) || a.order - b.order)[0]

    if (!best) return reject('full', `No hay mesa libre para ${partySize} pax en esa franja.`)

    const smallestPossible = Math.min(...SINGLES.filter(u => u.capacity >= partySize).map(u => u.capacity))
    const remark = best.capacity > smallestPossible
      ? `La mesa ideal (${smallestPossible}p) estaba ocupada; se usó una de ${best.capacity}p.`
      : undefined
    return { ok: true, assignment: { zone: best.zone, tableIds: best.ids, capacity: best.capacity, remark } }
  }

  // ── Large party: join salón blocks (combos and neighbouring pairs first, loose tables last) ──
  const comboIds = new Set(COMBOS.flatMap(c => c.ids))
  const looseSalon = SALON_SINGLES.filter(u => isFree(u, busy) && !u.ids.some(id => comboIds.has(id)))
  const blocks = [...freeCombos, ...freePairs, ...looseSalon]
  const fromBlocks = cheapestCover(blocks, partySize)
  if (fromBlocks) {
    return {
      ok: true,
      assignment: {
        ...toAssignment(fromBlocks),
        remark: fromBlocks.length > 1 ? 'Se unieron varios bloques de mesas: confirmar que queden juntas.' : undefined,
      },
    }
  }

  const fromTables = cheapestCover(SALON_SINGLES.filter(u => isFree(u, busy)), partySize)
  if (fromTables) {
    return {
      ok: true,
      assignment: { ...toAssignment(fromTables), remark: 'Mesas sueltas (no son un combo predefinido): confirmar que queden juntas.' },
    }
  }

  return reject('full', `No hay mesas libres suficientes para ${partySize} pax en esa franja.`)
}

/** Subset of `units` with capacity ≥ n, minimizing wasted seats then number of blocks. */
function cheapestCover(units: Unit[], n: number): Unit[] | null {
  let best: Unit[] | null = null
  let bestCap = Infinity
  const total = 1 << units.length
  for (let mask = 1; mask < total; mask++) {
    let cap = 0
    let overlaps = false
    const used = new Set<string>()
    const picked: Unit[] = []
    for (let i = 0; i < units.length && !overlaps; i++) {
      if (!(mask & (1 << i))) continue
      if (units[i].ids.some(id => used.has(id))) { overlaps = true; break }
      units[i].ids.forEach(id => used.add(id))
      cap += units[i].capacity
      picked.push(units[i])
    }
    if (overlaps || cap < n) continue
    if (cap < bestCap || (cap === bestCap && best && picked.length < best.length)) {
      best = picked
      bestCap = cap
    }
  }
  return best
}

function toAssignment(picked: Unit[]): Assignment {
  return {
    zone: 'salon',
    tableIds: expandTableIds(picked.flatMap(u => u.ids)),
    capacity: picked.reduce((s, u) => s + u.capacity, 0),
  }
}

export function describeTables(a: Assignment): string {
  return `${a.zone === 'salon' ? 'Salón' : 'Terraza'} · ${fmtIds(a.tableIds)} (${a.capacity}p)`
}
