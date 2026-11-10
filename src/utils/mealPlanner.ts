import { NUTRITION_RULES } from '../data/nutritionRules'
import type {
  ClassSession,
  FreeSlot,
  ISODate,
  MealLabel,
  MealSettings,
  Minutes,
  NutritionRules,
  PlannedMeal,
  PlannedMealStatus,
} from '../types'
import { findAvailableSlots } from './slots'
import { ceilTo, clamp, floorTo, formatDuration, formatRange, toHHMM } from './time'

export interface ScheduleMealsOptions {
  rules?: NutritionRules
  date?: ISODate
  /** Clases del día: solo se usan para redactar la explicación */
  classes?: ClassSession[]
  /** Hora real en que se hizo la comida i (si ya se registró) → recalcula las siguientes */
  actualStarts?: Record<number, Minutes>
}

interface Candidate {
  slot: FreeSlot
  start: Minutes
  duration: Minutes
  dist: number
  slack: number
}

/** Redondea a múltiplos de 5 min sin salir del rango permitido */
function roundWithin(x: Minutes, lo: Minutes, hi: Minutes): Minutes {
  const up = ceilTo(x, 5)
  if (up <= hi) return up
  const down = floorTo(x, 5)
  if (down >= lo) return down
  return x
}

/** Último minuto en que puede terminar una comida dentro del hueco */
function latestEndIn(slot: FreeSlot, rules: NutritionRules): Minutes {
  return slot.nextClass ? slot.end - rules.bufferBeforeClass : slot.end
}

function byBest(a: Candidate, b: Candidate) {
  return a.dist - b.dist || a.start - b.start || b.slack - a.slack
}

const NEXT_LABEL: Record<MealLabel, MealLabel> = {
  Desayuno: 'Media mañana',
  'Media mañana': 'Almuerzo',
  Almuerzo: 'Lonche',
  Lonche: 'Cena',
  Cena: 'Cena',
}

/** Nombre de la comida según la hora del día (costumbre peruana) */
export function labelForTime(min: Minutes): MealLabel {
  if (min < 10 * 60 + 30) return 'Desayuno'
  if (min < 12 * 60) return 'Media mañana'
  if (min < 16 * 60) return 'Almuerzo'
  if (min < 18 * 60) return 'Lonche'
  return 'Cena'
}

/**
 * Asigna comidas a los espacios libres del día.
 *
 * - La primera comida apunta a `firstMealTime`; cada siguiente a `anterior + hungerInterval`.
 * - Solo se acepta un inicio dentro de la ventana [anterior + mín, anterior + máx] (y ± tolerancia del objetivo).
 * - Dentro de cada hueco se busca el inicio más cercano al objetivo; nunca se cruza con una clase
 *   y se deja un margen para llegar a la siguiente clase.
 * - Si no hay hueco suficiente: (2) snack rápido en un micro-hueco, (3) el hueco más cercano fuera
 *   de la ventana con aviso, (4) si no hay nada, se termina.
 */
export function scheduleMeals(
  freeSlots: FreeSlot[],
  firstMealTime: Minutes,
  hungerInterval: Minutes,
  minimumMealDuration: Minutes,
  options: ScheduleMealsOptions = {},
): PlannedMeal[] {
  const rules = options.rules ?? NUTRITION_RULES
  const date = options.date ?? ''
  const classes = options.classes ?? []
  const actual = options.actualStarts ?? {}
  const dur = minimumMealDuration
  if (freeSlots.length === 0) return []
  const dayEnd = Math.max(...freeSlots.map((s) => s.end))

  const meals: PlannedMeal[] = []
  let target = firstMealTime
  let prevStart: Minutes | null = null
  let prevEnd = -Infinity

  while (meals.length < rules.maxMealsPerDay) {
    // Si ni siquiera el objetivo cabe antes del fin del día, no se agregan más comidas
    if (target > dayEnd - dur) break

    let winLo = target - rules.tolerance
    let winHi = target + rules.tolerance
    if (prevStart !== null) {
      winLo = Math.max(prevStart + rules.minInterval, winLo)
      winHi = Math.min(prevStart + rules.maxInterval, winHi)
    }
    if (winLo > winHi) winLo = winHi = target

    let chosen: Candidate | undefined
    let status: PlannedMealStatus = 'ideal'

    // 1) Hueco donde entra la comida completa, dentro de la ventana recomendada
    const regular: Candidate[] = []
    for (const slot of freeSlots) {
      const lo = Math.max(slot.start, winLo, prevEnd)
      const latestEnd = latestEndIn(slot, rules)
      const hi = Math.min(latestEnd - dur, winHi)
      if (lo > hi) continue
      const start = roundWithin(clamp(target, lo, hi), lo, hi)
      regular.push({ slot, start, duration: dur, dist: Math.abs(start - target), slack: latestEnd - slot.start - dur })
    }
    if (regular.length) {
      chosen = regular.sort(byBest)[0]
      status = chosen.start === target ? 'ideal' : 'reubicada'
    }

    // 2) Micro-hueco dentro de la ventana → snack rápido
    if (!chosen) {
      const micro: Candidate[] = []
      for (const slot of freeSlots) {
        const lo = Math.max(slot.start, winLo, prevEnd)
        if (lo > winHi) continue
        const available = slot.end - lo
        if (available < rules.microSnackMin) continue
        micro.push({ slot, start: lo, duration: Math.min(dur, available), dist: Math.abs(lo - target), slack: 0 })
      }
      if (micro.length) {
        chosen = micro.sort(byBest)[0]
        status = 'snack-rapido'
      }
    }

    // 3) Hueco más cercano fuera de la ventana (con aviso)
    if (!chosen) {
      const outside: Candidate[] = []
      const minStart = prevStart === null ? -Infinity : prevStart + rules.absoluteMinGap
      for (const slot of freeSlots) {
        const lo = Math.max(slot.start, prevEnd, minStart)
        const latestEnd = latestEndIn(slot, rules)
        const hi = latestEnd - dur
        if (lo > hi) continue
        const start = roundWithin(clamp(target, lo, hi), lo, hi)
        outside.push({ slot, start, duration: dur, dist: Math.abs(start - target), slack: latestEnd - slot.start - dur })
      }
      if (outside.length) {
        chosen = outside.sort(byBest)[0]
        status = 'fuera-de-rango'
      }
    }

    // 4) Nada disponible
    if (!chosen) break

    const index = meals.length
    const start = chosen.start
    const end = start + chosen.duration
    const prevLabel = meals[index - 1]?.label
    let label = labelForTime(start)
    if (prevLabel && label === prevLabel) label = NEXT_LABEL[label]

    meals.push({
      id: `${date}-${index}`,
      date,
      index,
      label,
      start,
      end,
      target,
      slot: chosen.slot,
      status,
      reason: explain({ status, start, end, target, slot: chosen.slot, prevStart, winLo, winHi, dur, classes, index }),
      tight: chosen.slot.duration - chosen.duration <= 10,
    })

    // Si la comida ya se registró, el resto del día se recalcula desde la hora real
    const effectiveStart = actual[index] ?? start
    prevStart = effectiveStart
    prevEnd = effectiveStart + chosen.duration
    target = effectiveStart + hungerInterval
  }

  return meals
}

