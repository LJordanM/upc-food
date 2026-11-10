import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { PlannedMeal } from '../types'
import { buildDayPlan } from '../utils/dayPlans'
import { addDays } from '../utils/time'
import { useToday } from './useNow'

export interface NextMealInfo {
  meal: PlannedMeal
  isTomorrow: boolean
  /** Minutos hasta que empiece (0 si ya está en curso) */
  minutesUntil: number
  inProgress: boolean
}

/** La pregunta principal de la app: ¿cuándo es mi próxima comida? */
export function useNextMeal(): NextMealInfo | null {
  const { today, nowMinutes } = useToday()
  const schedule = useAppStore((s) => s.schedule)
  const settings = useAppStore((s) => s.settings)
  const logs = useAppStore((s) => s.logs)

  const todayMeals = useMemo(() => buildDayPlan(today, schedule, settings, logs).meals, [today, schedule, settings, logs])
  const tomorrow = addDays(today, 1)
  const tomorrowMeals = useMemo(() => buildDayPlan(tomorrow, schedule, settings, logs).meals, [tomorrow, schedule, settings, logs])

  const pending = todayMeals.find((m) => m.end > nowMinutes && !logs.some((l) => l.mealId === m.id))
  if (pending) {
    const inProgress = pending.start <= nowMinutes
    return { meal: pending, isTomorrow: false, inProgress, minutesUntil: inProgress ? 0 : pending.start - nowMinutes }
  }
  const first = tomorrowMeals[0]
  if (!first) return null
  return { meal: first, isTomorrow: true, inProgress: false, minutesUntil: 24 * 60 - nowMinutes + first.start }
}
