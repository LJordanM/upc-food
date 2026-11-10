import clsx from 'clsx'
import { AlertTriangle, Clock, Minus, Plus, Send, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CAFETERIA_HOURS } from '../../data/cafeteriaMenu'
import { useToday } from '../../hooks/useNow'
import { cafeteriaApi } from '../../services'
import { useAppStore } from '../../store/useAppStore'
import type { MenuItem, PlannedMeal } from '../../types'
import { computeOrderTiming, formatPrice } from '../../utils/orders'
import { minutesOfDay, toHHMM, toTimestamp } from '../../utils/time'
import { BottomSheet, Button } from '../ui'

const hhmm = (ts: number) => toHHMM(minutesOfDay(new Date(ts)))

/** Hoja para "Ordenar para recoger": calcula cuándo enviar el pedido para que esté listo a la hora de la comida */
export function OrderSheet({
  item,
  meals,
  initialMealId,
  onClose,
}: {
  item: MenuItem | null
  meals: PlannedMeal[]
  initialMealId?: string
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { now, today } = useToday()
  const addOrder = useAppStore((s) => s.addOrder)
  const pushNotification = useAppStore((s) => s.pushNotification)
  const setMealPlace = useAppStore((s) => s.setMealPlace)
  const orders = useAppStore((s) => s.orders)
  const [qty, setQty] = useState(1)
  const [mealId, setMealId] = useState<string | undefined>(initialMealId)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!item) return
    setQty(1)
    setMealId(initialMealId && meals.some((m) => m.id === initialMealId) ? initialMealId : meals[0]?.id)
    // Solo al abrir la hoja (la lista de comidas se recalcula cada segundo con el reloj)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item])

  const meal = meals.find((m) => m.id === mealId)
  const timing = item && meal ? computeOrderTiming(toTimestamp(meal.date, meal.start), item.prepMinutes, now) : null
  const readyMin = timing ? minutesOfDay(new Date(timing.readyAt)) : 0
  const closed = !!timing && (readyMin < CAFETERIA_HOURS.open || readyMin > CAFETERIA_HOURS.close)
  const existing = meal && orders.find((o) => o.mealId === meal.id && !o.cancelledAt && !o.pickedUpAt)

  const confirm = async () => {
    if (!item || !meal) return
    setSending(true)
    const order = await cafeteriaApi.createOrder({
      mealId: meal.id,
      mealLabel: meal.label,
      date: meal.date,
      mealStartTs: toTimestamp(meal.date, meal.start),
      items: [{ menuItemId: item.id, qty }],
      nowTs: now,
    })
    addOrder(order)
    setMealPlace(meal.id, 'cafeteria')
    pushNotification({
      key: `${order.id}-created`,
      type: 'order',
      title: 'Pedido programado',
      body: `Se enviará a la cafetería a las ${hhmm(order.sendAt)}. Código ${order.pickupCode}.`,
      link: `/pedido/${order.id}`,
      createdAt: now,
    })
    setSending(false)
    onClose()
    navigate(`/pedido/${order.id}`)
  }

  return (
    <BottomSheet open={!!item} onClose={onClose}>
      {item && (
        <div>
          <div className="mb-4 flex items-start gap-4">
            <div className="grid size-20 shrink-0 place-items-center rounded-3xl bg-brand-50 text-5xl">{item.emoji}</div>
            <div className="flex-1">
              <h3 className="font-display text-[30px] leading-none tracking-wide text-brand-900">{item.name}</h3>
              <p className="mt-1 text-sm leading-snug text-muted">{item.description}</p>
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-brand-700">
                <Clock size={13} /> Preparación: {item.prepMinutes} min
              </p>
            </div>
          </div>

          <p className="mb-2 text-sm font-semibold">¿Para qué comida?</p>
          {meals.length === 0 ? (
            <p className="mb-4 rounded-2xl bg-canvas p-3 text-sm text-muted">No tienes más comidas planificadas hoy.</p>
          ) : (
            <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 no-scrollbar">
              {meals.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMealId(m.id)}
                  className={clsx(
                    'shrink-0 rounded-2xl border-2 px-3.5 py-2 text-left transition',
                    m.id === mealId ? 'border-brand-800 bg-brand-800 text-white' : 'border-line bg-white',
                  )}
                >
                  <span className="block text-lg leading-none font-bold">{toHHMM(m.start)}</span>
                  <span className={clsx('text-xs', m.id === mealId ? 'text-white/80' : 'text-muted')}>
                    {m.label}
                    {m.date !== today ? ' · mañana' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}

          {timing && meal && (
            <div
              className={clsx(
                'mb-4 flex gap-3 rounded-2xl p-4',
                timing.late || closed ? 'bg-coral-50 text-coral-500' : 'bg-brand-50 text-brand-900',
              )}
            >
              {timing.late || closed ? <AlertTriangle size={20} className="mt-0.5 shrink-0" /> : <Send size={20} className="mt-0.5 shrink-0" />}
              <p className="text-[15px] leading-snug">
                {closed ? (
                  <>
                    La cafetería atiende de {toHHMM(CAFETERIA_HOURS.open)} a {toHHMM(CAFETERIA_HOURS.close)}.
                  </>
                ) : timing.late ? (
                  <>
                    Ya no llega justo a las {toHHMM(meal.start)}: si lo pides ahora estará listo a las <b>{hhmm(timing.readyAt)}</b> (
                    {timing.delayMinutes} min después).
                  </>
                ) : (
                  <>
                    Tu pedido se enviará a las <b>{hhmm(timing.sendAt)}</b> para que esté listo a las <b>{hhmm(timing.readyAt)}</b>.
                  </>
                )}
              </p>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs leading-tight text-muted">
              <Wallet size={18} className="shrink-0" />
              <span>
                Pago en caja al recoger
                <br />
                (simulado)
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-canvas p-1">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-8 place-items-center rounded-xl bg-white" aria-label="Menos">
                <Minus size={16} />
              </button>
              <span className="w-4 text-center font-bold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(5, q + 1))} className="grid size-8 place-items-center rounded-xl bg-white" aria-label="Más">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {existing && <p className="mb-3 text-xs text-muted">Ya tienes un pedido para esta comida; se reemplazará por este.</p>}

          <Button full size="lg" disabled={!meal || closed || sending} onClick={confirm}>
            {sending ? 'Enviando…' : `Ordenar para recoger · ${formatPrice(item.price * qty)}`}
          </Button>
        </div>
      )}
    </BottomSheet>
  )
}
