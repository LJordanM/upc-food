import type { Order, OrderStatus } from '../types'

export const MINUTE = 60_000

/** Cuánto dura el estado "recibido" antes de pasar a "preparando" */
const RECEIVED_MS = 1 * MINUTE

export interface OrderTiming {
  /** Momento en que el pedido se envía a cocina */
  sendAt: number
  /** Momento en que estará listo */
  readyAt: number
  /** El pedido se hizo tarde: estará listo después de la hora planificada */
  late: boolean
  /** Minutos de retraso respecto a la hora de la comida */
  delayMinutes: number
}

/**
 * Calcula cuándo enviar un pedido para que esté listo justo a la hora de la comida.
 * Ej.: comida 13:00, preparación 15 min → se envía 12:45.
 * Si esa hora ya pasó, se envía de inmediato y se informa el retraso.
 */
export function computeOrderTiming(mealStartTs: number, prepMinutes: number, nowTs: number): OrderTiming {
  const idealSend = mealStartTs - prepMinutes * MINUTE
  if (idealSend >= nowTs) {
    return { sendAt: idealSend, readyAt: mealStartTs, late: false, delayMinutes: 0 }
  }
  const readyAt = nowTs + prepMinutes * MINUTE
  const delayMinutes = Math.max(0, Math.ceil((readyAt - mealStartTs) / MINUTE))
  return { sendAt: nowTs, readyAt, late: delayMinutes > 0, delayMinutes }
}

/** Estado de un pedido en función del reloj (la API simulada no necesita timers) */
export function getOrderStatusAt(order: Order, nowTs: number): OrderStatus {
  if (order.cancelledAt) return 'cancelado'
  if (order.pickedUpAt) return 'recogido'
  if (nowTs < order.sendAt) return 'programado'
  if (nowTs < Math.min(order.sendAt + RECEIVED_MS, order.readyAt)) return 'recibido'
  if (nowTs < order.readyAt) return 'preparando'
  return 'listo'
}

/** Siguiente instante en que cambia el estado (para el botón demo "Siguiente estado") */
export function nextTransitionAt(order: Order, nowTs: number): number | null {
  const status = getOrderStatusAt(order, nowTs)
  if (status === 'programado') return order.sendAt
  if (status === 'recibido') return Math.min(order.sendAt + RECEIVED_MS, order.readyAt)
  if (status === 'preparando') return order.readyAt
  return null
}

export const ORDER_STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: 'programado', label: 'Programado', hint: 'Se enviará automáticamente' },
  { status: 'recibido', label: 'Pedido recibido', hint: 'La cafetería confirmó tu pedido' },
  { status: 'preparando', label: 'Preparando', hint: 'Tu comida se está cocinando' },
  { status: 'listo', label: 'Listo para recoger', hint: 'Acércate al mostrador Pick-up' },
  { status: 'recogido', label: 'Recogido', hint: '¡Buen provecho!' },
]

export function stepIndex(status: OrderStatus): number {
  return ORDER_STEPS.findIndex((s) => s.status === status)
}

export function isOrderActive(status: OrderStatus): boolean {
  return status !== 'recogido' && status !== 'cancelado'
}

export function generatePickupCode(): string {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ'
  const l = letters[Math.floor(Math.random() * letters.length)]
  return `${l}-${String(Math.floor(Math.random() * 90) + 10)}`
}

export function formatPrice(value: number): string {
  return `S/ ${value.toFixed(2)}`
}
