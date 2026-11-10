import clsx from 'clsx'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { ClassSession, DayOfWeek } from '../../types'
import { DAY_ABBR, formatRange, toHHMM, toMinutes } from '../../utils/time'
import { BottomSheet, Button, Field, inputClass } from '../ui'

const DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6]

export function ClassFormSheet({
  open,
  onClose,
  initial,
  defaultDay = 1,
}: {
  open: boolean
  onClose: () => void
  initial?: ClassSession
  defaultDay?: DayOfWeek
}) {
  const schedule = useAppStore((s) => s.schedule)
  const upsertClass = useAppStore((s) => s.upsertClass)
  const removeClass = useAppStore((s) => s.removeClass)

  const [name, setName] = useState('')
  const [day, setDay] = useState<DayOfWeek>(defaultDay)
  const [start, setStart] = useState('08:00')
  const [end, setEnd] = useState('09:30')
  const [location, setLocation] = useState('')

  useEffect(() => {
    if (!open) return
    setName(initial?.courseName ?? '')
    setDay(initial?.day ?? defaultDay)
    setStart(initial ? toHHMM(initial.start) : '08:00')
    setEnd(initial ? toHHMM(initial.end) : '09:30')
    setLocation(initial?.location ?? '')
  }, [open, initial, defaultDay])

  const s = toMinutes(start)
  const e = toMinutes(end)
  const overlap = schedule.find((c) => c.id !== initial?.id && c.day === day && s < c.end && c.start < e)
  const error = !name.trim()
    ? ''
    : e <= s
      ? 'La hora de fin debe ser posterior al inicio.'
      : overlap
        ? `Se cruza con ${overlap.courseName} (${formatRange(overlap.start, overlap.end)}).`
        : ''

  const save = () => {
    upsertClass({
      id: initial?.id ?? `cls-${Date.now().toString(36)}`,
      courseName: name.trim(),
      day,
      start: s,
      end: e,
      location: location.trim() || undefined,
      modality: 'presencial',
    })
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Editar curso' : 'Agregar curso'}>
      <div className="space-y-4">
        <Field label="Curso">
          <input className={inputClass} value={name} onChange={(ev) => setName(ev.target.value)} placeholder="Ej. Matemática Básica" />
        </Field>
        <Field label="Día">
          <div className="grid grid-cols-6 gap-1.5">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                className={clsx(
                  'rounded-xl py-2.5 text-sm font-bold transition',
                  d === day ? 'bg-brand-800 text-white' : 'bg-canvas text-ink hover:bg-brand-100',
                )}
              >
                {DAY_ABBR[d]}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inicio">
            <input type="time" step={300} className={inputClass} value={start} onChange={(ev) => setStart(ev.target.value)} />
          </Field>
          <Field label="Fin">
            <input type="time" step={300} className={inputClass} value={end} onChange={(ev) => setEnd(ev.target.value)} />
          </Field>
        </div>
        <Field label="Aula o ubicación (opcional)">
          <input className={inputClass} value={location} onChange={(ev) => setLocation(ev.target.value)} placeholder="Ej. A-305" />
        </Field>
        {error && <p className="rounded-xl bg-coral-50 px-3 py-2 text-sm font-medium text-coral-500">{error}</p>}
        <div className="flex gap-2 pt-1">
          {initial && (
            <Button
              variant="danger"
              onClick={() => {
                removeClass(initial.id)
                onClose()
              }}
              icon={<Trash2 size={18} />}
              aria-label="Eliminar curso"
            />
          )}
          <Button full disabled={!name.trim() || !!error} onClick={save}>
            {initial ? 'Guardar cambios' : 'Agregar al horario'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
