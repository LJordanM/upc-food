import type { ISODate, MealLog, Minutes, PlannedMeal } from '../types'

/** Minutos de cola que se estiman evitados por cada pedido anticipado */
export const QUEUE_MINUTES_SAVED = 12
/** Tolerancia para considerar una comida "en el horario sugerido" */
export const ON_TIME_TOLERANCE = 30
/** Un día cuenta como "organizado" si se cumplió al menos este % */
export const ORGANIZED_DAY_THRESHOLD = 0.75

export interface DayRecord {
  date: ISODate
  meals: PlannedMeal[]
  logs: MealLog[]
  isToday: boolean
}

export type HistoryEntryStatus = 'realizada' | 'fuera-de-horario' | 'omitida' | 'sin-registrar' | 'pendiente'

export interface HistoryEntry {
  meal: PlannedMeal
  log?: MealLog
  status: HistoryEntryStatus
}

export function isOnTime(planned: Minutes, actual: Minutes): boolean {
  return Math.abs(actual - planned) <= ON_TIME_TOLERANCE
}

/** Estado de cada comida de un día para el historial */
export function historyForDay(day: DayRecord, nowMinutes: Minutes): HistoryEntry[] {
  return day.meals.map((meal) => {
    const log = day.logs.find((l) => l.mealId === meal.id)
    let status: HistoryEntryStatus
    if (log?.status === 'realizada') status = log.onTime ? 'realizada' : 'fuera-de-horario'
    else if (log?.status === 'omitida') status = 'omitida'
    else if (day.isToday && meal.end > nowMinutes) status = 'pendiente'
    else status = 'sin-registrar'
    return { meal, log, status }
  })
}

export interface DayStats {
  date: ISODate
  planned: number
  done: number
  onTime: number
  ratio: number
}

/**
 * Para los días pasados cuentan todas las comidas planificadas.
 * Para hoy solo las que ya se registraron (las demás siguen pendientes).
 */
export function dayStats(day: DayRecord): DayStats {
  const logs = day.logs.filter((l) => day.meals.some((m) => m.id === l.mealId))
  const planned = day.isToday ? logs.length : day.meals.length
  const done = logs.filter((l) => l.status === 'realizada').length
  const onTime = logs.filter((l) => l.status === 'realizada' && l.onTime).length
  return { date: day.date, planned, done, onTime, ratio: planned ? done / planned : 0 }
}

export interface WeeklyStats {
  planned: number
  done: number
  onTime: number
  skipped: number
  percent: number
  days: DayStats[]
}

export function computeWeeklyStats(days: DayRecord[]): WeeklyStats {
  const stats = days.map(dayStats)
  const planned = stats.reduce((a, s) => a + s.planned, 0)
  const done = stats.reduce((a, s) => a + s.done, 0)
  const onTime = stats.reduce((a, s) => a + s.onTime, 0)
  const skipped = days.reduce((a, d) => a + d.logs.filter((l) => l.status === 'omitida').length, 0)
  return { planned, done, onTime, skipped, percent: planned ? Math.round((done / planned) * 100) : 0, days: stats }
}

/**
 * Racha: días consecutivos organizados (≥ 75 % de comidas realizadas).
 * `days` debe venir ordenado del más reciente al más antiguo. Hoy suma solo si ya está completo.
 */
export function computeStreak(days: DayRecord[]): number {
  let streak = 0
  for (const day of days) {
    const s = dayStats(day)
    const organized = s.planned > 0 && s.ratio >= ORGANIZED_DAY_THRESHOLD
    if (day.isToday) {
      const complete = day.meals.length > 0 && s.planned === day.meals.length
      if (complete && organized) streak++
      continue
    }
    if (!organized) break
    streak++
  }
  return streak
}

export interface HabitLoopStats {
  /** Señal: recordatorios que la app generó para tus comidas */
  signals: number
  /** Rutina: comidas hechas en el horario sugerido */
  routines: number
  /** Recompensa: minutos de cola evitados con pedidos anticipados */
  minutesSaved: number
  ordersPickedUp: number
}

export function computeHabitLoop(days: DayRecord[]): HabitLoopStats {
  const stats = days.map(dayStats)
  const signals = days.reduce((a, d) => a + (d.isToday ? d.logs.length : d.meals.length), 0)
  const routines = stats.reduce((a, s) => a + s.onTime, 0)
  const ordersPickedUp = days.reduce((a, d) => a + d.logs.filter((l) => l.status === 'realizada' && l.viaOrder).length, 0)
  return { signals, routines, minutesSaved: ordersPickedUp * QUEUE_MINUTES_SAVED, ordersPickedUp }
}
