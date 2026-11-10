import type { ISODate, MealLog, PlannedMeal } from '../types'
import { addDays } from '../utils/time'

type DayPattern = { skip?: number[]; late?: number[]; viaOrder?: number[] }

/**
 * Patrón de cumplimiento para los días previos a hoy (1 = ayer).
 * Resultado aproximado: ~80 % semanal y racha de 3 días.
 */
const PATTERN: Record<number, DayPattern> = {
  1: { viaOrder: [2] },
  2: { late: [3], viaOrder: [1] },
  3: { skip: [1], viaOrder: [2] },
  4: { skip: [1, 3] },
  5: { viaOrder: [2] },
  6: { skip: [2] },
  7: {},
}

const SKIP_REASONS = ['No tuve tiempo', 'Tenía examen', 'No tenía hambre']

/**
 * Genera un historial de ejemplo para los 7 días anteriores a `today`.
 * `planFor` devuelve las comidas planificadas de una fecha.
 */
export function generateSampleHistory(today: ISODate, planFor: (date: ISODate) => PlannedMeal[]): MealLog[] {
  const logs: MealLog[] = []
  for (let k = 7; k >= 1; k--) {
    const date = addDays(today, -k)
    const pattern = PATTERN[k] ?? {}
    for (const meal of planFor(date)) {
      const i = meal.index
      if (pattern.skip?.includes(i)) {
        logs.push({
          mealId: meal.id,
          date,
          label: meal.label,
          plannedStart: meal.start,
          status: 'omitida',
          onTime: false,
          viaOrder: false,
          skipReason: SKIP_REASONS[(k + i) % SKIP_REASONS.length],
        })
        continue
      }
      const late = pattern.late?.includes(i)
      logs.push({
        mealId: meal.id,
        date,
        label: meal.label,
        plannedStart: meal.start,
        status: 'realizada',
        actualTime: late ? meal.start + 50 : meal.start,
        onTime: !late,
        viaOrder: !!pattern.viaOrder?.includes(i),
      })
    }
  }
  return logs
}
