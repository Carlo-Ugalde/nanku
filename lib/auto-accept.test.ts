import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { runAutoAccept } from './auto-accept'
import { CLOSED_WEEKDAYS } from './closed-days'

// ── Tiny in-memory stand-in for the supabase-js calls auto-accept makes ───────
type Row = Record<string, any>
type Filter = (r: Row) => boolean

class Query {
  constructor(
    private rows: Row[],
    private patch?: Row,
    private filters: Filter[] = [],
    private returning = false,
    private log?: Row[],
  ) {}
  eq(c: string, v: unknown) { return new Query(this.rows, this.patch, [...this.filters, r => r[c] === v], this.returning, this.log) }
  in(c: string, vs: unknown[]) { return new Query(this.rows, this.patch, [...this.filters, r => vs.includes(r[c])], this.returning, this.log) }
  order() { return this }
  select() { return new Query(this.rows, this.patch, this.filters, true, this.log) }
  then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
    const hit = this.rows.filter(r => this.filters.every(f => f(r)))
    if (this.patch) { hit.forEach(r => Object.assign(r, this.patch)); this.log?.push({ patch: this.patch, ids: hit.map(r => r.id) }) }
    return Promise.resolve({ data: this.patch && !this.returning ? null : hit.map(r => ({ ...r })), error: null }).then(resolve, reject)
  }
}

function fakeDb(rows: Row[]) {
  const writes: Row[] = []
  const db = {
    from: () => ({
      select: () => new Query(rows),
      update: (patch: Row) => new Query(rows, patch, [], false, writes),
    }),
  }
  return { db: db as never, rows, writes }
}

// ── Capture Telegram + webhook traffic instead of hitting the network ─────────
let sent: string[] = []
let hooks: Row[] = []
const realFetch = globalThis.fetch

beforeEach(() => {
  sent = []
  hooks = []
  process.env.TELEGRAM_BOT_TOKEN = 'test-token'
  process.env.TELEGRAM_CHAT_ID = '123'
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL = 'https://n8n.test/hook'
  globalThis.fetch = (async (url: string, init: { body: string }) => {
    const body = JSON.parse(init.body)
    if (String(url).includes('api.telegram.org')) sent.push(body.text)
    else hooks.push(body)
    return new Response('{}', { status: 200 })
  }) as typeof fetch
})
process.on('exit', () => { globalThis.fetch = realFetch })

const DAY = '2030-06-15'
const pending = (o: Row = {}): Row => ({
  id: 'p1', name: 'Ana Test', date: DAY, time: '7:00 PM', party_size: '1-2', status: 'pending',
  zone: null, table_ids: null, source: 'web_form', phone: '8888', phone_code: '+506', notes: null,
  created_at: '2030-01-01T00:00:00Z', auto_accept_note: null, ...o,
})
const confirmed = (id: string, tableIds: string[] | null, o: Row = {}): Row =>
  pending({ id, status: 'confirmed', table_ids: tableIds, zone: 'terraza', ...o })

const TERRAZA = Array.from({ length: 13 }, (_, i) => `${String(i + 1).padStart(2, '0')}TE`)

test('accepts a pending booking: smallest table, confirmed row, webhook + Telegram', async () => {
  const { db, rows } = fakeDb([pending()])
  const out = await runAutoAccept({ db })

  assert.equal(out.accepted, 1)
  assert.equal(rows[0].status, 'confirmed')
  assert.equal(rows[0].zone, 'terraza')
  assert.deepEqual(rows[0].table_ids, ['01TE'])
  assert.ok(rows[0].confirmed_at)
  assert.equal(hooks.length, 1)
  assert.equal(hooks[0].event, 'reservation_confirmed')
  assert.equal(sent.length, 1)
  assert.match(sent[0], /Reserva aceptada/)
  assert.match(sent[0], /Ana Test/)
  assert.match(sent[0], /01TE/)
})

test('"7:00 PM" and "19:00" are the same slot, so the second booking does not reuse the table', async () => {
  const { db, rows } = fakeDb([
    confirmed('c1', ['01TE'], { time: '19:00' }),
    pending({ id: 'p1', time: '7:00 PM' }),
  ])
  await runAutoAccept({ db })
  assert.notDeepEqual(rows[1].table_ids, ['01TE'])
  assert.deepEqual(rows[1].table_ids, ['02TE'])
})

test('two pending bookings in one run never share a table', async () => {
  const { db, rows } = fakeDb([
    pending({ id: 'a', created_at: '2030-01-01T00:00:00Z' }),
    pending({ id: 'b', created_at: '2030-01-01T00:01:00Z' }),
  ])
  const out = await runAutoAccept({ db })
  assert.equal(out.accepted, 2)
  assert.notDeepEqual(rows[0].table_ids, rows[1].table_ids)
})

