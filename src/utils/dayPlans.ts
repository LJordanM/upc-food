import { NUTRITION_RULES } from '../data/nutritionRules'
import type { ClassSession, ISODate, MealLog, MealSettings, Minutes } from '../types'
import { planDay, type DayPlan } from './mealPlanner'
import type { DayRecord } from './progress'
import { addDays, dayOfWeek } from './time'

/** Horas reales registradas para un día → { índice: minutos } */
export function actualStartsFor(date: ISODate, logs: MealLog[]): Record<number, Minutes> {
  const out: Record<number, Minutes> = {}
  for (const l of logs) {
    if (l.date !== date || l.status !== 'realizada' || l.actualTime === undefined) continue
    const index = Number(l.mealId.split('-').pop())
    out[index] = l.actualTime
  }
  return out
}

export function buildDayPlan(date: ISODate, schedule: ClassSession[], settings: MealSettings, logs: MealLog[] = []): DayPlan {
  const dow = dayOfWeek(date)
  return planDay(
    date,
    schedule.filter((c) => c.day === dow),
    settings,
    NUTRITION_RULES,
    actualStartsFor(date, logs),
  )
}

/** Registros de días (lunes → hoy) para estadísticas y racha */
export function buildDayRecords(
  dates: ISODate[],
  today: ISODate,
  schedule: ClassSession[],
  settings: MealSettings,
  logs: MealLog[],
): DayRecord[] {
  return dates.map((date) => ({
    date,
    isToday: date === today,
    meals: buildDayPlan(date, schedule, settings, logs).meals,
    logs: logs.filter((l) => l.date === date),
  }))
}

/** Fechas desde `from` hasta `to` inclusive */
export function dateRange(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}
