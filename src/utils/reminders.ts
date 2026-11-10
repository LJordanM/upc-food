import type { MealLog, NotificationType, Order, PlannedMeal } from '../types'
import { MINUTE } from './orders'
import { formatRange, toHHMM, toTimestamp } from './time'

export interface ReminderEvent {
  key: string
  at: number
  type: NotificationType
  title: string
  body: string
  link?: string
}

/** Minutos antes de la comida para el recordatorio principal (señal) */
export const REMINDER_BEFORE = 30
/** Minutos antes de la comida para sugerir pedir con anticipación */
export const ORDER_SUGGESTION_BEFORE = 60

/**
 * Genera los recordatorios del día. Son eventos puros con una clave única;
 * el motor (useReminderEngine) los dispara una sola vez cuando el reloj pasa por `at`.
 */
export function buildReminderEvents(meals: PlannedMeal[], orders: Order[], logs: MealLog[]): ReminderEvent[] {
  const events: ReminderEvent[] = []

  for (const meal of meals) {
    if (logs.some((l) => l.mealId === meal.id)) continue
    const startTs = toTimestamp(meal.date, meal.start)
    const order = orders.find((o) => o.mealId === meal.id && !o.cancelledAt)
    const lower = meal.label.toLowerCase()

    if (!order && meal.index > 0) {
      events.push({
        key: `${meal.id}-suggest`,
        at: startTs - ORDER_SUGGESTION_BEFORE * MINUTE,
        type: 'suggestion',
        title: `¿Pedimos tu ${lower}?`,
        body: `Ordénalo ahora y estará listo a las ${toHHMM(meal.start)}. Sin colas.`,
        link: '/comidas?tab=menu',
      })
    }

    events.push({
      key: `${meal.id}-pre30`,
      at: startTs - REMINDER_BEFORE * MINUTE,
      type: 'reminder',
      title: 'En 30 minutos es hora de comer.',
      body: `${meal.label} a las ${toHHMM(meal.start)} · espacio libre ${formatRange(meal.slot.start, meal.slot.end)}`,
      link: '/',
    })

    events.push({
      key: `${meal.id}-now`,
      at: startTs,
      type: 'reminder',
      title: `Es hora de tu ${lower}`,
      body: order ? 'Tu pedido te espera en el mostrador Pick-up.' : 'Tómate tu tiempo: tienes el espacio reservado.',
      link: '/',
    })
  }

  for (const order of orders) {
    if (order.cancelledAt || order.pickedUpAt) continue
    events.push({
      key: `${order.id}-prep`,
      at: Math.min(order.sendAt + MINUTE, order.readyAt),
      type: 'order',
      title: 'Tu comida está siendo preparada.',
      body: `Estará lista a las ${new Date(order.readyAt).toTimeString().slice(0, 5)}.`,
      link: `/pedido/${order.id}`,
    })
    events.push({
      key: `${order.id}-ready`,
      at: order.readyAt,
      type: 'order',
      title: 'Tu pedido está listo para recoger.',
      body: `Código ${order.pickupCode} · ${order.pickupPoint}`,
      link: `/pedido/${order.id}`,
    })
  }

  return events.sort((a, b) => a.at - b.at)
}

/** Ventana máxima hacia atrás para disparar un recordatorio que "se cruzó" (ej. al adelantar el reloj) */
export const REMINDER_GRACE = 45 * MINUTE

export function dueReminders(events: ReminderEvent[], nowTs: number, fired: Set<string>): ReminderEvent[] {
  return events.filter((e) => e.at <= nowTs && nowTs - e.at <= REMINDER_GRACE && !fired.has(e.key))
}