test('full house: stays pending, one Telegram alert, and the next run stays quiet', async () => {
  const every = [...TERRAZA, '01SA','02SA','03SA','04SA','05SA','06SA','07SA','08SA','09SA','10SA']
  const { db, rows } = fakeDb([confirmed('c1', every, { zone: 'salon' }), pending()])

  const first = await runAutoAccept({ db })
  assert.equal(first.conflicts, 1)
  assert.equal(rows[1].status, 'pending')
  assert.equal(rows[1].auto_accept_note, 'full')
  assert.equal(sent.length, 1)
  assert.match(sent[0], /requiere atención/)
  assert.equal(hooks.length, 0)

  const second = await runAutoAccept({ db })
  assert.equal(second.conflicts, 1)
  assert.equal(sent.length, 1) // no repeat
})

test('a table that frees up later accepts the old conflict and says so', async () => {
  const every = [...TERRAZA, '01SA','02SA','03SA','04SA','05SA','06SA','07SA','08SA','09SA','10SA']
  const { db, rows } = fakeDb([confirmed('c1', every, { zone: 'salon' }), pending()])
  await runAutoAccept({ db })
  rows[0].status = 'cancelled'

  const out = await runAutoAccept({ db })
  assert.equal(out.accepted, 1)
  assert.equal(rows[1].status, 'confirmed')
  assert.equal(rows[1].auto_accept_note, null)
  assert.match(sent[1], /conflicto resuelto/)
})

test('confirmed booking with no tables still holds a seat so it is not double-sold', async () => {
  const { db, rows } = fakeDb([
    ...TERRAZA.slice(1).map((t, i) => confirmed(`c${i}`, [t])), // 02TE..13TE taken
    confirmed('ghost', null),                                    // promised, no table recorded
    pending({ id: 'p1' }),
  ])
  await runAutoAccept({ db })
  const p = rows.find(r => r.id === 'p1')!
  assert.equal(p.zone, 'salon') // 01TE is virtually held by the ghost
})

test('bookings outside service hours go to a human', async () => {
  const { db, rows } = fakeDb([pending({ time: '12:00 PM' })])
  const out = await runAutoAccept({ db })
  assert.equal(out.conflicts, 1)
  assert.equal(rows[0].status, 'pending')
  assert.equal(rows[0].auto_accept_note, 'outside_hours')
})

test('unreadable time or party size is reported, never guessed', async () => {
  const { db } = fakeDb([pending({ id: 'a', time: 'noche' }), pending({ id: 'b', party_size: '0' })])
  const out = await runAutoAccept({ db })
  assert.equal(out.conflicts, 2)
  assert.equal(sent.length, 2)
})

test('past dates are skipped silently; staff-chosen tables are respected', async () => {
  const { db, rows } = fakeDb([
    pending({ id: 'old', date: '2020-01-01' }),
    pending({ id: 'mine', table_ids: ['05SA'] }),
  ])
  const out = await runAutoAccept({ db })
  assert.equal(out.skipped, 2)
  assert.equal(out.accepted, 0)
  assert.equal(sent.length, 0)
  assert.equal(rows[0].status, 'pending')
})

test('dry run plans but writes and sends nothing', async () => {
  const { db, rows, writes } = fakeDb([pending()])
  const out = await runAutoAccept({ db, dryRun: true })
  assert.equal(out.accepted, 1)
  assert.equal(out.dryRun, true)
  assert.equal(rows[0].status, 'pending')
  assert.equal(writes.length, 0)
  assert.equal(sent.length + hooks.length, 0)
})

test('row already handled by someone else is left alone', async () => {
  const { db, rows } = fakeDb([pending()])
  // Flip the row to cancelled between our SELECT and our UPDATE.
  const realFrom = (db as any).from
  let first = true
  ;(db as any).from = () => {
    const t = realFrom()
    const upd = t.update
    t.update = (patch: Row) => { if (first) { rows[0].status = 'cancelled'; first = false } return upd(patch) }
    return t
  }
  const out = await runAutoAccept({ db })
  assert.equal(out.skipped, 1)
  assert.equal(rows[0].status, 'cancelled')
  assert.equal(sent.length + hooks.length, 0)
})

test('a failing Telegram or webhook never blocks acceptance', async () => {
  globalThis.fetch = (async () => { throw new Error('network down') }) as typeof fetch
  const { db, rows } = fakeDb([pending()])
  const out = await runAutoAccept({ db })
  assert.equal(out.accepted, 1)
  assert.equal(rows[0].status, 'confirmed')
})

test('closed days (lib/closed-days.ts) are never auto-accepted, and the owner is told once', async () => {
  const weekday = new Date(Date.UTC(2030, 5, 15)).getUTCDay() // DAY = 2030-06-15
  CLOSED_WEEKDAYS.push(weekday)
  try {
    const { db, rows } = fakeDb([pending()])
    const out = await runAutoAccept({ db })
    assert.equal(out.conflicts, 1)
    assert.equal(rows[0].status, 'pending')
    assert.equal(rows[0].auto_accept_note, 'closed')
    assert.equal(sent.length, 1)
    assert.match(sent[0], /cerrado/)
    assert.equal(hooks.length, 0)
  } finally {
    CLOSED_WEEKDAYS.splice(CLOSED_WEEKDAYS.indexOf(weekday), 1)
  }
})
