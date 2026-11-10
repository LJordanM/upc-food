import { CalendarPlus, CheckCircle2, Download, Loader2, Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClassFormSheet } from '../../components/schedule/ClassFormSheet'
import { Button } from '../../components/ui'
import { SAMPLE_SCHEDULE } from '../../data/sampleSchedule'
import { scheduleSource } from '../../services'
import { useAppStore } from '../../store/useAppStore'
import type { ClassSession, DayOfWeek } from '../../types'
import { DAY_NAMES, formatRange } from '../../utils/time'
import { OnboardingLayout } from './OnboardingLayout'

export default function ScheduleSetupPage() {
  const navigate = useNavigate()
  const schedule = useAppStore((s) => s.schedule)
  const setSchedule = useAppStore((s) => s.setSchedule)
  const profile = useAppStore((s) => s.profile)
  const [importing, setImporting] = useState(false)
  const [sheet, setSheet] = useState<{ open: boolean; initial?: ClassSession }>({ open: false })

  const importFromMiUpc = async () => {
    setImporting(true)
    const classes = await scheduleSource.importSchedule(profile?.studentCode)
    setSchedule(classes)
    setImporting(false)
  }

  const days = ([1, 2, 3, 4, 5, 6] as DayOfWeek[]).filter((d) => schedule.some((c) => c.day === d))

  return (
    <OnboardingLayout
      step={2}
      title="Tu horario de clases"
      subtitle="Lo usamos para encontrar los espacios libres entre clases."
      footer={
        <Button full size="lg" disabled={schedule.length === 0} onClick={() => navigate('/onboarding/comidas')}>
          Continuar
        </Button>
      }
    >
      {schedule.length === 0 ? (
        <div className="space-y-3">
          <button
            onClick={importFromMiUpc}
            disabled={importing}
            className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-card transition active:scale-[0.99]"
          >
            <div className="grid size-12 place-items-center rounded-2xl bg-brand-900 text-white">
              {importing ? <Loader2 className="animate-spin" size={22} /> : <Download size={22} />}
            </div>
            <div className="flex-1">
              <p className="font-bold">{importing ? 'Importando desde Mi UPC…' : 'Importar desde Mi UPC'}</p>
              <p className="text-sm text-muted">Simulado: en la versión real se conecta con tu matrícula.</p>
            </div>
          </button>
          <button
            onClick={() => setSchedule(SAMPLE_SCHEDULE.map((c) => ({ ...c })))}
            className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-card transition active:scale-[0.99]"
          >
            <div className="grid size-12 place-items-center rounded-2xl bg-accent-100 text-accent-600">
              <Sparkles size={22} />
            </div>
            <div className="flex-1">
              <p className="font-bold">Usar horario de ejemplo</p>
              <p className="text-sm text-muted">Cursos de primer ciclo de Ingeniería.</p>
            </div>
          </button>
          <button
            onClick={() => setSheet({ open: true })}
            className="flex w-full items-center gap-4 rounded-3xl border-2 border-dashed border-brand-300 p-4 text-left transition active:scale-[0.99]"
          >
            <div className="grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-800">
              <CalendarPlus size={22} />
            </div>
            <div className="flex-1">
              <p className="font-bold">Ingresarlo manualmente</p>
              <p className="text-sm text-muted">Curso, día, hora de inicio y fin.</p>
            </div>
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
            <CheckCircle2 size={18} /> {schedule.length} clases en {days.length} días
          </div>
          <div className="space-y-4">
            {days.map((d) => (
              <div key={d}>
                <p className="mb-1.5 text-xs font-bold tracking-wider text-muted uppercase">{DAY_NAMES[d]}</p>
                <div className="space-y-1.5">
                  {schedule
                    .filter((c) => c.day === d)
                    .sort((a, b) => a.start - b.start)
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSheet({ open: true, initial: c })}
                        className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left shadow-card"
                      >
                        <span className="truncate pr-2 text-sm font-semibold">{c.courseName}</span>
                        <span className="shrink-0 text-xs font-semibold text-muted">{formatRange(c.start, c.end)}</span>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" full className="mt-4" icon={<Plus size={18} />} onClick={() => setSheet({ open: true })}>
            Agregar curso
          </Button>
        </div>
      )}
      <ClassFormSheet open={sheet.open} initial={sheet.initial} onClose={() => setSheet({ open: false })} />
    </OnboardingLayout>
  )
}
