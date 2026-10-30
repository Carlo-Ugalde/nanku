import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { runAutoAccept, isAutoAcceptEnabled } from '@/lib/auto-accept'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// GET/POST /api/cron/auto-accept[?dryRun=1]
// Auth: `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this header automatically).
// Fails closed: with no CRON_SECRET configured nobody gets in.
function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const given = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function handle(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dryRun = new URL(req.url).searchParams.get('dryRun') === '1'

  // Dry runs write nothing and message nobody, so they work even with the kill switch off.
  if (!dryRun && !isAutoAcceptEnabled()) {
    return NextResponse.json({ skipped: 'AUTO_ACCEPT_ENABLED is not "true"' })
  }

  try {
    return NextResponse.json(await runAutoAccept({ dryRun }))
  } catch (e) {
    console.error('[auto-accept] run failed:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'run failed' }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