interface ExplainInput {
  status: PlannedMealStatus
  start: Minutes
  end: Minutes
  target: Minutes
  slot: FreeSlot
  prevStart: Minutes | null
  winLo: Minutes
  winHi: Minutes
  dur: Minutes
  classes: ClassSession[]
  index: number
}

function explain(i: ExplainInput): string {
  const slotText = formatRange(i.slot.start, i.slot.end)
  const conflict = i.classes.find((c) => c.start <= i.target && i.target < c.end)

  switch (i.status) {
    case 'ideal':
      if (i.index === 0) return `Coincide con tu hora habitual de desayuno y tienes libre de ${slotText}.`
      return `Han pasado ${formatDuration(i.start - (i.prevStart ?? i.start))} desde tu comida anterior y tienes un espacio libre de ${slotText}.`
    case 'reubicada': {
      const base = conflict
        ? `Tu comida ideal era a las ${toHHMM(i.target)}, pero tienes ${conflict.courseName} (${formatRange(conflict.start, conflict.end)}). Se movió al espacio libre más cercano (${slotText}).`
        : `Tu comida ideal era a las ${toHHMM(i.target)}. El espacio más cercano donde entran ${i.dur} min, dejando tiempo para llegar a tu clase, empieza a las ${toHHMM(i.start)}.`
      const tight = i.slot.duration - (i.end - i.start) <= 10 ? ' Es un espacio justo: te conviene pedir para recoger.' : ''
      return base + tight
    }
    case 'snack-rapido':
      return `Entre ${toHHMM(i.winLo)} y ${toHHMM(i.winHi)} no hay un espacio de ${i.dur} min. Aprovecha el hueco de ${slotText} para un snack rápido: pide algo listo en 5 min o lleva algo preparado.`
    case 'fuera-de-rango': {
      const since = i.prevStart === null ? '' : `, ${formatDuration(i.start - i.prevStart)} después de tu comida anterior`
      return `Tienes clases seguidas entre ${toHHMM(i.winLo)} y ${toHHMM(i.winHi)}. El espacio libre más cercano es a las ${toHHMM(i.start)}${since}. Lleva un snack para no pasar hambre.`
    }
  }
}

export interface DayPlan {
  date: ISODate
  classes: ClassSession[]
  slots: FreeSlot[]
  meals: PlannedMeal[]
}

/** Atajo que une ambos pasos para un día concreto */
export function planDay(
  date: ISODate,
  classesOfDay: ClassSession[],
  settings: MealSettings,
  rules: NutritionRules = NUTRITION_RULES,
  actualStarts?: Record<number, Minutes>,
): DayPlan {
  const classes = [...classesOfDay].sort((a, b) => a.start - b.start)
  const slots = findAvailableSlots(classes, {
    dayStart: Math.min(rules.dayStart, settings.firstMealTime),
    dayEnd: settings.dayEnd,
    minMealDuration: settings.minMealDuration,
  })
  const meals = scheduleMeals(slots, settings.firstMealTime, settings.hungerInterval, settings.minMealDuration, {
    rules,
    date,
    classes,
    actualStarts,
  })
  return { date, classes, slots, meals }
}
