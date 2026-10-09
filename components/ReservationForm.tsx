'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DatePickerModal from './DatePickerModal'
import { isClosedDate, closureNotice } from '@/lib/closed-days'

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

const countryCodes = [
  { value: '+506', label: '🇨🇷 +506' },
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+1-CA', label: '🇨🇦 +1' },
  { value: '+52', label: '🇲🇽 +52' },
  { value: '+55', label: '🇧🇷 +55' },
  { value: '+57', label: '🇨🇴 +57' },
  { value: '+54', label: '🇦🇷 +54' },
  { value: '+56', label: '🇨🇱 +56' },
  { value: '+507', label: '🇵🇦 +507' },
  { value: '+503', label: '🇸🇻 +503' },
  { value: '+502', label: '🇬🇹 +502' },
  { value: '+504', label: '🇭🇳 +504' },
  { value: '+505', label: '🇳🇮 +505' },
  { value: '+593', label: '🇪🇨 +593' },
  { value: '+591', label: '🇧🇴 +591' },
  { value: '+595', label: '🇵🇾 +595' },
  { value: '+598', label: '🇺🇾 +598' },
  { value: '+58', label: '🇻🇪 +58' },
  { value: '+34', label: '🇪🇸 +34' },
  { value: '+44', label: '🇬🇧 +44' },
  { value: '+49', label: '🇩🇪 +49' },
  { value: '+33', label: '🇫🇷 +33' },
  { value: '+39', label: '🇮🇹 +39' },
  { value: '+31', label: '🇳🇱 +31' },
  { value: '+61', label: '🇦🇺 +61' },
  { value: '+64', label: '🇳🇿 +64' },
  { value: '+81', label: '🇯🇵 +81' },
  { value: '+82', label: '🇰🇷 +82' },
  { value: '+86', label: '🇨🇳 +86' },
  { value: '+91', label: '🇮🇳 +91' },
  { value: '+972', label: '🇮🇱 +972' },
]

const timeOptions = [
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM',
]

const partySizes = ['1-2', '3-4', '5-6', '7-8', '9+']

interface FormState {
  name: string
  email: string
  phoneCode: string
  phone: string
  date: string
  time: string
  partySize: string
  partyCustom: string
  notes: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  date?: string
  time?: string
  party?: string
}

interface SlotInfo {
  available: boolean
  tablesLeft: number
}

/**
 * Returns true if the slot is within 1 hour of now in Costa Rica time (UTC-6, no DST).
 * Only applies when selectedDate is today in CR time.
 */
function isSlotTooSoon(slot: string, selectedDate: string): boolean {
  // Get current Costa Rica date + time (UTC-6, no DST)
  const crNow = new Date(Date.now() - 6 * 60 * 60 * 1000) // shift to CR wall clock
  const crTodayStr = crNow.toISOString().split('T')[0]     // YYYY-MM-DD in CR

  if (selectedDate !== crTodayStr) return false

  const crHour = crNow.getUTCHours()
  const crMin  = crNow.getUTCMinutes()

  // Parse "5:30 PM" → total minutes in 24h
  const [timePart, ampm] = slot.split(' ')
  const [hStr, mStr] = timePart.split(':')
  let h = parseInt(hStr)
  const m = parseInt(mStr) || 0
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0

  // Slot must start at least 60 minutes from now
  const crTotalMin   = crHour * 60 + crMin
  const slotTotalMin = h * 60 + m
  return slotTotalMin < crTotalMin + 60
}

