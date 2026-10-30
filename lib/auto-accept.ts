// Accepts pending reservations automatically: picks the most efficient free tables,
// confirms the row (same fields + n8n webhook as the manual "Confirmar" button) and
// alerts the owner on Telegram. Anything it cannot place stays `pending` and is reported.
//
// Needs migration 006 (reservations.auto_accept_note) — that column stops a conflict
// from being re-announced on every run.

import { createClient } from '@supabase/supabase-js'
import { todayCR, formatDateCR, formatTimeCR, type Reservation } from './reservations'
import { parseTimeToMinutes, parsePartySize } from './time'
import {
  assignTables,
  describeTables,
  SEATING_MINUTES,
  type Assignment,
  type Booking,
  type Rejection,
} from './auto-assign'
import { sendTelegram, escapeHtml } from './telegram'

type Row = Reservation & { phone_code?: string | null; auto_accept_note?: string | null }

export type Outcome =
  | { id: string; name: string; result: 'accepted'; assignment: Assignment }
  | { id: string; name: string; result: 'conflict'; rejection: Rejection; announced: boolean }
  | { id: string; name: string; result: 'skipped'; reason: string }
  | { id: string; name: string; result: 'error'; error: string }

export type RunSummary = {
  dryRun: boolean
  pending: number
  accepted: number
  conflicts: number
  skipped: number
  errors: number
  outcomes: Outcome[]
}

export const isAutoAcceptEnabled = () => process.env.AUTO_ACCEPT_ENABLED === 'true'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

/** Minutes since midnight, Costa Rica (UTC-6, no DST). */
function nowCRMinutes() {
  const d = new Date(Date.now() - 6 * 60 * 60 * 1000)
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

export async function runAutoAccept(
  { dryRun = false, db = svc() }: { dryRun?: boolean; db?: ReturnType<typeof svc> } = {},
): Promise<RunSummary> {
  const today = todayCR()

  const { data: pendingAll, error: pErr } = await db
    .from('reservations')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (pErr) throw new Error(`pending query failed: ${pErr.message}`)

  const pending = (pendingAll ?? []) as Row[]
  const outcomes: Outcome[] = []
  const dates = Array.from(new Set(pending.map(r => r.date))).sort()

  for (const date of dates) {
    const mine = pending.filter(r => r.date === date)

    if (date < today) {
      for (const p of mine) outcomes.push({ id: p.id, name: p.name, result: 'skipped', reason: 'fecha pasada' })
      continue
    }

    const { data: day, error: dErr } = await db
      .from('reservations')
      .select('*')
      .eq('date', date)
      .in('status', ['confirmed', 'pending'])
      .order('created_at', { ascending: true })
    if (dErr) throw new Error(`day query failed (${date}): ${dErr.message}`)
    const rows = (day ?? []) as Row[]

    // 1) Rows that already hold tables (confirmed, or pending with tables set by staff).
    const bookings: Booking[] = []
    for (const r of rows) {
      const startMin = parseTimeToMinutes(r.time)
      if (startMin !== null && r.table_ids?.length) bookings.push({ startMin, tableIds: r.table_ids })
    }

    // 2) Confirmed rows with NO tables are still promises to a customer: hold virtual
    //    tables for them (not persisted) so we never hand their seats to someone else.
    for (const r of rows) {
      if (r.status !== 'confirmed' || r.table_ids?.length) continue
      const res = assignTables(parsePartySize(r.party_size), parseTimeToMinutes(r.time), bookings)
      if (res.ok) bookings.push({ startMin: parseTimeToMinutes(r.time)!, tableIds: res.assignment.tableIds })
    }

    // 3) Pending rows, oldest first.
    for (const p of mine) {
      if (p.table_ids?.length) {
        outcomes.push({ id: p.id, name: p.name, result: 'skipped', reason: 'mesas ya elegidas por el personal' })
        continue
      }

      const startMin = parseTimeToMinutes(p.time)
      const party = parsePartySize(p.party_size)

      const res = date === today && startMin !== null && startMin < nowCRMinutes()
        ? { ok: false as const, rejection: { code: 'past' as const, message: 'La hora de la reserva ya pasó.' } }
        : assignTables(party, startMin, bookings)

      if (!res.ok) {
        const announced = p.auto_accept_note === res.rejection.code
        if (!dryRun && !announced) {
          const { error } = await db
            .from('reservations')
            .update({ auto_accept_note: res.rejection.code })
            .eq('id', p.id)
            .eq('status', 'pending')
          if (error) {
            outcomes.push({ id: p.id, name: p.name, result: 'error', error: error.message })
            continue
          }
          await sendTelegram(conflictMessage(p, res.rejection))
        }
        outcomes.push({ id: p.id, name: p.name, result: 'conflict', rejection: res.rejection, announced })
        continue
      }

      const { assignment } = res
      if (!dryRun) {
        const now = new Date().toISOString()
        const { data: updated, error } = await db
          .from('reservations')
          .update({
            status: 'confirmed',
            zone: assignment.zone,
            table_ids: assignment.tableIds,
            confirmed_at: now,
            updated_at: now,
            ...(p.auto_accept_note ? { auto_accept_note: null } : {}),
          })
          .eq('id', p.id)
          .eq('status', 'pending') // someone confirmed/cancelled it meanwhile → leave it alone
          .select('*')
        if (error) {
          outcomes.push({ id: p.id, name: p.name, result: 'error', error: error.message })
          continue
        }
        if (!updated?.length) {
          outcomes.push({ id: p.id, name: p.name, result: 'skipped', reason: 'ya procesada por otra vía' })
          continue
        }
        await fireConfirmedWebhook(updated[0])
        await sendTelegram(acceptedMessage(updated[0] as Row, assignment, !!p.auto_accept_note))
      }

      bookings.push({ startMin: startMin!, tableIds: assignment.tableIds })
      outcomes.push({ id: p.id, name: p.name, result: 'accepted', assignment })
    }
  }

  const count = (k: Outcome['result']) => outcomes.filter(o => o.result === k).length
  return {
    dryRun,
    pending: pending.length,
    accepted: count('accepted'),
    conflicts: count('conflict'),
    skipped: count('skipped'),
    errors: count('error'),
    outcomes,
  }
}

/** Same call the manual "Confirmar" button makes, so the customer gets the same confirmation. */
async function fireConfirmedWebhook(row: unknown) {
  const url = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'reservation_confirmed', ...(row as object) }),
    })
  } catch (e) {
    console.error('[auto-accept] confirmation webhook failed:', e)
  }
}

