import clsx from 'clsx'
import { BellOff, Clock, Database, FastForward, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToday } from '../../hooks/useNow'
import { demoClockAt, demoClockAtDay, REAL_CLOCK, withSpeed } from '../../services/clock'
import { useAppStore } from '../../store/useAppStore'
import { MINUTE } from '../../utils/orders'
import { addDays, DAY_ABBR, dayOfWeek, fromISODate, startOfWeek, toHHMM, toMinutes } from '../../utils/time'

const SCENARIOS = [
  { day: 0, time: '10:40', title: 'Lunes 10:40', text: 'Media mañana reubicada a las 11:30' },
  { day: 0, time: '13:50', title: 'Lunes 13:50', text: 'Pedir el almuerzo para las 14:30' },
  { day: 1, time: '10:20', title: 'Martes 10:20', text: 'Clases seguidas: día cargado' },
  { day: 3, time: '06:05', title: 'Jueves 06:05', text: 'Clase a las 7: desayuno adelantado' },
  { day: 3, time: '09:35', title: 'Jueves 09:35', text: 'Micro-hueco de 15 min: snack rápido' },
]

/** Controles del reloj simulado y de datos para demostrar la app en vivo */
export function DemoControls({ compact }: { compact?: boolean }) {
  const { now, today, nowMinutes } = useToday()
  const clock = useAppStore((s) => s.clock)
  const setClock = useAppStore((s) => s.setClock)
  const loadDemoData = useAppStore((s) => s.loadDemoData)
  const loadSampleHistory = useAppStore((s) => s.loadSampleHistory)
  const resetAll = useAppStore((s) => s.resetAll)
  const navigate = useNavigate()
  const [time, setTime] = useState(toHHMM(nowMinutes))

  const monday = startOfWeek(today)
  const goTo = (date: string, hhmm: string) => setClock(demoClockAtDay(date, toMinutes(hhmm), clock.mode === 'demo' ? clock.speed : 1))

  return (
    <div className="space-y-5 text-sm">
      {/* Reloj */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-semibold text-ink">
            <Clock size={16} /> Reloj de la demo
          </h4>
          <div className="flex rounded-xl bg-canvas p-1 text-xs font-semibold">
            <button
              onClick={() => setClock(REAL_CLOCK)}
              className={clsx('rounded-lg px-2.5 py-1', clock.mode === 'real' ? 'bg-white text-brand-900 shadow-sm' : 'text-muted')}
            >
              Hora real
            </button>
            <button
              onClick={() => setClock(demoClockAt(now, 1))}
              className={clsx('rounded-lg px-2.5 py-1', clock.mode === 'demo' ? 'bg-white text-brand-900 shadow-sm' : 'text-muted')}
            >
              Simulada
            </button>
          </div>
        </div>
        <p className="mb-3 text-muted">
          Ahora: <b className="text-ink">{DAY_ABBR[dayOfWeek(today)]} {fromISODate(today).getDate()}/{fromISODate(today).getMonth() + 1} · {toHHMM(nowMinutes)}</b>
          {clock.mode === 'demo' && clock.speed > 1 && <span className="ml-1 text-accent-600">(x{clock.speed})</span>}
        </p>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map((d) => (
            <button
              key={d}
              onClick={() => goTo(d, toHHMM(nowMinutes))}
              className={clsx(
                'rounded-xl py-1.5 text-xs font-bold',
                d === today ? 'bg-brand-800 text-white' : 'bg-canvas text-ink hover:bg-brand-100',
              )}
            >
              {DAY_ABBR[dayOfWeek(d)]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1 rounded-xl border-2 border-line px-3 py-1.5" />
          <button onClick={() => goTo(today, time)} className="rounded-xl bg-brand-900 px-3 font-semibold text-white">
            Ir
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[15, 60].map((m) => (
            <button
              key={m}
              onClick={() => setClock(demoClockAt(now + m * MINUTE, clock.mode === 'demo' ? clock.speed : 1))}
              className="flex items-center gap-1 rounded-xl bg-canvas px-2.5 py-1.5 font-semibold text-ink hover:bg-brand-100"
            >
              <FastForward size={14} /> +{m === 60 ? '1 h' : `${m} min`}
            </button>
          ))}
          {[1, 10, 60].map((s) => (
            <button
              key={s}
              onClick={() => setClock(clock.mode === 'demo' ? withSpeed(clock, s) : demoClockAt(now, s))}
              className={clsx(
                'rounded-xl px-2.5 py-1.5 font-semibold',
                clock.mode === 'demo' && clock.speed === s ? 'bg-accent-400 text-brand-950' : 'bg-canvas text-ink hover:bg-brand-100',
              )}
            >
              x{s}
            </button>
          ))}
        </div>
      </section>

      {/* Escenarios */}
      <section>
        <h4 className="mb-2 font-semibold text-ink">Escenarios rápidos</h4>
        <div className={clsx('grid gap-1.5', compact ? 'grid-cols-1' : 'grid-cols-2')}>
          {SCENARIOS.map((s) => (
            <button
              key={s.title}
              onClick={() => {
                // Próxima ocurrencia de ese día (hoy incluido) para no caer en días con historial ya registrado
                const target = (s.day + 1) % 7
                const ahead = (target - dayOfWeek(today) + 7) % 7
                goTo(addDays(today, ahead), s.time)
                loadSampleHistory()
                useAppStore.setState({ banner: null })
                navigate('/')
              }}
              className="rounded-2xl border-2 border-line bg-white px-3 py-2 text-left hover:border-brand-400"
            >
              <span className="block font-bold text-brand-900">{s.title}</span>
              <span className="block text-xs leading-tight text-muted">{s.text}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Datos */}
      <section>
        <h4 className="mb-2 font-semibold text-ink">Datos</h4>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              loadDemoData()
              navigate('/')
            }}
            className="flex items-center gap-1.5 rounded-xl bg-brand-100 px-3 py-1.5 font-semibold text-brand-900"
          >
            <Database size={14} /> Cargar datos de Alex
          </button>
          <button onClick={loadSampleHistory} className="rounded-xl bg-canvas px-3 py-1.5 font-semibold text-ink">
            Regenerar historial
          </button>
          <button
            onClick={() => useAppStore.setState({ firedKeys: [], notifications: [], banner: null })}
            className="flex items-center gap-1.5 rounded-xl bg-canvas px-3 py-1.5 font-semibold text-ink"
          >
            <BellOff size={14} /> Limpiar avisos
          </button>
          <button
            onClick={() => {
              resetAll()
              navigate('/bienvenida')
            }}
            className="flex items-center gap-1.5 rounded-xl bg-coral-50 px-3 py-1.5 font-semibold text-coral-500"
          >
            <RotateCcw size={14} /> Reiniciar (onboarding)
          </button>
        </div>
      </section>
    </div>
  )
}
