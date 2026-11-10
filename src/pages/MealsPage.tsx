import clsx from 'clsx'
import { Check, ChevronDown, Clock, ShoppingBag, X, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MealDetailSheet } from '../components/meals/MealDetailSheet'
import { MealIcon, MealStatusBadge } from '../components/meals/mealMeta'
import { OrderSheet } from '../components/meals/OrderSheet'
import { Chip, PageTitle } from '../components/ui'
import { useDayPlan } from '../hooks/useDayPlan'
import { useMealActions, useMenu } from '../hooks/useMealActions'
import { useToday } from '../hooks/useNow'
import { useAppStore } from '../store/useAppStore'
import type { MenuItem, PlannedMeal } from '../types'
import { computeOrderTiming, formatPrice, getOrderStatusAt, ORDER_STEPS } from '../utils/orders'
import { addDays, formatRange, minutesOfDay, toHHMM, toTimestamp } from '../utils/time'

type Tab = 'plan' | 'menu'

export default function MealsPage() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'menu' ? 'menu' : 'plan'
  const setTab = (t: Tab) => setParams(t === 'menu' ? { tab: 'menu' } : {}, { replace: true })

  return (
    <div className="px-5 pt-4 pb-6">
      <PageTitle subtitle="Tu plan del día y el menú de la cafetería.">Comidas</PageTitle>
      <div className="mb-5 grid grid-cols-2 rounded-2xl bg-white p-1 shadow-card">
        {(['plan', 'menu'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx('rounded-xl py-2.5 text-sm font-bold transition', tab === t ? 'bg-brand-900 text-white' : 'text-muted')}
          >
            {t === 'plan' ? 'Plan de hoy' : 'Menú cafetería'}
          </button>
        ))}
      </div>
      {tab === 'plan' ? <PlanTab /> : <MenuTab initialMealId={params.get('meal') ?? undefined} />}
    </div>
  )
}

