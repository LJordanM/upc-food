import clsx from 'clsx'
import { CalendarSearch, Check, Loader2, Sparkles, UtensilsCrossed } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MealIcon } from '../../components/meals/mealMeta'
import { Button } from '../../components/ui'
import { useToday } from '../../hooks/useNow'
import { useAppStore } from '../../store/useAppStore'
import { buildDayPlan } from '../../utils/dayPlans'
import { addDays, formatDayChip, startOfWeek, toHHMM } from '../../utils/time'
import { OnboardingLayout } from './OnboardingLayout'

export default function GeneratingPlanPage() {
  const navigate = useNavigate()
  const { today } = useToday()
  const schedule = useAppStore((s) => s.schedule)
  const settings = useAppStore((s) => s.settings)
  const profile = useAppStore((s) => s.profile)
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const loadSampleHistory = useAppStore((s) => s.loadSampleHistory)
  const [step, setStep] = useState(0)
  const [withHistory, setWithHistory] = useState(true)

  const summary = useMemo(() => {
    const monday = startOfWeek(today)
    const week = Array.from({ length: 6 }, (_, i) => buildDayPlan(addDays(monday, i), schedule, settings))
    const slots = week.flatMap((p) => p.slots.filter((s) => s.kind === 'between'))
    return {
      days: new Set(schedule.map((c) => c.day)).size,
      slots: slots.length,
      usable: slots.filter((s) => s.fitsMeal).length,
      meals: week.reduce((a, p) => a + p.meals.length, 0),
      todayPlan: buildDayPlan(today, schedule, settings),
    }
  }, [today, schedule, settings])

  useEffect(() => {
    if (step >= 3) return
    const t = setTimeout(() => setStep((s) => s + 1), 900)
    return () => clearTimeout(t)
  }, [step])

  const steps = [
    { icon: CalendarSearch, title: 'Analizando tu horario', result: `${schedule.length} clases en ${summary.days} días` },
    {
      icon: Sparkles,
      title: 'Detectando espacios libres',
      result: `${summary.slots} espacios entre clases · ${summary.usable} aptos para comer`,
    },
    { icon: UtensilsCrossed, title: 'Asignando tus comidas', result: `${summary.meals} comidas planificadas esta semana` },
  ]

  const finish = () => {
    if (withHistory) loadSampleHistory()
    completeOnboarding()
    navigate('/')
  }

  return (
    <OnboardingLayout
      step={4}
      title={step < 3 ? 'Armando tu plan…' : `¡Listo, ${profile?.name ?? ''}!`}
      subtitle={step < 3 ? 'Esto toma un segundo.' : 'Tus comidas ya forman parte de tu horario.'}
      footer={
        <Button full size="lg" disabled={step < 3} onClick={finish}>
          Ir a mi inicio
        </Button>
      }
    >
      <div className="space-y-2.5">
        {steps.map(({ icon: Icon, title, result }, i) => {
          const done = step > i
          const active = step === i
          return (
            <div
              key={title}
              className={clsx('flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card transition', !done && !active && 'opacity-40')}
            >
              <div
                className={clsx(
                  'grid size-11 place-items-center rounded-2xl',
                  done ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-800',
                )}
              >
                {done ? <Check size={22} /> : active ? <Loader2 size={22} className="animate-spin" /> : <Icon size={22} />}
              </div>
              <div>
                <p className="font-bold">{title}</p>
                {done && <p className="animate-fade-in text-sm text-muted">{result}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {step >= 3 && (
        <div className="mt-6 animate-fade-in">
          <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">Tu plan de hoy · {formatDayChip(today)}</p>
          <div className="space-y-1.5 rounded-3xl bg-white p-4 shadow-card">
            {summary.todayPlan.meals.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-1">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-100 text-brand-800">
                  <MealIcon label={m.label} size={18} />
                </span>
                <span className="w-12 font-bold">{toHHMM(m.start)}</span>
                <span className="text-muted">{m.label}</span>
              </div>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2.5 text-sm text-muted">
            <input type="checkbox" checked={withHistory} onChange={(e) => setWithHistory(e.target.checked)} className="size-4 accent-brand-700" />
            Incluir historial de ejemplo (para la demo de Progreso)
          </label>
        </div>
      )}
    </OnboardingLayout>
  )
}
