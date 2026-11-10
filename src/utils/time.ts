import type { DayOfWeek, ISODate, Minutes } from '../types'

/** "07:30" → 450 */
export function toMinutes(hhmm: string): Minutes {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** 450 → "07:30" */
export function toHHMM(min: Minutes): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function formatRange(start: Minutes, end: Minutes): string {
  return `${toHHMM(start)} - ${toHHMM(end)}`
}

/** 85 → "1 h 25 min" */
export function formatDuration(min: Minutes): string {
  const total = Math.max(0, Math.round(min))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

/** Redondea hacia arriba al múltiplo de `step` */
export function ceilTo(min: Minutes, step = 5): Minutes {
  return Math.ceil(min / step) * step
}

export function floorTo(min: Minutes, step = 5): Minutes {
  return Math.floor(min / step) * step
}

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(Math.max(value, lo), hi)
}

// ---------- Fechas ----------

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fromISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function dayOfWeek(iso: ISODate): DayOfWeek {
  return fromISODate(iso).getDay() as DayOfWeek
}

/** Lunes de la semana de la fecha dada */
export function startOfWeek(iso: ISODate): ISODate {
  const dow = dayOfWeek(iso)
  const diff = dow === 0 ? -6 : 1 - dow
  return addDays(iso, diff)
}

export function minutesOfDay(d: Date): Minutes {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
}

/** Timestamp (ms) de una fecha + minutos del día */
export function toTimestamp(iso: ISODate, min: Minutes): number {
  const d = fromISODate(iso)
  d.setMinutes(min)
  return d.getTime()
}

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const
export const DAY_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const
export const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const

/** "Viernes 2/10" (como en Mi UPC) */
export function formatDayChip(iso: ISODate): string {
  const d = fromISODate(iso)
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

export function greetingFor(min: Minutes): string {
  if (min < 12 * 60) return 'Buenos días'
  if (min < 19 * 60) return 'Buenas tardes'
  return 'Buenas noches'
}
