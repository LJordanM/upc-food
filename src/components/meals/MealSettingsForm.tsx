import { Info } from 'lucide-react'
import { useMemo } from 'react'
import { NUTRITION_RULES, SETTINGS_LIMITS } from '../../data/nutritionRules'
import type { ClassSession, DayOfWeek, MealSettings } from '../../types'
import { planDay } from '../../utils/mealPlanner'
import { DAY_NAMES, formatDuration, toHHMM, toMinutes } from '../../utils/time'
import { Field, inputClass } from '../ui'
import { MealIcon } from './mealMeta'

/** Formulario de hábitos de comida con vista previa en vivo del plan */
export function MealSettingsForm({
  value,
  onChange,
  schedule,
  previewDay,
}: {
  value: MealSettings
  onChange: (v: MealSettings) => void
  schedule: ClassSession[]
  previewDay: DayOfWeek
}) {
  const set = (patch: Partial<MealSettings>) => onChange({ ...value, ...patch })
  const { hungerInterval: hi, minMealDuration: md } = SETTINGS_LIMITS

  const preview = useMemo(
    () => planDay('', schedule.filter((c) => c.day === previewDay), value, NUTRITION_RULES).meals,
    [schedule, previewDay, value],
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="¿A qué hora desayunas?">
          <input
            type="time"
            step={300}
            className={inputClass}
            value={toHHMM(value.firstMealTime)}
            onChange={(e) => e.target.value && set({ firstMealTime: toMinutes(e.target.value) })}
          />
        </Field>
        <Field label="Última comida hasta">
          <input
            type="time"
            step={300}
            className={inputClass}
            value={toHHMM(value.dayEnd)}
            onChange={(e) => e.target.value && set({ dayEnd: toMinutes(e.target.value) })}
          />
        </Field>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-sm font-semibold">¿Cada cuánto te da hambre?</span>
          <span className="font-display text-2xl leading-none text-brand-800">{formatDuration(value.hungerInterval)}</span>
        </div>
        <input
          type="range"
          className="w-full"
          min={hi.min}
          max={hi.max}
          step={hi.step}
          value={value.hungerInterval}
          onChange={(e) => set({ hungerInterval: Number(e.target.value) })}
        />
        <div className="flex justify-between text-xs text-muted">
          <span>{formatDuration(hi.min)}</span>
          <span>{formatDuration(hi.max)}</span>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-sm font-semibold">Tiempo mínimo para comer</span>
          <span className="font-display text-2xl leading-none text-brand-800">{value.minMealDuration} min</span>
        </div>
        <input
          type="range"
          className="w-full"
          min={md.min}
          max={md.max}
          step={md.step}
          value={value.minMealDuration}
          onChange={(e) => set({ minMealDuration: Number(e.target.value) })}
        />
        <div className="flex justify-between text-xs text-muted">
          <span>{md.min} min</span>
          <span>{md.max} min</span>
        </div>
      </div>

      <div className="flex gap-2.5 rounded-2xl bg-accent-50 p-3.5 text-xs leading-snug text-ink/80">
        <Info size={16} className="mt-0.5 shrink-0 text-accent-600" />
        <p>
          {NUTRITION_RULES.note} Referencias:{' '}
          {NUTRITION_RULES.sources.map((s, i) => (
            <span key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-800 underline">
                {s.title.split(':')[0]}
              </a>
              {i < NUTRITION_RULES.sources.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-card">
        <p className="mb-3 text-xs font-bold tracking-wider text-muted uppercase">Vista previa · {DAY_NAMES[previewDay]}</p>
        <div className="flex flex-wrap gap-2">
          {preview.map((m) => (
            <div key={m.index} className="flex items-center gap-2 rounded-2xl bg-brand-50 px-3 py-2 text-sm">
              <span className="text-brand-700">
                <MealIcon label={m.label} size={16} />
              </span>
              <b>{toHHMM(m.start)}</b>
              <span className="text-muted">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
