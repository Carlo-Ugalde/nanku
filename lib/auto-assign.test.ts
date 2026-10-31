import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseTimeToMinutes, to24h, sameSlot, parsePartySize } from './time'
import { assignTables, busyTables, type Booking } from './auto-assign'

const t = (s: string) => parseTimeToMinutes(s)!
const ok = (r: ReturnType<typeof assignTables>) => {
  assert.ok(r.ok, r.ok ? '' : r.rejection.message)
  return r.assignment
}

// ── time / party parsing (the "alignment" bug: "7:00 PM" vs "19:00") ──────────
test('time formats from every writer normalise to the same minute', () => {
  for (const s of ['19:00', '7:00 PM', '7:00 pm', '7:00PM', '7 PM', '19:00:00']) assert.equal(t(s), 19 * 60, s)
  assert.equal(t('12:00 PM'), 12 * 60)
  assert.equal(t('12:30 AM'), 30)
  assert.equal(t('9:30 PM'), 21 * 60 + 30)
  assert.equal(to24h('7:30 PM'), '19:30')
  assert.equal(to24h('19:30'), '19:30')
  assert.ok(sameSlot('7:00 PM', '19:00'))
  assert.ok(!sameSlot('7:00 PM', '19:30'))
})

test('garbage times are null, not NaN', () => {
  for (const s of ['', 'noche', '25:00', '13:00 PM', '7:75 PM', null, undefined]) assert.equal(parseTimeToMinutes(s as string), null, String(s))
  assert.equal(to24h('noche'), 'noche')
})

test('party size parsing takes the upper bound', () => {
  assert.equal(parsePartySize('1-2'), 2)
  assert.equal(parsePartySize('7-8'), 8)
  assert.equal(parsePartySize('14'), 14)
  assert.equal(parsePartySize('5 people'), 5)
  assert.equal(parsePartySize('0'), null)
  assert.equal(parsePartySize(''), null)
  assert.equal(parsePartySize(null), null)
})

// ── single-table efficiency ───────────────────────────────────────────────────
test('small parties get a 4p terraza table, not a bigger one', () => {
  for (const n of [1, 2, 3, 4]) {
    const a = ok(assignTables(n, t('19:00'), []))
    assert.equal(a.zone, 'terraza')
    assert.equal(a.capacity, 4)
  }
})

test('5-6 pax get a 6p salón table; 7-8 get an 8p table', () => {
  assert.equal(ok(assignTables(6, t('19:00'), [])).capacity, 6)
  assert.equal(ok(assignTables(7, t('19:00'), [])).capacity, 8)
})

test('8p pick prefers the loose 06-07SA table so the 04-05SA combo stays intact', () => {
  const a = ok(assignTables(8, t('19:00'), []))
  assert.deepEqual(a.tableIds, ['06SA', '07SA'])
})

test('06SA always travels with 07SA', () => {
  const book: Booking[] = [{ startMin: t('19:00'), tableIds: ['04SA', '05SA'] }]
  const a = ok(assignTables(8, t('19:00'), book))
  assert.deepEqual(a.tableIds, ['06SA', '07SA'])
  assert.deepEqual(busyTables(t('19:00'), [{ startMin: t('19:00'), tableIds: ['06SA'] }]), new Set(['06SA', '07SA']))
})

test('6p pick breaks as few intact combos as possible', () => {
  // 01SA already busy → 01-02-03 combo is broken; next 6p pick should come from it, not from 08-09-10.
  const book: Booking[] = [{ startMin: t('19:00'), tableIds: ['01SA'] }]
  const a = ok(assignTables(6, t('19:00'), book))
  assert.deepEqual(a.tableIds, ['02SA'])
})

// ── time-window conflicts ─────────────────────────────────────────────────────
test('same table, same minute in different formats is a conflict (the 2026-11-09 bug)', () => {
  const book: Booking[] = [{ startMin: t('7:00 PM'), tableIds: ['01TE', '02TE', '03TE', '04TE', '05TE', '06TE', '07TE', '08TE', '09TE', '10TE', '11TE', '12TE', '13TE'] }]
  const a = ok(assignTables(2, t('19:00'), book))
  assert.equal(a.zone, 'salon') // terraza fully busy → falls back to salón 6p
  assert.match(a.remark ?? '', /ideal/)
})

