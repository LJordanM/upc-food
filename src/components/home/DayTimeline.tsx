import clsx from 'clsx'
import { BookOpen, Check, Coffee, X } from 'lucide-react'
import { CAFETERIA_MENU } from '../../data/cafeteriaMenu'
import { useAppStore } from '../../store/useAppStore'
import type { ClassSession, FreeSlot, PlannedMeal } from '../../types'
import type { DayPlan } from '../../utils/mealPlanner'
import { formatDuration, formatRange, toHHMM } from '../../utils/time'
import { MealIcon, STATUS_META } from '../meals/mealMeta'

type Item =
  | { kind: 'class'; start: number; end: number; data: ClassSession }
  | { kind: 'meal'; start: number; end: number; data: PlannedMeal }
  | { kind: 'free'; start: number; end: number; data: FreeSlot }

/** Combina clases, comidas y espacios libres en una sola línea de tiempo */
export function buildTimelineItems(plan: DayPlan): Item[] {
  const items: Item[] = [
    ...plan.classes.map((c) => ({ kind: 'class' as const, start: c.start, end: c.end, data: c })),
    ...plan.meals.map((m) => ({ kind: 'meal' as const, start: m.start, end: m.end, data: m })),
  ]
  // Solo se muestran los espacios libres entre clases que no tienen una comida asignada
  for (const s of plan.slots) {
    if (s.kind !== 'between') continue
    if (plan.meals.some((m) => m.start >= s.start && m.start < s.end)) continue
    items.push({ kind: 'free', start: s.start, end: s.end, data: s })
  }
  return items.sort((a, b) => a.start - b.start || (a.kind === 'meal' ? -1 : 1))
}

export function DayTimeline({
  plan,
  isToday,
  nowMinutes,
  onMealClick,
  onClassClick,
}: {
  plan: DayPlan
  isToday: boolean
  nowMinutes: number
  onMealClick: (m: PlannedMeal) => void
  onClassClick?: (c: ClassSession) => void
}) {
  const logs = useAppStore((s) => s.logs)
  const orders = useAppStore((s) => s.orders)
  const items = buildTimelineItems(plan)
  const nowIndex = isToday ? items.findIndex((i) => i.start > nowMinutes) : -1

  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-muted">Sin clases ni comidas planificadas.</p>
  }

  return (
    <ol className="relative">
      {items.map((item, idx) => {
        const past = isToday && item.end <= nowMinutes
        return (
          <li key={`${item.kind}-${item.start}-${idx}`}>
            {idx === nowIndex && <NowLine minutes={nowMinutes} />}
            <div className={clsx('flex gap-3', past && 'opacity-55')}>
              <div className="w-11 shrink-0 pt-3 text-right text-[13px] font-bold text-ink">{toHHMM(item.start)}</div>
              <div className="relative flex w-4 shrink-0 justify-center">
                <span className="absolute top-0 bottom-0 w-0.5 bg-line" />
                <span
                  className={clsx(
                    'relative mt-4 size-3 rounded-full ring-4 ring-canvas',
                    item.kind === 'meal' ? 'bg-brand-700' : item.kind === 'class' ? 'bg-ink/40' : 'bg-brand-300',
                  )}
                />
              </div>
              <div className="min-w-0 flex-1 pb-2.5">
                {item.kind === 'class' && (
                  <button
                    onClick={() => onClassClick?.(item.data)}
                    disabled={!onClassClick}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-card disabled:cursor-default"
                  >
                    <BookOpen size={18} className="shrink-0 text-muted" />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">{item.data.courseName}</p>
                      <p className="text-xs text-muted">
                        {formatRange(item.start, item.end)}
                        {item.data.location ? ` · ${item.data.location}` : ''}
                      </p>
                    </div>
                  </button>
                )}
                {item.kind === 'free' && (
                  <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 px-4 py-2.5 text-sm text-brand-700">
                    <Coffee size={16} />
                    Espacio libre · {formatDuration(item.end - item.start)}
                  </div>
                )}
                {item.kind === 'meal' && (
                  <MealRow
                    meal={item.data}
                    log={logs.find((l) => l.mealId === item.data.id)}
                    dish={orders.find((o) => o.mealId === item.data.id && !o.cancelledAt)?.items[0]?.menuItemId}
                    onClick={() => onMealClick(item.data)}
                  />
                )}
              </div>
            </div>
          </li>
        )
      })}
      {isToday && nowIndex === -1 && <NowLine minutes={nowMinutes} />}
    </ol>
  )
}

function MealRow({
  meal,
  log,
  dish,
  onClick,
}: {
  meal: PlannedMeal
  log?: { status: string }
  dish?: string
  onClick: () => void
}) {
  const dishItem = dish ? CAFETERIA_MENU.find((m) => m.id === dish) : undefined
  const meta = STATUS_META[meal.status]
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl bg-brand-100 px-4 py-3 text-left transition active:scale-[0.99]">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-800">
        <MealIcon label={meal.label} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-brand-900">{meal.label}</p>
        <p className="truncate text-xs text-brand-800/80">
          {dishItem ? `${dishItem.emoji} ${dishItem.name}` : meal.status === 'ideal' ? `${meal.end - meal.start} min reservados` : meta.text}
        </p>
      </div>
      {log?.status === 'realizada' && (
        <span className="grid size-7 place-items-center rounded-full bg-brand-700 text-white">
          <Check size={16} />
        </span>
      )}
      {log?.status === 'omitida' && (
        <span className="grid size-7 place-items-center rounded-full bg-coral-50 text-coral-500">
          <X size={16} />
        </span>
      )}
    </button>
  )
}

function NowLine({ minutes }: { minutes: number }) {
  return (
    <div className="my-1 flex items-center gap-3">
      <div className="w-11 shrink-0 text-right text-[11px] font-bold text-coral-500">{toHHMM(minutes)}</div>
      <div className="relative flex w-4 justify-center">
        <span className="size-2.5 rounded-full bg-coral-500" />
      </div>
      <div className="h-0.5 flex-1 rounded-full bg-coral-500/70" />
      <span className="text-[11px] font-bold tracking-wide text-coral-500 uppercase">Ahora</span>
    </div>
  )
}
