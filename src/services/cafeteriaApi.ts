import { CAFETERIA_MENU, PICKUP_POINT } from '../data/cafeteriaMenu'
import type { ISODate, MealLabel, MenuItem, Order, OrderItem } from '../types'
import { computeOrderTiming, generatePickupCode } from '../utils/orders'

export interface CreateOrderRequest {
  mealId: string
  mealLabel: MealLabel
  date: ISODate
  /** Timestamp de inicio de la comida planificada */
  mealStartTs: number
  items: OrderItem[]
  /** Hora actual (del reloj de la app) */
  nowTs: number
}

/**
 * Contrato con la cafetería. Hoy lo implementa un mock; cuando exista la API real
 * basta con implementar HttpCafeteriaApi y definir VITE_CAFETERIA_API_URL.
 */
export interface CafeteriaApi {
  getMenu(date: ISODate): Promise<MenuItem[]>
  createOrder(req: CreateOrderRequest): Promise<Order>
  cancelOrder(orderId: string): Promise<void>
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class MockCafeteriaApi implements CafeteriaApi {
  async getMenu(): Promise<MenuItem[]> {
    await wait(150)
    return CAFETERIA_MENU
  }

  async createOrder(req: CreateOrderRequest): Promise<Order> {
    await wait(500)
    const items = req.items.map((i) => ({ item: CAFETERIA_MENU.find((m) => m.id === i.menuItemId)!, qty: i.qty }))
    // La cocina prepara en paralelo: manda el plato que más demora
    const prepMinutes = Math.max(...items.map((i) => i.item.prepMinutes))
    const total = items.reduce((a, i) => a + i.item.price * i.qty, 0)
    const timing = computeOrderTiming(req.mealStartTs, prepMinutes, req.nowTs)
    return {
      id: `ord-${Date.now().toString(36)}`,
      mealId: req.mealId,
      mealLabel: req.mealLabel,
      date: req.date,
      items: req.items,
      total,
      prepMinutes,
      createdAt: req.nowTs,
      sendAt: timing.sendAt,
      readyAt: timing.readyAt,
      late: timing.late,
      pickupCode: generatePickupCode(),
      pickupPoint: PICKUP_POINT,
    }
  }

  async cancelOrder(): Promise<void> {
    await wait(200)
  }
}

/** Esqueleto para conectar la API real de la cafetería */
export class HttpCafeteriaApi implements CafeteriaApi {
  constructor(private baseUrl: string) {}

  async getMenu(date: ISODate): Promise<MenuItem[]> {
    const res = await fetch(`${this.baseUrl}/menu?date=${date}`)
    if (!res.ok) throw new Error('No se pudo cargar el menú')
    return res.json()
  }

  async createOrder(req: CreateOrderRequest): Promise<Order> {
    const res = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new Error('No se pudo registrar el pedido')
    return res.json()
  }

  async cancelOrder(orderId: string): Promise<void> {
    await fetch(`${this.baseUrl}/orders/${orderId}`, { method: 'DELETE' })
  }
}
