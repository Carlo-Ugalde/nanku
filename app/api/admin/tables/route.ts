import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sameSlot } from '@/lib/time'

// GET /api/admin/tables?date=YYYY-MM-DD&time=HH:MM
// Returns array of table_ids that are confirmed for that slot
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date     = searchParams.get('date')
  const time     = searchParams.get('time')
  const excludeId = searchParams.get('excludeId') // exclude a reservation's own tables (edit mode)

  if (!date || !time) {
    return NextResponse.json({ error: 'date and time are required' }, { status: 400 })
  }

  let query = supabase
    .from('reservations')
    .select('table_ids, time')
    .eq('date', date)
    .eq('status', 'confirmed')

  if (excludeId) query = query.neq('id', excludeId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // `time` is free text ("7:00 PM" from the web form, "19:00" from admin/bot) — compare by minute.
  const occupied = (data ?? [])
    .filter(r => sameSlot(r.time, time))
    .flatMap(r => r.table_ids ?? [])
  return NextResponse.json({ occupied })
}
