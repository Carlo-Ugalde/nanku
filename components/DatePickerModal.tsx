'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const DAY_NAMES  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[m - 1]} ${d}, ${y}`
}

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

interface Props {
  value: string        // YYYY-MM-DD or ''
  onChange: (date: string) => void
  min?: string         // YYYY-MM-DD — dates before this are disabled
  isDateClosed?: (date: string) => boolean  // YYYY-MM-DD — closed dates are disabled
  placeholder?: string
}

export default function DatePickerModal({
  value,
  onChange,
  min,
  isDateClosed,
  placeholder = 'Select a date',
}: Props) {
  const today = new Date()
  const initYear  = value ? parseInt(value.split('-')[0]) : today.getFullYear()
  const initMonth = value ? parseInt(value.split('-')[1]) - 1 : today.getMonth()

  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear]   = useState(initYear)
  const [viewMonth, setViewMonth] = useState(initMonth)
  const overlayRef = useRef<HTMLDivElement>(null)

  /* Lock body scroll while open */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  /* Close on Escape */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  /* Click outside to close */
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) setOpen(false)
  }, [])

  /* Month navigation */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  /* Build day cells */
  const firstDay   = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startPad   = firstDay.getDay()

  /* Parse min date once */
  const minDate = min
    ? (() => { const d = new Date(min + 'T00:00:00'); d.setHours(0, 0, 0, 0); return d })()
    : null

  const isDisabled = (y: number, m: number, d: number) => {
    const dt = new Date(y, m, d); dt.setHours(0, 0, 0, 0)
    if (isDateClosed?.(toYMD(y, m, d))) return true
    if (!minDate) return false
    return dt < minDate
  }
  const isSelected = (y: number, m: number, d: number) => value === toYMD(y, m, d)
  const isToday    = (y: number, m: number, d: number) =>
    y === today.getFullYear() && m === today.getMonth() && d === today.getDate()

  const selectDay = (day: number) => {
    if (isDisabled(viewYear, viewMonth, day)) return
    onChange(toYMD(viewYear, viewMonth, day))
    setOpen(false)
  }

  const cells: (number | null)[] = [
    ...Array<null>(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        className={`res-date-trigger${!value ? ' res-date-trigger--empty' : ''}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={value ? formatDisplay(value) : placeholder}
      >
        <svg
          width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8"  y1="2" x2="8"  y2="6" />
          <line x1="3"  y1="10" x2="21" y2="10" />
        </svg>
        <span>{value ? formatDisplay(value) : placeholder}</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="datepicker-overlay"
          ref={overlayRef}
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-label="Select date"
        >
          <div className="datepicker-card">
            {/* Header */}
            <div className="datepicker-nav">
              <button
                type="button"
                className="datepicker-nav-btn"
                onClick={prevMonth}
                aria-label="Previous month"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="datepicker-month-label">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                className="datepicker-nav-btn"
                onClick={nextMonth}
                aria-label="Next month"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Weekday labels */}
            <div className="datepicker-weekdays">
              {DAY_LABELS.map(d => <span key={d}>{d}</span>)}
            </div>

            {/* Day grid */}
            <div className="datepicker-grid">
              {cells.map((day, i) =>
                day === null ? (
                  <span key={`pad-${i}`} />
                ) : (
                  <button
                    key={day}
                    type="button"
                    disabled={isDisabled(viewYear, viewMonth, day)}
                    onClick={() => selectDay(day)}
                    aria-label={`${MONTH_NAMES[viewMonth]} ${day}, ${viewYear}`}
                    aria-pressed={isSelected(viewYear, viewMonth, day)}
                    className={[
                      'datepicker-day',
                      isDisabled(viewYear, viewMonth, day) ? 'disabled'  : '',
                      isSelected(viewYear, viewMonth, day) ? 'selected'  : '',
                      isToday(viewYear, viewMonth, day)    ? 'today'     : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {day}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
