import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { DayTimeline } from '../components/home/DayTimeline'
import { MealDetailSheet } from '../components/meals/MealDetailSheet'
import { ClassFormSheet } from '../components/schedule/ClassFormSheet'
import { Button, PageTitle } from '../components/ui'
import { useDayPlan } from '../hooks/useDayPlan'
import { useToday } from '../hooks/useNow'
import type { ClassSession, DayOfWeek, PlannedMeal } from '../types'
import { addDays, DAY_NAMES, DAY_SHORT, dayOfWeek, fromISODate, startOfWeek } from '../utils/time'

const WEEK: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]

export default function SchedulePage() {
  const { today, nowMinutes } = useToday()
  const monday = startOfWeek(today)
  const [day, setDay] = useState<DayOfWeek>(dayOfWeek(today))
  const date = addDays(monday, day === 0 ? 6 : day - 1)
  const plan = useDayPlan(date)
  const [sheet, setSheet] = useState<{ open: boolean; initial?: ClassSession }>({ open: false })
  const [openMeal, setOpenMeal] = useState<PlannedMeal | null>(null)

  const freeBetween = plan.slots.filter((s) => s.kind === 'between')

  return (
    <div className="px-5 pt-4 pb-6">
      <PageTitle subtitle="Tus clases y los espacios que usamos para tus comidas.">Horario</PageTitle>

      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {WEEK.map((d, i) => {
          const dDate = addDays(monday, i)
          const active = d === day
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={clsx(
                'flex flex-col items-center rounded-2xl py-2 transition',
                active ? 'bg-brand-900 text-white shadow-float' : 'bg-white text-ink shadow-card',
              )}
            >
              <span className={clsx('text-xs font-semibold', active ? 'text-brand-200' : 'text-muted')}>{DAY_SHORT[d]}</span>
              <span className="text-lg leading-tight font-bold">{fromISODate(dDate).getDate()}</span>
              {dDate === today && <span className={clsx('mt-0.5 size-1.5 rounded-full', active ? 'bg-accent-400' : 'bg-brand-600')} />}
            </button>
          )
        })}
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <Stat value={plan.classes.length} label="clases" />
        <Stat value={freeBetween.length} label="espacios libres" />
        <Stat value={plan.meals.length} label="comidas" />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[26px] leading-none tracking-wide">{DAY_NAMES[day]}</h2>
        <Button size="sm" variant="secondary" icon={<Plus size={16} />} onClick={() => setSheet({ open: true })}>
          Agregar curso
        </Button>
      </div>

      <DayTimeline
        plan={plan}
        isToday={date === today}
        nowMinutes={nowMinutes}
        onMealClick={setOpenMeal}
        onClassClick={(c) => setSheet({ open: true, initial: c })}
      />

      <p className="mt-3 text-center text-xs text-muted">Toca un curso para editarlo. Las comidas se recalculan automáticamente.</p>

      <ClassFormSheet open={sheet.open} initial={sheet.initial} defaultDay={day === 0 ? 1 : day} onClose={() => setSheet({ open: false })} />
      <MealDetailSheet meal={openMeal} onClose={() => setOpenMeal(null)} />
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white px-2 py-3 shadow-card">
      <p className="font-display text-[30px] leading-none text-brand-800">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
}
