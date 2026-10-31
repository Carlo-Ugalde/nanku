'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AdminNav from '../components/AdminNav'
import {
  type Reservation,
  STATUS_LABELS,
  STATUS_STYLES,
  todayCR,
  formatTimeCR,
  formatDateCR,
  addDays,
} from '@/lib/reservations'
import {
  type TableDef,
  SALON_TABLES,
  TERRAZA_TABLES,
  LUNCH_SLOTS,
  DINNER_SLOTS,
} from '@/lib/tables'
import { to24h } from '@/lib/time'

// ─── Constants ────────────────────────────────────────────────────────────────
const ARRIVAL_WINDOW_MS = 20 * 60 * 1000

// ─── Helpers ──────────────────────────────────────────────────────────────────
function crToMs(dateStr: string, timeStr: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [h, mi]    = to24h(timeStr).split(':').map(Number)
  return Date.UTC(y, mo - 1, d, h + 6, mi)
}

function fmtCountdown(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function pickSlot(dateStr: string, nowMs: number): string {
  const all   = [...LUNCH_SLOTS, ...DINNER_SLOTS]
  const today = todayCR()
  if (dateStr !== today) return all[0]
  const active = all.find(s => {
    const ms = crToMs(dateStr, s)
    return nowMs >= ms && nowMs < ms + 2 * 3600 * 1000
  })
  if (active) return active
  const next = all.find(s => crToMs(dateStr, s) > nowMs)
  return next ?? all[all.length - 1]
}

// ─── Types ────────────────────────────────────────────────────────────────────
type TableStatus = 'free' | 'pending' | 'upcoming' | 'arriving' | 'overdue'

const TABLE_STYLES: Record<TableStatus, string> = {
  free:     'border-emerald-400/60 bg-emerald-50   dark:bg-emerald-950/30  text-emerald-700 dark:text-emerald-400',
  pending:  'border-amber-400/60   bg-amber-50     dark:bg-amber-950/30    text-amber-700   dark:text-amber-400',
  upcoming: 'border-sky-400/60     bg-sky-50       dark:bg-sky-950/30      text-sky-700     dark:text-sky-400',
  arriving: 'border-orange-500     bg-orange-50    dark:bg-orange-950/30   text-orange-600  dark:text-orange-400',
  overdue:  'border-red-400/70     bg-red-50       dark:bg-red-950/30      text-red-600     dark:text-red-400',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SlotButton({
  slot, count, selected, onClick,
}: {
  slot: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-3 py-1.5 rounded-lg text-sm font-mono transition ${
        selected
          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
          : 'bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:border-gray-400 dark:hover:border-zinc-500'
      }`}
    >
      {slot}
      {count > 0 && (
        <span className={`absolute -top-2 -right-2 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1 ${
          selected ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded border-2 inline-block ${color}`} />
      {label}
    </span>
  )
}

function TableCell({
  t, wide = false, status, countdown, res, onClick,
}: {
  t: TableDef
  wide?: boolean
  status: TableStatus
  countdown: { text: string; urgent: boolean } | null
  res: Reservation | undefined
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-2 transition hover:scale-105 cursor-pointer shadow-sm ${
        wide ? 'col-span-2' : ''
      } ${TABLE_STYLES[status]}`}
      style={{ minHeight: 76 }}
    >
      {status === 'arriving' && (
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500" />
        </span>
      )}
      <span className="text-xs font-mono font-bold leading-tight">{t.label || t.id}</span>
      {t.capacity > 0 && <span className="text-[10px] opacity-50">{t.capacity}p</span>}
      {res && (
        <span className="text-[10px] mt-0.5 truncate max-w-full px-1 leading-tight">
          {res.name}
        </span>
      )}
      {countdown && (
        <span className={`text-[9px] font-mono mt-0.5 ${countdown.urgent ? 'font-bold' : 'opacity-50'}`}>
          {countdown.text}
        </span>
      )}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TableMapClient({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const today  = todayCR()

  const [date,          setDate]          = useState(today)
  const [now,           setNow]           = useState(() => Date.now())
  const [selectedSlot,  setSelectedSlot]  = useState(() => pickSlot(today, Date.now()))
  const [allRes,        setAllRes]        = useState<Reservation[]>([])
  const [loading,       setLoading]       = useState(true)
  const [modalTable,    setModalTable]    = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────
  const loadDay = useCallback(async (d: string) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/reservations?date=${d}`)
      const j = await r.json()
      setAllRes(j.reservations ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDay(date)
    setSelectedSlot(pickSlot(date, Date.now()))
  }, [date, loadDay])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => loadDay(date), 30_000)
    return () => clearInterval(id)
  }, [date, loadDay])

  // ── Derived ────────────────────────────────────────────────────────────────
  const slotCounts = useMemo(() => {
    const c: Record<string, number> = {}
    allRes
      .filter(r => r.status === 'confirmed' || r.status === 'pending')
      .forEach(r => { const k = to24h(r.time); c[k] = (c[k] ?? 0) + 1 })
    return c
  }, [allRes])

  const { tableMap, pendingMap } = useMemo(() => {
    const tMap: Record<string, Reservation> = {}
    const pMap: Record<string, Reservation> = {}
    allRes
      .filter(r => to24h(r.time) === selectedSlot && (r.status === 'confirmed' || r.status === 'pending'))
      .forEach(r => {
        ;(r.table_ids ?? []).forEach(tid => {
          if (r.status === 'confirmed') tMap[tid] = r
          else                         pMap[tid] = r
        })
      })
    return { tableMap: tMap, pendingMap: pMap }
  }, [allRes, selectedSlot])

  const isToday = date === today

  // ── Status & countdown ─────────────────────────────────────────────────────
  function getStatus(id: string): TableStatus {
    const res = tableMap[id]
    if (!res) return pendingMap[id] ? 'pending' : 'free'
    if (!isToday) return 'upcoming'
    const elapsed = now - crToMs(res.date, res.time)
    if (elapsed < 0)                  return 'upcoming'
    if (elapsed <= ARRIVAL_WINDOW_MS) return 'arriving'
    return 'overdue'
  }

  function getCountdown(id: string): { text: string; urgent: boolean } | null {
    const res = tableMap[id] ?? pendingMap[id]
    if (!res || !isToday) return null
    const ms      = crToMs(res.date, res.time)
    const diff    = ms - now
    const elapsed = now - ms
    if (diff > 0) return { text: `en ${fmtCountdown(diff)}`, urgent: diff < 5 * 60 * 1000 }
    if (elapsed <= ARRIVAL_WINDOW_MS)
      return { text: `↓ ${fmtCountdown(ARRIVAL_WINDOW_MS - elapsed)}`, urgent: true }
    return null
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async function quickAction(id: string, status: 'confirmed' | 'cancelled' | 'no_show') {
    setActionLoading(id + status)
    try {
      await fetch('/api/admin/reservations', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, status }),
      })
      setModalTable(null)
      await loadDay(date)
    } finally { setActionLoading(null) }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // ── Modal data ─────────────────────────────────────────────────────────────
  // For the selected table: confirmed + pending reservations in current slot
  const modalReservations = modalTable
    ? [tableMap[modalTable], pendingMap[modalTable]].filter(Boolean) as Reservation[]
    : []

  const newResUrl = modalTable
    ? `/admin/new-reservation?date=${date}&time=${selectedSlot}&zone=${
        modalTable.endsWith('SA') ? 'salon' : 'terraza'
      }&table=${modalTable}`
    : '/admin/new-reservation'

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
              <span className="text-orange-500 font-bold text-sm">N</span>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold text-sm">Nanku Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 dark:text-zinc-500 text-sm hidden md:block">{userEmail}</span>
            <button onClick={handleSignOut}
              className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white text-sm transition px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
              Sign out
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-zinc-800 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminNav />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* ── Title + date nav ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mapa de Mesas</h1>
            {!isToday && <p className="text-gray-400 dark:text-zinc-500 text-sm mt-0.5">{formatDateCR(date)}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDate(d => addDays(d, -1))}
              className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:border-gray-300 transition">
              ◀
            </button>
            <button onClick={() => setDate(today)}
              className={`px-4 py-1.5 rounded-lg border text-sm transition ${
                isToday
                  ? 'border-orange-400/60 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                  : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 hover:border-gray-300 hover:text-gray-900 dark:hover:text-zinc-200'
              }`}>
              Hoy
            </button>
            <button onClick={() => setDate(d => addDays(d, 1))}
              className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:border-gray-300 transition">
              ▶
            </button>
          </div>
        </div>

        {/* ── Slot buttons ──────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 mb-5 space-y-3 shadow-sm">
          <div>
            <p className="text-gray-400 dark:text-zinc-500 text-[11px] font-semibold uppercase tracking-widest mb-2">Almuerzo</p>
            <div className="flex flex-wrap gap-2">
              {LUNCH_SLOTS.map(s => (
                <SlotButton key={s} slot={s} count={slotCounts[s] ?? 0}
                  selected={selectedSlot === s} onClick={() => setSelectedSlot(s)} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-gray-400 dark:text-zinc-500 text-[11px] font-semibold uppercase tracking-widest mb-2">Cena</p>
            <div className="flex flex-wrap gap-2">
              {DINNER_SLOTS.map(s => (
                <SlotButton key={s} slot={s} count={slotCounts[s] ?? 0}
                  selected={selectedSlot === s} onClick={() => setSelectedSlot(s)} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Legend ────────────────────────────────────────────────────────── */}
        <div className="flex gap-4 flex-wrap text-xs text-gray-400 dark:text-zinc-500 mb-5">
          <LegendDot color="border-emerald-400 bg-emerald-50"  label="Libre" />
          <LegendDot color="border-amber-400   bg-amber-50"    label="Pendiente" />
          <LegendDot color="border-sky-400     bg-sky-50"      label="Confirmada" />
          <LegendDot color="border-orange-500  bg-orange-50"   label="Llega ahora" />
          <LegendDot color="border-red-400     bg-red-50"      label="Sin confirmar" />
        </div>

        {/* ── Table grids ───────────────────────────────────────────────────── */}
        {loading ? (
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center text-gray-400 dark:text-zinc-500 text-sm animate-pulse shadow-sm">
            Cargando mesas…
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 mb-4 shadow-sm">
              <h2 className="text-orange-500 text-sm font-semibold uppercase tracking-wide mb-4">🌿 Salón</h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {SALON_TABLES.filter(t => !t.hidden).map(t => (
                  <TableCell key={t.id} t={t} wide={t.id === '06SA'}
                    status={getStatus(t.id)}
                    countdown={getCountdown(t.id)}
                    res={tableMap[t.id] ?? pendingMap[t.id]}
                    onClick={() => setModalTable(t.id)} />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <h2 className="text-orange-500 text-sm font-semibold uppercase tracking-wide mb-4">🌤 Terraza</h2>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
                {TERRAZA_TABLES.map(t => (
                  <TableCell key={t.id} t={t}
                    status={getStatus(t.id)}
                    countdown={getCountdown(t.id)}
                    res={tableMap[t.id] ?? pendingMap[t.id]}
                    onClick={() => setModalTable(t.id)} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Table modal ───────────────────────────────────────────────────────── */}
      {modalTable && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setModalTable(null)}>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl w-full max-w-sm shadow-xl relative overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalTable(null)}
              className="absolute top-4 right-4 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 text-lg leading-none">✕</button>

            {/* Table header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-gray-900 dark:text-white font-bold text-lg">Mesa {modalTable}</h3>
              <p className="text-gray-400 dark:text-zinc-500 text-sm mt-0.5">
                Turno {formatTimeCR(selectedSlot)} · {formatDateCR(date)}
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Reservation list */}
              {modalReservations.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">🟢</div>
                  <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">Mesa libre para este turno</p>
                  <p className="text-gray-400 dark:text-zinc-500 text-xs mt-1">No hay reservas asignadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-500 dark:text-zinc-400 text-xs uppercase tracking-wide font-semibold">
                    Reservas · {selectedSlot}
                  </p>
                  {modalReservations.map(res => {
                    const status = getStatus(modalTable)
                    const inArrival = status === 'arriving' || status === 'overdue'
                    const windowMs = status === 'arriving'
                      ? ARRIVAL_WINDOW_MS - (now - crToMs(res.date, res.time))
                      : null

                    return (
                      <div key={res.id} className={`rounded-xl p-4 border ${
                        inArrival
                          ? status === 'arriving'
                            ? 'border-orange-200 bg-orange-50'
                            : 'border-red-200 bg-red-50'
                          : 'border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50'
                      }`}>
                        {/* Arrival window */}
                        {inArrival && (
                          <div className="mb-3">
                            <p className={`text-sm font-semibold mb-1 ${
                              status === 'arriving' ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {status === 'arriving' ? '⏱ ¿Llegaron los clientes?' : '⚠ Ventana vencida'}
                            </p>
                            {windowMs !== null && (
                              <p className="text-[11px] text-gray-400 font-mono mb-2">
                                {fmtCountdown(windowMs)} para confirmar
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => quickAction(res.id, 'confirmed')}
                                disabled={!!actionLoading}
                                className="flex-1 py-2 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-700 text-xs font-semibold hover:bg-emerald-500/20 disabled:opacity-50 transition">
                                {actionLoading === res.id + 'confirmed' ? '…' : '✓ Sí llegaron'}
                              </button>
                              <button
                                onClick={() => quickAction(res.id, 'no_show')}
                                disabled={!!actionLoading}
                                className="flex-1 py-2 rounded-lg bg-red-500/10 border border-red-400/30 text-red-600 text-xs font-semibold hover:bg-red-500/20 disabled:opacity-50 transition">
                                {actionLoading === res.id + 'no_show' ? '…' : '✕ No llegaron'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Reservation details */}
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-zinc-400">Nombre</span>
                            <span className="text-gray-900 dark:text-white font-medium">{res.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-zinc-400">Personas</span>
                            <span className="text-gray-700 dark:text-zinc-300">{res.party_size} pax</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-zinc-400">Teléfono</span>
                            <span className="text-gray-700 dark:text-zinc-300 font-mono text-xs">{res.phone || '—'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-zinc-400">Estado</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_STYLES[res.status]}`}>
                              {STATUS_LABELS[res.status]}
                            </span>
                          </div>
                        </div>

                        {res.notes && (
                          <p className="text-gray-400 dark:text-zinc-500 text-xs italic border-t border-gray-200 dark:border-zinc-700 pt-2 mt-2">{res.notes}</p>
                        )}

                        {/* Standard actions (non-arrival) */}
                        {!inArrival && (
                          <div className="flex gap-2 mt-3">
                            {res.status === 'pending' && (
                              <button onClick={() => quickAction(res.id, 'confirmed')} disabled={!!actionLoading}
                                className="flex-1 text-xs py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition">
                                ✔ Confirmar
                              </button>
                            )}
                            {(res.status === 'pending' || res.status === 'confirmed') && (
                              <button onClick={() => quickAction(res.id, 'cancelled')} disabled={!!actionLoading}
                                className="flex-1 text-xs py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 disabled:opacity-50 transition">
                                ✕ Cancelar
                              </button>
                            )}
                            <Link href={`/admin/new-reservation?id=${res.id}`}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 hover:border-gray-300 transition">
                              ✏
                            </Link>
                          </div>
                        )}
                        {inArrival && (
                          <Link href={`/admin/new-reservation?id=${res.id}`}
                            className="mt-2 block text-center text-xs py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition">
                            ✏ Editar reserva
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Create new reservation button */}
              <Link
                href={newResUrl}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition shadow-sm">
                + Crear reserva para esta mesa
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
