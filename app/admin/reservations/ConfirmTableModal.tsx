'use client'

import { useState, useEffect } from 'react'
import type { Reservation } from '@/lib/reservations'
import { formatDateCR } from '@/lib/reservations'
import { SALON_TABLES, TERRAZA_TABLES } from '@/lib/tables'
import { sameSlot } from '@/lib/time'

const ALL = [...SALON_TABLES, ...TERRAZA_TABLES]

function partyMax(partySize: string): number {
  if (partySize.includes('-')) return parseInt(partySize.split('-')[1]) || 2
  return parseInt(partySize) || 1
}

interface Props {
  reservation: Reservation
  onCancel: () => void
  onConfirmed: () => void
}

export default function ConfirmTableModal({ reservation, onCancel, onConfirmed }: Props) {
  const [zone, setZone]                     = useState<'salon' | 'terraza'>('salon')
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [occupiedIds, setOccupiedIds]       = useState<Set<string>>(new Set())
  const [loadingOccupied, setLoadingOccupied] = useState(true)
  const [submitting, setSubmitting]         = useState(false)

  // Load confirmed tables for same date+time so we can gray them out
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoadingOccupied(true)
      try {
        const res  = await fetch(`/api/admin/reservations?date=${reservation.date}&status=confirmed`)
        const json = await res.json()
        if (cancelled) return
        const taken = new Set<string>()
        for (const r of json.reservations ?? []) {
          if (r.id !== reservation.id && sameSlot(r.time, reservation.time)) {
            for (const tid of r.table_ids ?? []) taken.add(tid)
          }
        }
        setOccupiedIds(taken)
      } finally {
        if (!cancelled) setLoadingOccupied(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [reservation.id, reservation.date, reservation.time])

  const tables = zone === 'salon'
    ? SALON_TABLES.filter(t => !t.hidden)
    : TERRAZA_TABLES

  const selectedCapacity = selectedTables
    .map(id => ALL.find(t => t.id === id)?.capacity ?? 0)
    .reduce((a, b) => a + b, 0)

  const max = partyMax(reservation.party_size)

  const toggle = (id: string) =>
    setSelectedTables(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

  const handleConfirm = async () => {
    if (!selectedTables.length) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:         reservation.id,
          status:     'confirmed',
          zone,
          table_ids:  selectedTables,
        }),
      })
      if (res.ok) {
        onConfirmed()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al confirmar. Intente de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Confirmar Reserva
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            <span className="font-medium text-gray-700 dark:text-zinc-300">{reservation.name}</span>
            {' · '}{formatDateCR(reservation.date)}{' · '}{reservation.time}
            {' · '}{reservation.party_size} pax
          </p>
          {reservation.notes && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
              Nota: {reservation.notes}
            </p>
          )}
        </div>

        <div className="px-5 py-4">
          {/* Zone tabs */}
          <div className="flex gap-2 mb-4">
            {(['salon', 'terraza'] as const).map(z => (
              <button
                key={z}
                type="button"
                onClick={() => { setZone(z); setSelectedTables([]) }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  zone === z
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {z === 'salon' ? 'Salón' : 'Terraza'}
              </button>
            ))}
          </div>

          {/* Table grid */}
          {loadingOccupied ? (
            <div className="text-center text-sm text-gray-400 dark:text-zinc-500 py-8">
              Cargando mesas…
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {tables.map(t => {
                const occupied = occupiedIds.has(t.id)
                const selected = selectedTables.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={occupied}
                    onClick={() => toggle(t.id)}
                    className={`flex flex-col items-center justify-center rounded-xl p-2 border text-xs font-mono transition ${
                      occupied
                        ? 'bg-gray-100 dark:bg-zinc-800/40 border-gray-200 dark:border-zinc-700/50 text-gray-300 dark:text-zinc-600 cursor-not-allowed'
                        : selected
                        ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-orange-400 dark:hover:border-orange-500'
                    }`}
                  >
                    <span className="font-bold leading-none">{t.label}</span>
                    {t.capacity > 0 && (
                      <span className="mt-1 font-normal opacity-60">{t.capacity}p</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Capacity feedback */}
          <div className="mt-3 min-h-[1.25rem]">
            {selectedTables.length > 0 && selectedCapacity < max && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠ Capacidad seleccionada ({selectedCapacity} pax) menor al grupo ({max} pax)
              </p>
            )}
            {selectedTables.length > 0 && selectedCapacity >= max && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                ✓ {selectedTables.join(', ')} — {selectedCapacity} pax disponibles
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-zinc-700 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedTables.length || submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Confirmando…' : 'Confirmar Reserva'}
          </button>
        </div>

      </div>
    </div>
  )
}
