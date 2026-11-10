import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { ISODate } from '../types'
import { buildDayPlan } from '../utils/dayPlans'

/** Plan del día (clases, espacios libres y comidas) — se recalcula al cambiar horario, ajustes o registros */
export function useDayPlan(date: ISODate) {
  const schedule = useAppStore((s) => s.schedule)
  const settings = useAppStore((s) => s.settings)
  const logs = useAppStore((s) => s.logs)
  return useMemo(() => buildDayPlan(date, schedule, settings, logs), [date, schedule, settings, logs])
}