// ── Telegram messages ────────────────────────────────────────────────────────

const SOURCE_LABEL: Record<string, string> = {
  web_form: 'Web',
  whatsapp: 'WhatsApp',
  whatsapp_coex: 'WhatsApp',
  phone: 'Teléfono',
  walk_in: 'Walk-in',
}

function weekdayCR(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CR', { weekday: 'short' })
}

function details(r: Row) {
  const phone = [r.phone_code, r.phone].filter(Boolean).join(' ')
  const lines = [
    `<b>${escapeHtml(r.name)}</b> · ${escapeHtml(r.party_size)} pax`,
    `📅 ${weekdayCR(r.date)} ${formatDateCR(r.date)} · 🕐 ${formatTimeCR(r.time) || escapeHtml(r.time)}`,
    `📞 ${escapeHtml(phone || 'sin teléfono')} · ${SOURCE_LABEL[r.source ?? ''] ?? escapeHtml(r.source ?? 'web')}`,
  ]
  if (r.notes) lines.push(`📝 ${escapeHtml(r.notes)}`)
  return lines
}

function acceptedMessage(r: Row, a: Assignment, wasConflict: boolean) {
  const lines = [
    wasConflict ? '✅ <b>Reserva aceptada (conflicto resuelto)</b>' : '✅ <b>Reserva aceptada</b>',
    ...details(r),
    `🪑 ${describeTables(a)}`,
  ]
  if (a.remark) lines.push(`ℹ️ ${escapeHtml(a.remark)}`)
  return lines.join('\n')
}

function conflictMessage(r: Row, rej: Rejection) {
  const admin = process.env.ADMIN_URL ?? 'https://nanku-three.vercel.app/admin'
  return [
    '⚠️ <b>Reserva requiere atención</b>',
    ...details(r),
    `🚫 ${escapeHtml(rej.message)}`,
    `Quedó <b>pendiente</b> (ventana de ${SEATING_MINUTES / 60} h por mesa). Resolver en ${admin}/reservations`,
  ].join('\n')
}
