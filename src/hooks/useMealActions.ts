import { useEffect, useState } from 'react'
import { cafeteriaApi } from '../services'
import { useAppStore } from '../store/useAppStore'
import type { MenuItem, Order, PlannedMeal } from '../types'
import { getOrderStatusAt } from '../utils/orders'
import { isOnTime } from '../utils/progress'
import { floorTo } from '../utils/time'
import { useToday } from './useNow'

/** Registrar comidas (la "rutina" cumplida) */
export function useMealActions() {
  const { today, nowMinutes } = useToday()
  const logMeal = useAppStore((s) => s.logMeal)
  const undoLog = useAppStore((s) => s.undoLog)
  const orders = useAppStore((s) => s.orders)

  const markDone = (meal: PlannedMeal) => {
    // Si se registra hoy cerca de la comida, se usa la hora real; si no, la planificada
    const nearNow = meal.date === today && nowMinutes >= meal.start - 90 && nowMinutes <= meal.end + 180
    const actualTime = nearNow ? floorTo(nowMinutes, 5) : meal.start
    const viaOrder = orders.some((o) => o.mealId === meal.id && o.pickedUpAt)
    logMeal({
      mealId: meal.id,
      date: meal.date,
      label: meal.label,
      plannedStart: meal.start,
      status: 'realizada',
      actualTime: Math.max(0, actualTime),
      onTime: isOnTime(meal.start, actualTime),
      viaOrder,
    })
  }

  const skip = (meal: PlannedMeal, reason: string) => {
    logMeal({
      mealId: meal.id,
      date: meal.date,
      label: meal.label,
      plannedStart: meal.start,
      status: 'omitida',
      onTime: false,
      viaOrder: false,
      skipReason: reason,
    })
  }

  return { markDone, skip, undo: undoLog }
}

/** Pedido vigente (no cancelado) para una comida */
export function useOrderForMeal(mealId: string | undefined): Order | undefined {
  return useAppStore((s) => (mealId ? s.orders.find((o) => o.mealId === mealId && !o.cancelledAt) : undefined))
}

export function useOrderStatus(order: Order | undefined) {
  const { now } = useToday()
  return order ? getOrderStatusAt(order, now) : undefined
}

// Menú desde la API (mock), con caché en memoria
let menuCache: MenuItem[] | null = null
export function useMenu(date: string): MenuItem[] {
  const [menu, setMenu] = useState<MenuItem[]>(menuCache ?? [])
  useEffect(() => {
    let alive = true
    cafeteriaApi.getMenu(date).then((m) => {
      menuCache = m
      if (alive) setMenu(m)
    })
    return () => {
      alive = false
    }
  }, [date])
  return menu
}
