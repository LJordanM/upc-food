import { BellRing, CalendarCheck, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/layout/AppHeader'
import { Button } from '../../components/ui'
import { useAppStore } from '../../store/useAppStore'

const VALUES = [
  { icon: BellRing, title: 'Te avisamos', text: 'Encontramos los espacios libres entre tus clases y te recordamos cuándo comer.' },
  { icon: CalendarCheck, title: 'Reservamos tu espacio', text: 'Tu comida entra en el horario como una actividad más, sin cruzarse con clases.' },
  { icon: ShoppingBag, title: 'Pides sin cola', text: 'Ordena en la cafetería y recoge tu comida lista justo a tiempo.' },
]

export default function WelcomePage() {
  const navigate = useNavigate()
  const loadDemoData = useAppStore((s) => s.loadDemoData)

  return (
    <div className="flex min-h-full flex-col bg-brand-900 text-white">
      <div className="relative overflow-hidden px-6 pt-6 pb-8">
        <Logo light />
        <HeroArt />
        <h1 className="relative font-display text-[46px] leading-[0.92] tracking-wide">
          Tu horario ya tiene <span className="text-accent-400">espacio para comer</span>
        </h1>
        <p className="relative mt-3 text-[15px] leading-snug text-white/75">
          Organiza tus comidas entre clases y deja de depender de lo primero que encuentras.
        </p>
      </div>

      <div className="flex flex-1 flex-col rounded-t-[32px] bg-canvas px-5 pt-6 pb-6 text-ink">
        <div className="space-y-3">
          {VALUES.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="flex animate-fade-in gap-4 rounded-3xl bg-white p-4 shadow-card" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-800">
                <Icon size={24} />
              </div>
              <div>
                <p className="font-bold">{title}</p>
                <p className="text-sm leading-snug text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto space-y-2 pt-6">
          <Button full size="lg" onClick={() => navigate('/onboarding/perfil')}>
            Empezar
          </Button>
          <Button
            full
            variant="ghost"
            onClick={() => {
              loadDemoData()
              navigate('/')
            }}
          >
            Ver demo con datos de ejemplo
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Ilustración simple: reloj + plato */
function HeroArt() {
  return (
    <svg viewBox="0 0 320 150" className="my-3 h-32 w-full" aria-hidden>
      <circle cx="90" cy="78" r="56" fill="#fff" />
      <circle cx="90" cy="78" r="56" fill="none" stroke="#f5c542" strokeWidth="8" />
      <path d="M90 42v36l22 14" stroke="#17462e" strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="90" cy="78" r="6" fill="#17462e" />
      <ellipse cx="228" cy="104" rx="66" ry="14" fill="#0e2b1c" opacity=".35" />
      <circle cx="228" cy="86" r="50" fill="#fff" />
      <circle cx="228" cy="86" r="36" fill="#e3f2e8" />
      <circle cx="214" cy="78" r="12" fill="#f5c542" />
      <circle cx="240" cy="96" r="10" fill="#6bb687" />
      <path d="M236 70c10-4 18 2 16 10-8 2-14-2-16-10z" fill="#3f9a65" />
      <rect x="296" y="42" width="6" height="80" rx="3" fill="#c5e4d0" />
      <rect x="154" y="42" width="6" height="80" rx="3" fill="#c5e4d0" />
      <path d="M150 42v22M157 42v22M164 42v22" stroke="#c5e4d0" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
