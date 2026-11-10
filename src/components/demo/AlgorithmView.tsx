import { useDayPlan } from '../../hooks/useDayPlan'
import { useToday } from '../../hooks/useNow'
import { useAppStore } from '../../store/useAppStore'
import { DAY_NAMES, dayOfWeek, formatDuration, formatRange, toHHMM } from '../../utils/time'
import { MealStatusBadge } from '../meals/mealMeta'

const FROM = 6 * 60
const TO = 22 * 60
const pct = (m: number) => `${((Math.min(Math.max(m, FROM), TO) - FROM) / (TO - FROM)) * 100}%`
const width = (a: number, b: number) => `${((Math.min(b, TO) - Math.max(a, FROM)) / (TO - FROM)) * 100}%`

/** Visualiza la salida de findAvailableSlots() y scheduleMeals() para explicar la lógica en la presentación */
export function AlgorithmView() {
  const { today, nowMinutes } = useToday()
  const { classes, slots, meals } = useDayPlan(today)
  const settings = useAppStore((s) => s.settings)

  return (
    <div className="text-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="font-semibold text-ink">Plan del {DAY_NAMES[dayOfWeek(today)].toLowerCase()}</h4>
        <span className="text-xs text-muted">
          desayuno {toHHMM(settings.firstMealTime)} · cada {formatDuration(settings.hungerInterval)} · mín. {settings.minMealDuration} min
        </span>
      </div>

      {/* Línea de tiempo horizontal */}
      <div className="relative mb-1 h-[92px] rounded-2xl bg-canvas">
        {classes.map((c) => (
          <div
            key={c.id}
            title={c.courseName}
            className="absolute top-2 flex h-7 items-center overflow-hidden rounded-lg bg-ink/75 px-1.5 text-[10px] font-semibold whitespace-nowrap text-white"
            style={{ left: pct(c.start), width: width(c.start, c.end) }}
          >
            {c.courseName}
          </div>
        ))}
        {slots.map((s) => (
          <div
            key={s.start}
            className="absolute top-10 h-5 rounded-md border-2 border-dashed border-brand-400 bg-brand-100/70"
            style={{ left: pct(s.start), width: width(s.start, s.end) }}
          />
        ))}
        {meals.map((m) => (
          <div key={m.id}>
            <div
              className="absolute top-[38px] h-1.5 w-0.5 bg-accent-600"
              style={{ left: pct(m.target) }}
              title={`Objetivo ${toHHMM(m.target)}`}
            />
            <div
              className="absolute top-[66px] h-5 min-w-1.5 rounded-md bg-brand-800"
              style={{ left: pct(m.start), width: width(m.start, m.end) }}
              title={m.label}
            />
            <div className="absolute top-[30px] size-2.5 -translate-x-1/2 rotate-45 bg-accent-400" style={{ left: pct(m.target) }} />
          </div>
        ))}
        {nowMinutes >= FROM && nowMinutes <= TO && (
          <div className="absolute inset-y-0 w-0.5 bg-coral-500" style={{ left: pct(nowMinutes) }} />
        )}
      </div>
      <div className="mb-3 flex justify-between text-[10px] text-muted">
        {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((h) => (
          <span key={h}>{String(h).padStart(2, '0')}</span>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <Legend className="bg-ink/75" text="Clase" />
        <Legend className="border-2 border-dashed border-brand-400 bg-brand-100" text="Espacio libre" />
        <Legend className="rotate-45 bg-accent-400" text="Hora objetivo (intervalo)" />
        <Legend className="bg-brand-800" text="Comida asignada" />
        <Legend className="bg-coral-500" text="Ahora" />
      </div>

      {/* Salida de las funciones */}
      <div className="mb-4 rounded-2xl bg-brand-950 p-3 font-mono text-[11px] leading-relaxed text-brand-100">
        <p>
          <span className="text-accent-400">findAvailableSlots</span>(horario) →
        </p>
        <p className="pl-3 text-white">[{slots.map((s) => formatRange(s.start, s.end).replace(' - ', '–')).join(', ')}]</p>
        <p className="mt-1">
          <span className="text-accent-400">scheduleMeals</span>(slots, {toHHMM(settings.firstMealTime)}, {settings.hungerInterval / 60}h,{' '}
          {settings.minMealDuration}min) →
        </p>
        <p className="pl-3 text-white">[{meals.map((m) => `${toHHMM(m.start)} ${m.label}`).join(', ')}]</p>
      </div>

      <ol className="space-y-2">
        {meals.map((m) => (
          <li key={m.id} className="rounded-2xl border border-line bg-white p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-bold text-brand-900">
                {toHHMM(m.start)} · {m.label}
              </span>
              <MealStatusBadge status={m.status} />
            </div>
            <p className="text-xs leading-snug text-muted">{m.reason}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Legend({ className, text }: { className: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block size-2.5 rounded-sm ${className}`} />
      {text}
    </span>
  )
}