// ---------------- Plan de hoy ----------------
function PlanTab() {
  const { today, nowMinutes, now } = useToday()
  const [offset, setOffset] = useState(0)
  const date = addDays(today, offset)
  const { meals } = useDayPlan(date)
  const logs = useAppStore((s) => s.logs)
  const orders = useAppStore((s) => s.orders)
  const menu = useMenu(today)
  const { markDone } = useMealActions()
  const navigate = useNavigate()
  const [openMeal, setOpenMeal] = useState<PlannedMeal | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Chip active={offset === 0} onClick={() => setOffset(0)}>
          Hoy
        </Chip>
        <Chip active={offset === 1} onClick={() => setOffset(1)}>
          Mañana
        </Chip>
      </div>
      <div className="space-y-3">
        {meals.map((meal) => {
          const log = logs.find((l) => l.mealId === meal.id)
          const order = orders.find((o) => o.mealId === meal.id && !o.cancelledAt)
          const dish = order && menu.find((m) => m.id === order.items[0]?.menuItemId)
          const past = offset === 0 && meal.end <= nowMinutes
          const isOpen = expanded === meal.id
          return (
            <div key={meal.id} className={clsx('rounded-3xl bg-white p-4 shadow-card', past && !log && 'ring-2 ring-accent-300')}>
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-800">
                  <MealIcon label={meal.label} size={22} />
                </div>
                <div className="min-w-0 flex-1" onClick={() => setOpenMeal(meal)}>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[28px] leading-none text-brand-900">{toHHMM(meal.start)}</span>
                    <span className="font-semibold">{meal.label}</span>
                  </div>
                  <p className="text-xs text-muted">Espacio libre {formatRange(meal.slot.start, meal.slot.end)}</p>
                </div>
                {log ? (
                  <span
                    className={clsx(
                      'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                      log.status === 'realizada' ? 'bg-brand-700 text-white' : 'bg-coral-50 text-coral-500',
                    )}
                  >
                    {log.status === 'realizada' ? <Check size={14} /> : <X size={14} />}
                    {log.status === 'realizada' ? 'Hecha' : 'Omitida'}
                  </span>
                ) : (
                  <MealStatusBadge status={meal.status} />
                )}
              </div>

              <button onClick={() => setExpanded(isOpen ? null : meal.id)} className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-700">
                ¿Por qué a esta hora? <ChevronDown size={14} className={clsx('transition', isOpen && 'rotate-180')} />
              </button>
              {isOpen && <p className="mt-1.5 animate-fade-in rounded-2xl bg-canvas p-3 text-sm leading-snug">{meal.reason}</p>}

              {order && (
                <button
                  onClick={() => navigate(`/pedido/${order.id}`)}
                  className="mt-3 flex w-full items-center justify-between rounded-2xl bg-brand-50 px-3 py-2.5 text-sm"
                >
                  <span className="font-semibold">
                    {dish?.emoji} {dish?.name}
                  </span>
                  <span className="text-xs font-bold text-brand-700">
                    {ORDER_STEPS.find((s) => s.status === getOrderStatusAt(order, now))?.label ?? 'Cancelado'}
                  </span>
                </button>
              )}

              {!log && offset === 0 && (
                <div className="mt-3 flex gap-2">
                  {!order && (
                    <button
                      onClick={() => navigate(`/comidas?tab=menu&meal=${meal.id}`)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-accent-400 py-2.5 text-sm font-bold text-brand-950"
                    >
                      <ShoppingBag size={16} /> Ordenar
                    </button>
                  )}
                  <button
                    onClick={() => markDone(meal)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-brand-900 py-2.5 text-sm font-bold text-white"
                  >
                    <Check size={16} /> Ya comí
                  </button>
                  <button onClick={() => setOpenMeal(meal)} className="rounded-2xl bg-canvas px-4 text-sm font-bold text-muted">
                    Más
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <MealDetailSheet meal={openMeal} onClose={() => setOpenMeal(null)} />
    </div>
  )
}

// ---------------- Menú ----------------
const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'fast', label: 'Listos en ≤10 min' },
  { id: 'plato', label: 'Platos' },
  { id: 'para-llevar', label: 'Para llevar' },
  { id: 'bebida', label: 'Bebidas y snacks' },
] as const

function MenuTab({ initialMealId }: { initialMealId?: string }) {
  const { today, now, nowMinutes } = useToday()
  const menu = useMenu(today)
  const logs = useAppStore((s) => s.logs)
  const todayPlan = useDayPlan(today)
  const tomorrowPlan = useDayPlan(addDays(today, 1))
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const [selected, setSelected] = useState<MenuItem | null>(null)

  // Comidas a las que todavía se puede asociar un pedido
  const upcoming = useMemo(() => {
    const open = (m: PlannedMeal) => !logs.some((l) => l.mealId === m.id)
    const todays = todayPlan.meals.filter((m) => m.start > nowMinutes && open(m))
    return todays.length ? todays : tomorrowPlan.meals.filter(open).slice(0, 3)
  }, [todayPlan, tomorrowPlan, logs, nowMinutes])

  const [targetId, setTargetId] = useState<string | undefined>(initialMealId)
  const target = upcoming.find((m) => m.id === targetId) ?? upcoming[0]

  const items = menu.filter((m) => {
    if (filter === 'all') return true
    if (filter === 'fast') return m.prepMinutes <= 10
    if (filter === 'bebida') return m.category === 'bebida' || m.category === 'snack'
    if (filter === 'plato') return m.category === 'plato' || m.category === 'ensalada'
    return m.category === filter
  })

  return (
    <div>
      {target && (
        <div className="mb-4 rounded-3xl bg-brand-900 p-4 text-white">
          <p className="text-xs font-semibold text-brand-200">Pedido para</p>
          <div className="mt-1 -mx-1 flex gap-2 overflow-x-auto px-1 no-scrollbar">
            {upcoming.map((m) => (
              <button
                key={m.id}
                onClick={() => setTargetId(m.id)}
                className={clsx(
                  'shrink-0 rounded-2xl px-3 py-1.5 text-left text-sm font-semibold',
                  m.id === target.id ? 'bg-accent-400 text-brand-950' : 'bg-white/12',
                )}
              >
                {toHHMM(m.start)} · {m.label}
                {m.date !== today && ' (mañana)'}
              </button>
            ))}
          </div>
          {target.tight || target.status === 'snack-rapido' ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-accent-300">
              <Zap size={14} /> Espacio corto: te conviene algo listo rápido.
            </p>
          ) : null}
        </div>
      )}

      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 no-scrollbar">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <p className="mb-2 font-display text-[24px] leading-none tracking-wide">Menú del día</p>
      {menu.length === 0 && <p className="py-8 text-center text-sm text-muted">Cargando menú de la cafetería…</p>}
      <div className="space-y-3">
        {items.map((item) => {
          const timing = target ? computeOrderTiming(toTimestamp(target.date, target.start), item.prepMinutes, now) : null
          return (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-card transition active:scale-[0.99]"
            >
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-4xl">{item.emoji}</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{item.name}</p>
                <p className="truncate text-xs text-muted">{item.components.join(' · ')}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="font-bold text-brand-900">{formatPrice(item.price)}</span>
                  <span className="flex items-center gap-1 text-muted">
                    <Clock size={12} /> {item.prepMinutes} min
                  </span>
                  {timing &&
                    (timing.late ? (
                      <span className="font-semibold text-coral-500">+{timing.delayMinutes} min tarde</span>
                    ) : (
                      <span className="font-semibold text-brand-700">Se envía {toHHMM(minutesOfDay(new Date(timing.sendAt)))}</span>
                    ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <OrderSheet item={selected} meals={upcoming} initialMealId={target?.id} onClose={() => setSelected(null)} />
    </div>
  )
}