export default function ReservationForm({ lang = 'en' }: { lang?: 'en' | 'es' }) {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    name: '', email: '', phoneCode: '+506', phone: '',
    date: '', time: '', partySize: '', partyCustom: '', notes: '',
  })
  const [errors, setErrors]         = useState<FormErrors>({})
  const [submitting, setSubmitting]  = useState(false)
  const [availability, setAvailability] = useState<Record<string, SlotInfo> | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Min date = today in Costa Rica time (UTC-6)
  const crToday = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Notice for a temporary closure that is upcoming or in progress (null once it has passed)
  const closureText = closureNotice(lang, crToday)

  /* Fetch slot availability whenever date changes */
  const handleDateChange = async (date: string) => {
    setForm(f => ({ ...f, date, time: '' })) // reset time on date change
    setAvailability(null)
    if (!date) return
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/availability?date=${date}`)
      if (res.ok) {
        const data = await res.json()
        setAvailability(data.availability)
      }
    } catch {
      // fail silently — all slots remain enabled as a fallback
    } finally {
      setLoadingSlots(false)
    }
  }

  /* If loaded availability invalidates the current time selection, clear it */
  useEffect(() => {
    if (!form.time || !availability) return
    const info = availability[form.time]
    const tooSoon = isSlotTooSoon(form.time, form.date)
    if (tooSoon || (info && !info.available)) {
      setForm(f => ({ ...f, time: '' }))
    }
  }, [availability]) // eslint-disable-line react-hooks/exhaustive-deps

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Valid email is required'
    if (!form.phone.trim()) errs.phone = 'Phone is required'
    if (!form.date) errs.date = 'Date is required'
    if (!form.time) errs.time = 'Time is required'
    if (!form.partySize) errs.party = 'Party size is required'
    if (form.partySize === '9+' && (!form.partyCustom || Number(form.partyCustom) < 9))
      errs.party = 'Please enter a valid number (9–99)'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone_code: form.phoneCode,
          phone: form.phone,
          date: form.date,
          time: form.time,
          party_size: form.partySize === '9+' ? form.partyCustom : form.partySize,
          notes: form.notes,
        }),
      })
      if (res.ok) {
        // Push customer identifiers (email, phone) to the dataLayer for Google Ads
        // Enhanced Conversions. The GTM trigger is a Custom Event on
        // `reserva_confirmada` (fires here on submit); the "GAds - User Provided
        // Data" tag reads these via the UPD - Reserva variable and hashes them
        // (SHA-256) before sending — no raw PII leaves the browser. The
        // `.replace(/[^+\d]/g, '')` strips the '-CA' disambiguator from the
        // '+1-CA' country code. first_name is intentionally omitted: GTM groups it
        // with a full name+address block this form does not collect.
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({
          event: 'reserva_confirmada',
          user_data: {
            email: form.email.trim().toLowerCase(),
            phone_number: `${form.phoneCode}${form.phone}`.replace(/[^+\d]/g, ''),
          },
        })

        const base = lang === 'es' ? '/es/reservation-confirmed' : '/reservation-confirmed'
        router.push(`${base}?name=${encodeURIComponent(form.name)}`)
      } else {
        const data = await res.json()
        alert(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div id="resFormWrap">
      <form id="reservationForm" className="res-form" onSubmit={handleSubmit} noValidate>
        <div className="res-grid">

          {/* Full Name */}
          <div className="res-col-2">
            <label className="res-label" htmlFor="resName">Full Name *</label>
            <input
              id="resName"
              className="res-input"
              type="text"
              placeholder="Your full name"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            {errors.name && <p className="res-error">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="res-label" htmlFor="resEmail">Email *</label>
            <input
              id="resEmail"
              className="res-input"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            {errors.email && <p className="res-error">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="res-label" htmlFor="resPhone">Phone *</label>
            <div className="res-phone-wrap">
              <select
                id="resPhoneCode"
                className="res-phone-code"
                aria-label="Country code"
                value={form.phoneCode}
                onChange={(e) => setForm({ ...form, phoneCode: e.target.value })}
              >
                {countryCodes.map((cc) => (
                  <option key={cc.value} value={cc.value}>{cc.label}</option>
                ))}
              </select>
              <input
                id="resPhone"
                className="res-input res-phone-input"
                type="tel"
                placeholder="8888-8888"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            {errors.phone && <p className="res-error">{errors.phone}</p>}
          </div>

          {/* Date — custom glassmorphism picker */}
          <div>
            <label className="res-label">Date *</label>
            <DatePickerModal
              value={form.date}
              onChange={handleDateChange}
              min={crToday}
              isDateClosed={isClosedDate}
              placeholder="Select a date"
            />
            {closureText && <p className="res-error">{closureText}</p>}
            {errors.date && <p className="res-error">{errors.date}</p>}
          </div>

          {/* Time */}
          <div>
            <label className="res-label" htmlFor="resTime">
              Time *
              {loadingSlots && (
                <span className="res-slot-checking"> · Checking availability…</span>
              )}
            </label>
            <select
              id="resTime"
              className="res-select"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              disabled={!form.date}
              required
            >
              <option value="">{form.date ? 'Select time' : 'Select a date first'}</option>
              {timeOptions.map((t) => {
                const tooSoon = form.date ? isSlotTooSoon(t, form.date) : false
                const full    = availability ? !availability[t]?.available : false
                const off     = tooSoon || full
                return (
                  <option key={t} value={t} disabled={off}>
                    {t}{full ? ' — Full' : tooSoon ? ' — Passed' : ''}
                  </option>
                )
              })}
            </select>
            {errors.time && <p className="res-error">{errors.time}</p>}
          </div>

          {/* Party Size */}
          <div className="res-col-2">
            <label className="res-label">Party Size *</label>
            <div className="res-party-btns">
              {partySizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`res-party-btn${form.partySize === size ? ' selected' : ''}`}
                  onClick={() => setForm({ ...form, partySize: size, partyCustom: '' })}
                >
                  {size} guests
                </button>
              ))}
            </div>
            {form.partySize === '9+' && (
              <div style={{ marginTop: '10px' }}>
                <input
                  id="resPartyCustom"
                  className="res-input"
                  type="number"
                  min={9}
                  max={99}
                  step={1}
                  placeholder="Enter exact number (9–99)"
                  inputMode="numeric"
                  value={form.partyCustom}
                  onChange={(e) => setForm({ ...form, partyCustom: e.target.value })}
                />
              </div>
            )}
            {errors.party && <p className="res-error">{errors.party}</p>}
          </div>

          {/* Submit */}
          <div className="res-col-2">
            <button type="submit" className="res-submit" disabled={submitting}>
              {submitting ? 'Confirming...' : 'Confirm Reservation'}
            </button>
          </div>

        </div>
      </form>

      <div className="res-alt fade-up">
        <a
          href="https://wa.me/50624790707?text=Hi!%20I'd%20like%20to%20make%20a%20reservation%20at%20Nanku%20Tropical%20Bar%20%26%20Steakhouse."
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Reserve via WhatsApp
        </a>
        <a href="tel:+50624790707">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.97-1.84a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Call Us Directly
        </a>
      </div>
    </div>
  )
}
