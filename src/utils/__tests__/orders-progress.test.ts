import { describe, expect, it } from 'vitest'
import type { DayRecord } from '../progress'
import { computeStreak, computeWeeklyStats } from '../progress'
import { computeOrderTiming, getOrderStatusAt, MINUTE } from '../orders'
import { toTimestamp } from '../time'
import type { MealLog, Order, PlannedMeal } from '../../types'

describe('computeOrderTiming', () => {
  it('comida 13:00 con 15 min de preparación → envío 12:45', () => {
    const meal = toTimestamp('2026-10-02', 13 * 60)
    const now = toTimestamp('2026-10-02', 10 * 60)
    const t = computeOrderTiming(meal, 15, now)
    expect(new Date(t.sendAt).toTimeString().slice(0, 5)).toBe('12:45')
    expect(t.readyAt).toBe(meal)
    expect(t.late).toBe(false)
  })

  it('si ya es tarde, se envía de inmediato y avisa el retraso', () => {
    const meal = toTimestamp('2026-10-02', 13 * 60)
    const now = toTimestamp('2026-10-02', 12 * 60 + 55)
    const t = computeOrderTiming(meal, 15, now)
    expect(t.sendAt).toBe(now)
    expect(t.late).toBe(true)
    expect(t.delayMinutes).toBe(10)
  })
})

describe('getOrderStatusAt', () => {
  const sendAt = toTimestamp('2026-10-02', 12 * 60 + 45)
  const order = { sendAt, readyAt: sendAt + 15 * MINUTE } as Order
  it('recorre los estados según el reloj', () => {
    expect(getOrderStatusAt(order, sendAt - MINUTE)).toBe('programado')
    expect(getOrderStatusAt(order, sendAt)).toBe('recibido')
    expect(getOrderStatusAt(order, sendAt + 5 * MINUTE)).toBe('preparando')
    expect(getOrderStatusAt(order, sendAt + 15 * MINUTE)).toBe('listo')
    expect(getOrderStatusAt({ ...order, pickedUpAt: 1 }, sendAt + 20 * MINUTE)).toBe('recogido')
  })
})

describe('progreso', () => {
  const meal = (date: string, index: number) => ({ id: `${date}-${index}`, index, start: 600, end: 625 }) as PlannedMeal
  const log = (date: string, index: number, status: MealLog['status'] = 'realizada'): MealLog => ({
    mealId: `${date}-${index}`,
    date,
    label: 'Almuerzo',
    plannedStart: 600,
    status,
    onTime: status === 'realizada',
    viaOrder: false,
  })
  const day = (date: string, done: number, total = 4, isToday = false): DayRecord => ({
    date,
    isToday,
    meals: Array.from({ length: total }, (_, i) => meal(date, i)),
    logs: Array.from({ length: total }, (_, i) => log(date, i, i < done ? 'realizada' : 'omitida')),
  })

  it('porcentaje semanal', () => {
    const s = computeWeeklyStats([day('d1', 4), day('d2', 4), day('d3', 3), day('d4', 2), day('d5', 3)])
    expect(s.percent).toBe(80)
  })

  it('racha de días organizados (≥75 %)', () => {
    const days = [day('hoy', 1, 4, true), day('d4', 4), day('d3', 3), day('d2', 4), day('d1', 2)]
    days[0].logs = days[0].logs.slice(0, 1)
    expect(computeStreak(days)).toBe(3)
  })
})
