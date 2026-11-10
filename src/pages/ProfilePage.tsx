import { CalendarDays, ChevronRight, FlaskConical, HeartHandshake, MapPin, Pencil, QrCode, Timer, UtensilsCrossed } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlgorithmView } from '../components/demo/AlgorithmView'
import { DemoControls } from '../components/demo/DemoControls'
import { MealSettingsForm } from '../components/meals/MealSettingsForm'
import { BottomSheet, Button, Card } from '../components/ui'
import { useToday } from '../hooks/useNow'
import { useAppStore } from '../store/useAppStore'
import { dayOfWeek, formatDuration, toHHMM } from '../utils/time'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { today } = useToday()
  const profile = useAppStore((s) => s.profile)
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)
  const schedule = useAppStore((s) => s.schedule)
  const resetAll = useAppStore((s) => s.resetAll)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(settings)
  const [demo, setDemo] = useState(false)

  const initials = (profile?.name ?? '?').slice(0, 1).toUpperCase()
  const todayDow = dayOfWeek(today)

  return (
    <div className="pb-8">
      {/* Cabecera estilo Mi UPC */}
      <div className="relative h-32 overflow-hidden bg-brand-100">
        <svg viewBox="0 0 400 130" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice" aria-hidden>
          <rect x="250" y="40" width="110" height="90" rx="6" fill="#c5e4d0" />
          <rect x="268" y="58" width="20" height="16" fill="#e3f2e8" />
          <rect x="298" y="58" width="20" height="16" fill="#e3f2e8" />
          <rect x="328" y="58" width="20" height="16" fill="#e3f2e8" />
          <circle cx="60" cy="80" r="26" fill="#9bd0ae" />
          <rect x="58" y="96" width="4" height="34" fill="#6bb687" />
          <circle cx="110" cy="92" r="18" fill="#9bd0ae" />
          <rect x="108" y="104" width="4" height="26" fill="#6bb687" />
          <path d="M0 122h400v8H0z" fill="#9bd0ae" />
        </svg>
      </div>
      <div className="-mt-14 flex flex-col items-center px-5 text-center">
        <div className="relative grid size-28 place-items-center rounded-full border-4 border-canvas bg-brand-800 font-display text-[56px] text-white">
          {initials}
        </div>
        <p className="mt-3 font-display text-[32px] leading-none tracking-wide text-brand-900 uppercase">{profile?.name}</p>
        <p className="mt-1 font-bold text-ink/80 uppercase">{profile?.career}</p>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin size={15} className="text-brand-600" /> Campus {profile?.campus}
        </p>
        {profile?.studentCode && (
          <p className="mt-2 rounded-xl bg-line/70 px-3 py-1 text-sm font-semibold text-ink/80">Código de alumno: {profile.studentCode}</p>
        )}
      </div>

      <div className="mt-6 space-y-3 px-5">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-[24px] leading-none tracking-wide">Mis horarios de comida</p>
            <button
              onClick={() => {
                setDraft(settings)
                setEditing(true)
              }}
              className="flex items-center gap-1 text-sm font-semibold text-brand-700"
            >
              <Pencil size={15} /> Editar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Setting icon={<UtensilsCrossed size={16} />} label="Desayuno" value={toHHMM(settings.firstMealTime)} />
            <Setting icon={<Timer size={16} />} label="Hambre cada" value={formatDuration(settings.hungerInterval)} />
            <Setting icon={<Timer size={16} />} label="Mínimo para comer" value={`${settings.minMealDuration} min`} />
            <Setting icon={<Timer size={16} />} label="Última comida" value={`hasta ${toHHMM(settings.dayEnd)}`} />
          </div>
        </Card>

        <MenuRow icon={<QrCode size={20} />} title="Mi pase UPC Food" subtitle="Muéstralo al recoger tu pedido" onClick={() => navigate('/pase')} />
        <MenuRow icon={<CalendarDays size={20} />} title="Mi horario de clases" subtitle={`${schedule.length} clases registradas`} onClick={() => navigate('/horario')} />
        <MenuRow icon={<FlaskConical size={20} />} title="Modo demostración" subtitle="Reloj simulado, escenarios y algoritmo" onClick={() => setDemo(true)} />

        <Card className="p-4!">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent-100 text-accent-600">
              <HeartHandshake size={20} />
            </span>
            <p className="text-sm leading-snug text-muted">
              UPC Food te ayuda a <b className="text-ink">organizar tu tiempo para comer</b>. No es una app médica, no cuenta calorías ni
              recomienda dietas. Los intervalos entre comidas son referenciales.
            </p>
          </div>
        </Card>

        <Button
          full
          variant="danger"
          className="mt-2"
          onClick={() => {
            resetAll()
            navigate('/bienvenida')
          }}
        >
          Reiniciar app
        </Button>
      </div>

      <BottomSheet open={editing} onClose={() => setEditing(false)} title="Horarios de comida">
        <MealSettingsForm value={draft} onChange={setDraft} schedule={schedule} previewDay={todayDow} />
        <Button
          full
          size="lg"
          className="mt-5"
          onClick={() => {
            setSettings(draft)
            setEditing(false)
          }}
        >
          Guardar y recalcular plan
        </Button>
      </BottomSheet>

      <BottomSheet open={demo} onClose={() => setDemo(false)} title="Modo demostración">
        <DemoControls compact />
        <div className="mt-6 border-t border-line pt-5">
          <AlgorithmView />
        </div>
      </BottomSheet>
    </div>
  )
}

function Setting({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-canvas p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted">
        {icon} {label}
      </p>
      <p className="mt-0.5 font-bold">{value}</p>
    </div>
  )
}

function MenuRow({ icon, title, subtitle, onClick }: { icon: ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-card transition active:scale-[0.99]">
      <span className="grid size-11 place-items-center rounded-2xl bg-brand-100 text-brand-800">{icon}</span>
      <span className="flex-1">
        <span className="block font-display text-[22px] leading-none tracking-wide">{title}</span>
        <span className="text-sm text-muted">{subtitle}</span>
      </span>
      <ChevronRight className="text-brand-700" size={20} />
    </button>
  )
}
