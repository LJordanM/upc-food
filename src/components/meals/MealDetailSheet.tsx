import clsx from 'clsx'
import { Check, ChevronRight, Info, ShoppingBag, Undo2, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMealActions, useOrderForMeal, useOrderStatus } from '../../hooks/useMealActions'
import { useAppStore } from '../../store/useAppStore'
import type { MealPlace, PlannedMeal } from '../../types'
import { ORDER_STEPS } from '../../utils/orders'
import { formatRange, toHHMM } from '../../utils/time'
import { BottomSheet, Button } from '../ui'
import { MealIcon, MealStatusBadge } from './mealMeta'

export const PLACES: { id: MealPlace; label: string }[] = [
  { id: 'cafeteria', label: 'Cafetería UPC' },
  { id: 'propia', label: 'Traje mi comida' },
  { id: 'otro', label: 'Otro lugar' },
]

const SKIP_REASONS = ['No tuve tiempo', 'No tenía hambre', 'Tenía examen', 'Comí en otro horario']

export function MealDetailSheet({ meal, onClose }: { meal: PlannedMeal | null; onClose: () => void }) {
  const navigate = useNavigate()
  const { markDone, skip, undo } = useMealActions()
  const log = useAppStore((s) => (meal ? s.logs.find((l) => l.mealId === meal.id) : undefined))
  const place = useAppStore((s) => (meal ? (s.mealPlaces[meal.id] ?? 'cafeteria') : 'cafeteria'))
  const setMealPlace = useAppStore((s) => s.setMealPlace)
  const order = useOrderForMeal(meal?.id)
  const orderStatus = useOrderStatus(order)
  const [skipping, setSkipping] = useState(false)

  const close = () => {
    setSkipping(false)
    onClose()
  }

  return (
    <BottomSheet open={!!meal} onClose={close}>
      {meal && (
        <div>
          <div className="mb-4 flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-800">
              <MealIcon label={meal.label} size={26} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-muted">{meal.label}</p>
              <p className="font-display text-[40px] leading-none text-brand-900">{toHHMM(meal.start)}</p>
            </div>
            <MealStatusBadge status={meal.status} />
          </div>

          <div className="mb-4 rounded-2xl bg-canvas p-4">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted uppercase">
              <Info size={14} /> ¿Por qué a esta hora?
            </p>
            <p className="text-sm leading-snug">{meal.reason}</p>
            <p className="mt-2 text-xs text-muted">
              Espacio libre: {formatRange(meal.slot.start, meal.slot.end)} · comida de {meal.end - meal.start} min
            </p>
          </div>

          <p className="mb-2 text-sm font-semibold">¿Dónde comerás?</p>
          <div className="mb-4 flex gap-2">
            {PLACES.map((p) => (
              <button
                key={p.id}
                onClick={() => setMealPlace(meal.id, p.id)}
                className={clsx(
                  'rounded-full border-2 px-3 py-1.5 text-sm font-semibold',
                  place === p.id ? 'border-brand-800 bg-brand-800 text-white' : 'border-line text-ink',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {order && (
            <button
              onClick={() => {
                close()
                navigate(`/pedido/${order.id}`)
              }}
              className="mb-4 flex w-full items-center gap-3 rounded-2xl border-2 border-brand-200 p-3 text-left"
            >
              <ShoppingBag className="text-brand-700" size={20} />
              <div className="flex-1">
                <p className="text-sm font-bold">Pedido {order.pickupCode}</p>
                <p className="text-xs text-muted">{ORDER_STEPS.find((s) => s.status === orderStatus)?.label ?? 'Cancelado'}</p>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </button>
          )}

          {log ? (
            <div className="flex items-center justify-between rounded-2xl bg-brand-50 p-4">
              <p className="font-semibold text-brand-900">
                {log.status === 'realizada'
                  ? `Realizada ${log.actualTime !== undefined ? `a las ${toHHMM(log.actualTime)}` : ''}`
                  : `Omitida · ${log.skipReason}`}
              </p>
              <Button size="sm" variant="ghost" icon={<Undo2 size={16} />} onClick={() => undo(meal.id)}>
                Deshacer
              </Button>
            </div>
          ) : skipping ? (
            <div>
              <p className="mb-2 text-sm font-semibold">¿Qué pasó? (nos ayuda a reprogramar mejor)</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {SKIP_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      skip(meal, r)
                      close()
                    }}
                    className="rounded-full bg-canvas px-3 py-2 text-sm font-semibold"
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Button full variant="ghost" onClick={() => setSkipping(false)}>
                Volver
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {!order && place === 'cafeteria' && (
                <Button
                  full
                  variant="accent"
                  icon={<ShoppingBag size={18} />}
                  onClick={() => {
                    close()
                    navigate(`/comidas?tab=menu&meal=${meal.id}`)
                  }}
                >
                  Ordenar para recoger
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  full
                  icon={<Check size={18} />}
                  onClick={() => {
                    markDone(meal)
                    close()
                  }}
                >
                  Ya comí
                </Button>
                <Button variant="secondary" icon={<X size={18} />} onClick={() => setSkipping(true)}>
                  Omitir
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  )
}
