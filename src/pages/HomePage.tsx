import { CalendarClock, ChevronRight, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DayTimeline } from '../components/home/DayTimeline'
import { NextMealHero } from '../components/home/NextMealHero'
import { AppHeader } from '../components/layout/AppHeader'
import { MealDetailSheet } from '../components/meals/MealDetailSheet'
import { Card, Chip, SectionHeader } from '../components/ui'
import { useDayPlan } from '../hooks/useDayPlan'
import { useNextMeal } from '../hooks/useNextMeal'
import { useToday } from '../hooks/useNow'
import { useAppStore } from '../store/useAppStore'
import type { PlannedMeal } from '../types'
import { addDays, formatDayChip, greetingFor, startOfWeek } from '../utils/time'

export default function HomePage() {
  const navigate = useNavigate()
  const { today, nowMinutes } = useToday()
  const profile = useAppStore((s) => s.profile)
  const logs = useAppStore((s) => s.logs)
  const next = useNextMeal()
  const [dayOffset, setDayOffset] = useState(0)
  const [openMeal, setOpenMeal] = useState<PlannedMeal | null>(null)
  const date = addDays(today, dayOffset)
  const plan = useDayPlan(date)

  // Reto semanal: días de esta semana con almuerzo realizado
  const challenge = useMemo(() => {
    const monday = startOfWeek(today)
    const days = new Set(logs.filter((l) => l.date >= monday && l.date <= today && l.label === 'Almuerzo' && l.status === 'realizada').map((l) => l.date))
    return Math.min(days.size, 5)
  }, [logs, today])

  return (
    <div className="px-5 pb-6">
      <AppHeader />

      <div className="mb-5">
        <p className="text-[26px] leading-tight text-brand-700">{greetingFor(nowMinutes)},</p>
        <p className="text-[30px] leading-tight font-extrabold text-brand-900">{profile?.name}</p>
      </div>

      {next ? (
        <NextMealHero info={next} onOpen={() => setOpenMeal(next.meal)} />
      ) : (
        <Card>
          <p className="text-muted">No hay comidas planificadas. Revisa tu horario o tu configuración.</p>
        </Card>
      )}

      <Card className="mt-6">
        <SectionHeader icon={<CalendarClock size={22} />} title="Tu día" action="Ver horario" to="/horario" />
        <div className="mt-4 mb-4 flex gap-2">
          <Chip active={dayOffset === 0} onClick={() => setDayOffset(0)}>
            Hoy {formatDayChip(today)}
          </Chip>
          <Chip active={dayOffset === 1} onClick={() => setDayOffset(1)}>
            Mañana {formatDayChip(addDays(today, 1))}
          </Chip>
        </div>
        <DayTimeline plan={plan} isToday={dayOffset === 0} nowMinutes={nowMinutes} onMealClick={setOpenMeal} />
      </Card>

      <button
        onClick={() => navigate('/progreso')}
        className="mt-6 flex w-full overflow-hidden rounded-3xl text-left shadow-card transition active:scale-[0.99]"
      >
        <div className="grid w-24 shrink-0 place-items-center bg-accent-100">
          <div className="grid size-16 place-items-center rounded-full bg-accent-400 text-brand-950 shadow-[inset_0_-4px_0_rgba(0,0,0,0.12)]">
            <Trophy size={30} />
          </div>
        </div>
        <div className="flex-1 bg-brand-900 p-4 text-white">
          <p className="font-display text-[22px] leading-none tracking-wider text-accent-400">Reto de la semana</p>
          <p className="mt-1.5 text-sm leading-snug">
            No te saltes el <b>almuerzo</b> durante 5 días de clases.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i < challenge ? 'bg-accent-400' : 'bg-white/20'}`} />
              ))}
            </div>
            <span className="text-sm font-bold">{challenge}/5</span>
            <ChevronRight size={18} />
          </div>
        </div>
      </button>

      <MealDetailSheet meal={openMeal} onClose={() => setOpenMeal(null)} />
    </div>
  )
}
