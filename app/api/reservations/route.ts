import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isClosedDate } from '@/lib/closed-days'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone_code, phone, date, time, party_size, notes } = body

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length < 5) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 })
    }
    if (!date || typeof date !== 'string') {
      return NextResponse.json({ error: 'Reservation date is required.' }, { status: 400 })
    }
    // Compare dates in Costa Rica time (UTC-6, no DST) to avoid UTC midnight mismatches
    const crNowDate = new Date(Date.now() - 6 * 60 * 60 * 1000)
    const crTodayDate = crNowDate.toISOString().split('T')[0]
    if (date < crTodayDate) {
      return NextResponse.json({ error: 'Reservation date must be today or in the future.' }, { status: 400 })
    }
    if (isClosedDate(date)) {
      return NextResponse.json({ error: 'We are closed on that date. Please choose another date.' }, { status: 400 })
    }
    if (!time || typeof time !== 'string') {
      return NextResponse.json({ error: 'Reservation time is required.' }, { status: 400 })
    }

    // 1-hour advance notice rule — evaluated in Costa Rica time (UTC-6, no DST)
    const crNow = new Date(Date.now() - 6 * 60 * 60 * 1000)
    const crTodayStr = crNow.toISOString().split('T')[0]
    if (date === crTodayStr) {
      const [timePart, ampm] = (time as string).split(' ')
      const [hStr, mStr] = timePart.split(':')
      let slotHour = parseInt(hStr)
      const slotMin = parseInt(mStr) || 0
      if (ampm === 'PM' && slotHour !== 12) slotHour += 12
      if (ampm === 'AM' && slotHour === 12) slotHour = 0
      const crTotalMin  = crNow.getUTCHours() * 60 + crNow.getUTCMinutes()
      const slotTotalMin = slotHour * 60 + slotMin
      if (slotTotalMin < crTotalMin + 60) {
        return NextResponse.json(
          { error: 'Reservations require at least 1 hour advance notice.' },
          { status: 400 }
        )
      }
    }

    if (!party_size || typeof party_size !== 'string') {
      return NextResponse.json({ error: 'Party size is required.' }, { status: 400 })
    }

    // Use service role to bypass RLS for inserts
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { error } = await supabase.from('reservations').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone_code: phone_code ?? '+506',
      phone: phone.trim(),
      date,
      time,
      party_size,
      notes: notes?.trim() || null,
      status: 'pending',
    })

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to save reservation. Please try again.' }, { status: 500 })
    }

    // Webhook is fired later by the admin when the reservation is confirmed + table assigned
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Reservation API error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