test('bookings 2h or more apart do not conflict; closer ones do', () => {
  const allTerraza = Array.from({ length: 13 }, (_, i) => `${String(i + 1).padStart(2, '0')}TE`)
  const book: Booking[] = [{ startMin: t('17:00'), tableIds: allTerraza }]
  assert.equal(ok(assignTables(2, t('19:00'), book)).zone, 'terraza')     // exactly 120 min later → free
  assert.equal(ok(assignTables(2, t('18:30'), book)).zone, 'salon')       // 90 min later → still held
})

// ── conflicts that must reach a human ────────────────────────────────────────
test('everything busy → full, with no assignment', () => {
  const every = ['01SA','02SA','03SA','04SA','05SA','06SA','07SA','08SA','09SA','10SA',
    ...Array.from({ length: 13 }, (_, i) => `${String(i + 1).padStart(2, '0')}TE`)]
  const r = assignTables(2, t('19:00'), [{ startMin: t('19:00'), tableIds: every }])
  assert.ok(!r.ok && r.rejection.code === 'full')
})

test('bad time, bad party size, outside hours, oversized group are rejected', () => {
  const code = (r: ReturnType<typeof assignTables>) => (r.ok ? 'ok' : r.rejection.code)
  assert.equal(code(assignTables(2, null, [])), 'bad_time')
  assert.equal(code(assignTables(null, t('19:00'), [])), 'bad_party')
  assert.equal(code(assignTables(2, t('12:00'), [])), 'outside_hours')
  assert.equal(code(assignTables(2, t('22:00'), [])), 'outside_hours')
  assert.equal(code(assignTables(2, t('15:00'), [])), 'ok')
  assert.equal(code(assignTables(2, t('21:30'), [])), 'ok')
  assert.equal(code(assignTables(61, t('19:00'), [])), 'too_large')
})

// ── large groups ──────────────────────────────────────────────────────────────
test('9-12 pax take two neighbouring 6p tables (12p), as staff already do', () => {
  for (const n of [9, 10, 11, 12]) {
    const a = ok(assignTables(n, t('19:00'), []))
    assert.deepEqual(a.tableIds, ['01SA', '02SA'], String(n))
    assert.equal(a.capacity, 12)
    assert.equal(a.remark, undefined)
  }
})

test('13-16 pax take 04-05SA (16p), 17-18 take an 18p combo', () => {
  for (const n of [13, 14, 15, 16]) assert.deepEqual(ok(assignTables(n, t('19:00'), [])).tableIds, ['04SA', '05SA'], String(n))
  const b = ok(assignTables(17, t('19:00'), []))
  assert.equal(b.capacity, 18)
  assert.equal(b.tableIds.length, 3)
})

test('the next 9-12 group goes to the other row, not into the first pair', () => {
  const book: Booking[] = [{ startMin: t('19:00'), tableIds: ['01SA', '02SA'] }]
  assert.deepEqual(ok(assignTables(10, t('19:00'), book)).tableIds, ['08SA', '09SA'])
})

test('30 pax join blocks with zero waste and ask to verify they sit together', () => {
  const a = ok(assignTables(30, t('19:00'), []))
  assert.equal(a.capacity, 30) // 18 + 12
  assert.equal(a.zone, 'salon')
  assert.match(a.remark ?? '', /bloques/)
})

test('large group that needs several broken-up blocks carries a warning', () => {
  // 01SA, 04SA and 08SA busy: no combo is intact, only pairs 02-03 / 09-10 and the 06-07 table remain.
  const book: Booking[] = [{ startMin: t('19:00'), tableIds: ['01SA', '04SA', '08SA'] }]
  const a = ok(assignTables(16, t('19:00'), book))
  assert.equal(a.capacity, 20) // 12 + 8
  assert.match(a.remark ?? '', /bloques/)
})

test('large group falls back to loose tables with a warning when no block is left', () => {
  // 02SA, 05SA and 09SA busy: every combo and pair is broken; only single tables remain.
  const book: Booking[] = [{ startMin: t('19:00'), tableIds: ['02SA', '05SA', '09SA'] }]
  const a = ok(assignTables(18, t('19:00'), book))
  assert.equal(a.capacity, 18)
  assert.match(a.remark ?? '', /sueltas/)
})

test('large group with not enough salón left is a conflict', () => {
  const book: Booking[] = [{ startMin: t('19:00'), tableIds: ['01SA','02SA','03SA','04SA','05SA'] }]
  const r = assignTables(30, t('19:00'), book)
  assert.ok(!r.ok && r.rejection.code === 'full')
})
