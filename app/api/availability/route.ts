import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ALL_TABLES } from '@/lib/tables'
import { isClosedDate } from '@/lib/closed-days'

// Total bookable table units (hidden 07SA excluded — it's part of 06SA)
const TOTAL_TABLES = ALL_TABLES.filter(t => !t.hidden).length // 22

const TIME_SLOTS = [
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM',
]

/**
 * Estimate how many table units a reservation occupies.
 * party_size is stored as "1-2", "3-4", "5-6", "7-8", or a plain number
 * string for groups of 9+.
 */
function tablesToBook(partySize: string | null): number {
  if (!partySize) return 1
  let n: number
  if (partySize.includes('-')) {
    n = parseInt(partySize.split('-')[1]) || 2
  } else {
    n = parseInt(partySize) || 1
  }
  if (n <= 8)  return 1
  if (n <= 16) return 2
  if (n <= 24) return 3
  return Math.ceil(n / 8)
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date parameter.' }, { status: 400 })
  }

  // Closed date (temporary closure or closed weekday): report every slot as unavailable
  if (isClosedDate(date)) {
    const closedAvailability: Record<string, { available: boolean; tablesLeft: number }> = {}
    for (const slot of TIME_SLOTS) closedAvailability[slot] = { available: false, tablesLeft: 0 }
    return NextResponse.json(
      { availability: closedAvailability, closed: true },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabase
    .from('reservations')
    .select('time, party_size')
    .eq('date', date)
    .in('status', ['pending', 'confirmed'])

  if (error) {
    console.error('Availability query error:', error)
    return NextResponse.json({ error: 'Failed to check availability.' }, { status: 500 })
  }

  // Sum tables needed per time slot
  const usedBySlot: Record<string, number> = {}
  for (const row of data ?? []) {
    const tables = tablesToBook(row.party_size)
    usedBySlot[row.time] = (usedBySlot[row.time] ?? 0) + tables
  }

  const availability: Record<string, { available: boolean; tablesLeft: number }> = {}
  for (const slot of TIME_SLOTS) {
    const used = usedBySlot[slot] ?? 0
    const left = TOTAL_TABLES - used
    availability[slot] = {
      available: left > 0,
      tablesLeft: Math.max(0, left),
    }
  }

  return NextResponse.json(
    { availability },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
