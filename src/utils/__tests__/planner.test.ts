import { describe, expect, it } from 'vitest'
import { SAMPLE_SCHEDULE } from '../../data/sampleSchedule'
import { DEFAULT_MEAL_SETTINGS } from '../../data/sampleStudent'
import { NUTRITION_RULES } from '../../data/nutritionRules'
import type { ClassSession, DayOfWeek } from '../../types'
import { findAvailableSlots } from '../slots'
import { planDay, scheduleMeals } from '../mealPlanner'
import { toHHMM, toMinutes } from '../time'

const classesOf = (day: DayOfWeek) => SAMPLE_SCHEDULE.filter((c) => c.day === day)
const hhmm = (xs: { start: number; end: number }[]) => xs.map((s) => `${toHHMM(s.start)}-${toHHMM(s.end)}`)

describe('findAvailableSlots', () => {
  it('detecta los huecos del lunes de ejemplo', () => {
    const slots = findAvailableSlots(classesOf(1), { dayStart: toMinutes('06:00'), dayEnd: toMinutes('22:00') })
    expect(hhmm(slots)).toEqual(['06:00-08:00', '09:30-10:00', '11:30-12:00', '13:30-15:00', '17:00-22:00'])
    expect(slots.map((s) => s.kind)).toEqual(['before', 'between', 'between', 'between', 'after'])
  })

  it('fusiona clases que se cruzan o son contiguas', () => {
    const classes: ClassSession[] = [
      { id: 'a', courseName: 'A', day: 1, start: toMinutes('09:00'), end: toMinutes('11:00') },
      { id: 'b', courseName: 'B', day: 1, start: toMinutes('10:30'), end: toMinutes('12:00') },
      { id: 'c', courseName: 'C', day: 1, start: toMinutes('12:00'), end: toMinutes('13:00') },
    ]
    const slots = findAvailableSlots(classes, { dayStart: toMinutes('08:00'), dayEnd: toMinutes('15:00') })
    expect(hhmm(slots)).toEqual(['08:00-09:00', '13:00-15:00'])
  })

  it('un día sin clases es un solo espacio libre', () => {
    const slots = findAvailableSlots([], { dayStart: 360, dayEnd: 1320 })
    expect(slots).toHaveLength(1)
    expect(slots[0].duration).toBe(960)
  })
})

describe('scheduleMeals', () => {
  it('lunes: 07:00, 11:30 (reubicada), 14:30 y 18:30', () => {
    const { meals } = planDay('2026-09-28', classesOf(1), DEFAULT_MEAL_SETTINGS)
    expect(meals.map((m) => toHHMM(m.start))).toEqual(['07:00', '11:30', '14:30', '18:30'])
    expect(meals.map((m) => m.label)).toEqual(['Desayuno', 'Media mañana', 'Almuerzo', 'Cena'])
    expect(meals[1].status).toBe('reubicada')
    expect(meals[1].target).toBe(toMinutes('11:00'))
    expect(meals[1].tight).toBe(true)
    expect(meals[1].reason).toContain('Introducción a la Ingeniería')
  })

  it('jueves: desayuno adelantado por clase a las 07:00 y snack rápido en micro-hueco', () => {
    const { meals } = planDay('2026-10-01', classesOf(4), DEFAULT_MEAL_SETTINGS)
    expect(toHHMM(meals[0].start)).toBe('06:30')
    expect(meals[0].status).toBe('reubicada')
    expect(meals[1].status).toBe('snack-rapido')
    expect(toHHMM(meals[1].start)).toBe('10:00')
    expect(toHHMM(meals[2].start)).toBe('14:00')
  })

  it('martes: clases seguidas → almuerzo fuera de rango con aviso', () => {
    const { meals } = planDay('2026-09-29', classesOf(2), DEFAULT_MEAL_SETTINGS)
    expect(toHHMM(meals[1].start)).toBe('13:00')
    expect(meals[1].status).toBe('fuera-de-rango')
    expect(meals[1].label).toBe('Almuerzo')
  })

  it('si a la hora objetivo hay clase, elige el hueco libre más cercano', () => {
    // Ejemplo del enunciado: desayuno 7:00 → 11:00, clase 10:00-11:30, hueco 11:30-12:15
    const classes: ClassSession[] = [
      { id: 'a', courseName: 'Clase', day: 1, start: toMinutes('10:00'), end: toMinutes('11:30') },
      { id: 'b', courseName: 'Otra', day: 1, start: toMinutes('12:15'), end: toMinutes('14:00') },
    ]
    const slots = findAvailableSlots(classes, { dayStart: 360, dayEnd: 1320 })
    const meals = scheduleMeals(slots, toMinutes('07:00'), 240, 25, { classes })
    expect(toHHMM(meals[1].start)).toBe('11:30')
  })

  it('recalcula el resto del día desde la hora real de una comida', () => {
    const base = planDay('2026-09-28', classesOf(1), DEFAULT_MEAL_SETTINGS)
    const shifted = planDay('2026-09-28', classesOf(1), DEFAULT_MEAL_SETTINGS, NUTRITION_RULES, {
      2: toMinutes('15:00') + 120, // almuerzo tarde → la cena se corre
    })
    expect(shifted.meals[3].start).toBeGreaterThan(base.meals[3].start)
  })

  it('nunca coloca una comida durante una clase (horarios aleatorios)', () => {
    let seed = 42
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let run = 0; run < 300; run++) {
      const classes: ClassSession[] = []
      let t = 420 + Math.floor(rand() * 4) * 30
      while (t < 1200) {
        const len = 60 + Math.floor(rand() * 5) * 30
        classes.push({ id: `c${t}`, courseName: 'X', day: 1, start: t, end: Math.min(t + len, 1260) })
        t += len + Math.floor(rand() * 6) * 15
      }
      const settings = {
        ...DEFAULT_MEAL_SETTINGS,
        hungerInterval: [180, 210, 240, 270, 300][Math.floor(rand() * 5)],
        minMealDuration: [15, 20, 25, 30, 45][Math.floor(rand() * 5)],
      }
      const { meals } = planDay('2026-09-28', classes, settings)
      for (const m of meals) {
        for (const c of classes) {
          const overlap = m.start < c.end && c.start < m.end
          expect(overlap, `${toHHMM(m.start)} cruza ${toHHMM(c.start)}-${toHHMM(c.end)}`).toBe(false)
        }
        expect(m.end).toBeLessThanOrEqual(settings.dayEnd)
      }
      for (let i = 1; i < meals.length; i++) expect(meals[i].start).toBeGreaterThanOrEqual(meals[i - 1].end)
    }
  })
})
