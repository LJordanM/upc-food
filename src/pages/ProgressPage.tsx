import type { ReactNode } from 'react'
import clsx from 'clsx'
import { BellRing, Check, Clock3, Flame, Gift, Minus, Repeat, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card, Chip, PageTitle, ProgressRing, SectionHeader } from '../components/ui'
import { useToday } from '../hooks/useNow'
import { useAppStore } from '../store/useAppStore'
import { buildDayRecords, dateRange } from '../utils/dayPlans'
import {
  computeHabitLoop,
  computeStreak,
  computeWeeklyStats,
  historyForDay,
  type HistoryEntryStatus,
} from '../utils/progress'
import { addDays, DAY_ABBR, DAY_NAMES, dayOfWeek, formatDuration, fromISODate, startOfWeek, toHHMM } from '../utils/time'

export default function ProgressPage() {
  const { today, nowMinutes } = useToday()
  const schedule = useAppStore((s) => s.schedule)
  const settings = useAppStore((s) => s.settings)
  const logs = useAppStore((s) => s.logs)
  const [week, setWeek] = useState<0 | -1>(0)

  const data = useMemo(() => {
    const monday = addDays(startOfWeek(today), week * 7)
    const end = week === 0 ? today : addDays(monday, 6)
    const days = buildDayRecords(dateRange(monday, end), today, schedule, settings, logs)
    // Para la racha: últimos 30 días, del más reciente al más antiguo
    const streakDays = buildDayRecords(dateRange(addDays(today, -30), today), today, schedule, settings, logs).reverse()
    return {
      monday,
      days,
      stats: computeWeeklyStats(days),
      loop: computeHabitLoop(days),
      streak: computeStreak(streakDays),
    }
  }, [today, week, schedule, settings, logs])

  const { stats, loop, streak, days } = data

  return (
    <div className="px-5 pt-4 pb-6">
      <PageTitle subtitle="Cómo vas organizando tus comidas.">Tu progreso</PageTitle>

      <div className="mb-4 flex gap-2">
        <Chip active={week === 0} onClick={() => setWeek(0)}>
          Esta semana
        </Chip>
        <Chip active={week === -1} onClick={() => setWeek(-1)}>
          Semana pasada
        </Chip>
      </div>

      {/* Resumen */}
      <Card>
        <div className="flex items-center gap-5">
          <ProgressRing value={stats.percent / 100} size={118}>
            <div className="text-center">
              <p className="font-display text-[40px] leading-none text-brand-900">{stats.percent}%</p>
              <p className="text-[11px] text-muted">cumplido</p>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <p className="text-[15px] leading-snug">
              {week === 0 ? 'Esta semana' : 'La semana pasada'} cumpliste el <b>{stats.percent}%</b> de tus comidas planificadas.
            </p>
            <p className="mt-2 text-sm text-muted">
              <b className="text-ink">
                {stats.onTime} de {stats.done}
              </b>{' '}
              comidas realizadas en el horario sugerido.
            </p>
          </div>
        </div>

        {/* Barras por día */}
        <div className="mt-5 flex h-28 items-end gap-2">
          {Array.from({ length: 7 }, (_, i) => addDays(data.monday, i)).map((date) => {
            const s = stats.days.find((d) => d.date === date)
            const ratio = s && s.planned ? s.done / s.planned : 0
            const future = !s
            return (
              <div key={date} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="relative flex h-20 w-full items-end overflow-hidden rounded-xl bg-canvas">
                  <div
                    className={clsx('w-full rounded-xl transition-all duration-700', ratio >= 0.75 ? 'bg-brand-700' : 'bg-accent-400')}
                    style={{ height: future ? 0 : `${Math.max(ratio * 100, s?.planned ? 6 : 0)}%` }}
                  />
                </div>
                <span className={clsx('text-xs font-semibold', date === today ? 'text-brand-800' : 'text-muted')}>{DAY_ABBR[dayOfWeek(date)]}</span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Racha */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-brand-900 p-4 text-white shadow-card">
          <Flame className="text-accent-400" size={26} />
          <p className="mt-2 font-display text-[44px] leading-none">{streak}</p>
          <p className="text-sm text-brand-100">{streak === 1 ? 'día' : 'días'} organizando tus comidas</p>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-card">
          <Clock3 className="text-brand-700" size={26} />
          <p className="mt-2 font-display text-[44px] leading-none text-brand-900">{stats.skipped}</p>
          <p className="text-sm text-muted">comidas omitidas {week === 0 ? 'esta semana' : 'la semana pasada'}</p>
        </div>
      </div>

      {/* Ciclo del hábito (discreto) */}
      <Card className="mt-4">
        <p className="mb-3 text-xs font-bold tracking-wider text-muted uppercase">Cómo vas formando tu hábito</p>
        <div className="space-y-3">
          <LoopRow icon={<BellRing size={18} />} value={loop.signals} text="recordatorios para comer a tiempo" />
          <LoopRow icon={<Repeat size={18} />} value={loop.routines} text="comidas hechas en tu horario sugerido" />
          <LoopRow
            icon={<Gift size={18} />}
            value={formatDuration(loop.minutesSaved)}
            text={`ahorrados en colas con ${loop.ordersPickedUp} pedidos anticipados`}
          />
        </div>
      </Card>

      {/* Historial */}
      <SectionHeader title="Historial" className="mt-7 mb-3" />
      <div className="space-y-3">
        {[...days].reverse().map((day) => {
          const entries = historyForDay(day, nowMinutes)
          const d = fromISODate(day.date)
          return (
            <Card key={day.date} className="p-4!">
              <p className="mb-2 font-bold">
                {DAY_NAMES[d.getDay()]} {d.getDate()}/{d.getMonth() + 1}
                {day.isToday && <span className="ml-2 text-xs font-semibold text-brand-700">Hoy</span>}
              </p>
              <ul className="space-y-1.5">
                {entries.map(({ meal, log, status }) => (
                  <li key={meal.id} className="flex items-center justify-between text-sm">
                    <span>
                      {meal.label} <span className="text-xs text-muted">{toHHMM(meal.start)}</span>
                    </span>
                    <HistoryStatus status={status} detail={log?.skipReason} />
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function LoopRow({ icon, value, text }: { icon: ReactNode; value: number | string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">{icon}</span>
      <p className="text-sm leading-snug">
        <b className="text-base text-brand-900">{value}</b> {text}
      </p>
    </div>
  )
}

const HISTORY_META: Record<HistoryEntryStatus, { text: string; className: string; icon: ReactNode }> = {
  realizada: { text: 'A tiempo', className: 'text-brand-700', icon: <Check size={15} /> },
  'fuera-de-horario': { text: 'Fuera de horario', className: 'text-accent-600', icon: <Check size={15} /> },
  omitida: { text: 'Omitida', className: 'text-coral-500', icon: <X size={15} /> },
  'sin-registrar': { text: 'Sin registrar', className: 'text-muted', icon: <Minus size={15} /> },
  pendiente: { text: 'Pendiente', className: 'text-muted', icon: <Clock3 size={14} /> },
}

function HistoryStatus({ status, detail }: { status: HistoryEntryStatus; detail?: string }) {
  const m = HISTORY_META[status]
  return (
    <span className={clsx('flex items-center gap-1 text-xs font-semibold', m.className)} title={detail}>
      {m.icon} {m.text}
    </span>
  )
}
