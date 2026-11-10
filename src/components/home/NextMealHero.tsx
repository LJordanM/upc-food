import clsx from 'clsx'
import { Check, Info, MapPin, ShoppingBag, Timer, Utensils } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CAFETERIA_MENU } from '../../data/cafeteriaMenu'
import { useMealActions, useOrderForMeal, useOrderStatus } from '../../hooks/useMealActions'
import type { NextMealInfo } from '../../hooks/useNextMeal'
import { useAppStore } from '../../store/useAppStore'
import { ORDER_STEPS, stepIndex } from '../../utils/orders'
import { formatDuration, formatRange, toHHMM } from '../../utils/time'
import { MealIcon } from '../meals/mealMeta'
import { PLACES } from '../meals/MealDetailSheet'
import { Button } from '../ui'

/** Tarjeta principal: responde "¿Cuándo es mi próxima comida?" */
export function NextMealHero({ info, onOpen }: { info: NextMealInfo; onOpen: () => void }) {
  const navigate = useNavigate()
  const { meal, minutesUntil, inProgress, isTomorrow } = info
  const order = useOrderForMeal(meal.id)
  const status = useOrderStatus(order)
  const place = useAppStore((s) => s.mealPlaces[meal.id] ?? 'cafeteria')
  const { markDone } = useMealActions()
  const dish = order ? CAFETERIA_MENU.find((m) => m.id === order.items[0]?.menuItemId) : undefined
  const soon = !isTomorrow && minutesUntil <= 30

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-brand-900 p-5 text-white shadow-float">
      <div className="pointer-events-none absolute -top-16 -right-14 size-48 rounded-full bg-brand-800" />
      <div className="pointer-events-none absolute -right-6 -bottom-20 size-40 rounded-full bg-brand-950/50" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="font-display text-[22px] leading-none tracking-wider text-brand-200">Tu próxima comida</p>
          {isTomorrow && <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">Mañana</span>}
        </div>

        <button onClick={onOpen} className="mt-2 flex items-end gap-3 text-left">
          <span className="font-display text-[84px] leading-[0.8] tracking-wide">{toHHMM(meal.start)}</span>
          <span className="mb-1 flex items-center gap-1.5 rounded-xl bg-white/12 px-2.5 py-1 text-sm font-semibold whitespace-nowrap">
            <MealIcon label={meal.label} size={16} /> {meal.label}
          </span>
        </button>

        <div
          className={clsx(
            'mt-4 inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-[15px] font-bold',
            inProgress || soon ? 'bg-accent-400 text-brand-950' : 'bg-white/12 text-white',
          )}
        >
          <Timer size={18} />
          {inProgress ? '¡Es ahora! Tienes tu espacio reservado' : `Faltan ${formatDuration(minutesUntil)}`}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="flex items-center gap-1 text-xs text-brand-200">
              <MapPin size={13} /> Lugar
            </p>
            <p className="font-semibold">{PLACES.find((p) => p.id === place)?.label}</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-brand-200">
              <Utensils size={13} /> Comida
            </p>
            <p className="truncate font-semibold">{dish ? `${dish.emoji} ${dish.name}` : 'Por elegir'}</p>
          </div>
        </div>

        {meal.status !== 'ideal' && (
          <p className="mt-3 flex gap-1.5 text-xs leading-snug text-brand-100/90">
            <Info size={14} className="mt-px shrink-0" />
            {meal.status === 'reubicada'
              ? `Reubicada: tu hora ideal era ${toHHMM(meal.target)}. Libre ${formatRange(meal.slot.start, meal.slot.end)}.`
              : meal.status === 'snack-rapido'
                ? `Solo tienes ${meal.slot.duration} min libres: pide algo rápido o lleva un snack.`
                : 'Día cargado: lleva un snack para el camino.'}
          </p>
        )}

        {order && status && (
          <div className="mt-4 rounded-2xl bg-white/10 p-3">
            <div className="mb-2 flex justify-between text-xs">
              <span className="font-semibold">Pedido {order.pickupCode}</span>
              <span className="text-accent-300">{ORDER_STEPS[stepIndex(status)]?.label}</span>
            </div>
            <div className="flex gap-1">
              {ORDER_STEPS.slice(0, 4).map((s, i) => (
                <div key={s.status} className={clsx('h-1.5 flex-1 rounded-full', i <= stepIndex(status) ? 'bg-accent-400' : 'bg-white/20')} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {order ? (
            <Button variant="accent" full icon={<ShoppingBag size={18} />} onClick={() => navigate(`/pedido/${order.id}`)}>
              Ver pedido
            </Button>
          ) : place === 'cafeteria' ? (
            <Button variant="accent" full icon={<ShoppingBag size={18} />} onClick={() => navigate(`/comidas?tab=menu&meal=${meal.id}`)}>
              Ordenar para recoger
            </Button>
          ) : (
            <Button variant="accent" full onClick={onOpen}>
              Ver detalle
            </Button>
          )}
        </div>
        {!isTomorrow && (inProgress || minutesUntil <= 20) && (
          <button
            onClick={() => markDone(meal)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-white/12 py-2.5 text-sm font-semibold transition hover:bg-white/20"
          >
            <Check size={18} /> Ya comí, marcar como realizada
          </button>
        )}
      </div>
    </div>
  )
}
