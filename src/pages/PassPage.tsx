import { ChevronLeft, MapPin, ShieldCheck, UtensilsCrossed } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/layout/AppHeader'
import { Badge, Button, FakeQr } from '../components/ui'
import { useNow } from '../hooks/useNow'
import { useAppStore } from '../store/useAppStore'
import { getOrderStatusAt, isOrderActive, ORDER_STEPS } from '../utils/orders'
import { DAY_NAMES, toISODate } from '../utils/time'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Pase de recojo: se muestra en el mostrador de la cafetería.
 * El reloj en vivo y el anillo animado muestran que la pantalla no es una captura.
 */
export default function PassPage() {
  const navigate = useNavigate()
  const now = useNow()
  const profile = useAppStore((s) => s.profile)
  const orders = useAppStore((s) => s.orders)

  const d = new Date(now)
  const today = toISODate(d)
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  const date = `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  const initials = (profile?.name ?? '?').slice(0, 1).toUpperCase()

  // Pedido de hoy más próximo a estar listo
  const active = orders
    .filter((o) => o.date === today)
    .map((order) => ({ order, status: getOrderStatusAt(order, now) }))
    .filter((x) => isOrderActive(x.status))
    .sort((a, b) => a.order.readyAt - b.order.readyAt)[0]

  return (
    <div className="relative min-h-full overflow-hidden px-5 pt-3 pb-8">
      <Clouds />

      <div className="relative flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="grid size-10 place-items-center rounded-full bg-white shadow-card" aria-label="Atrás">
          <ChevronLeft size={22} />
        </button>
        <Logo />
      </div>

      {/* Reloj en vivo */}
      <div className="relative mt-5 flex flex-col items-center">
        <div className="rounded-2xl bg-brand-900 px-6 py-2 shadow-float">
          <span className="text-[44px] font-semibold tracking-tight text-white tabular-nums">{time}</span>
        </div>
        <p className="mt-2 text-[15px] text-muted">{date}</p>
      </div>

      {/* Avatar con anillo animado */}
      <div className="relative mx-auto mt-6 grid size-40 place-items-center">
        <div className="absolute inset-0 animate-[spin_5s_linear_infinite] rounded-full bg-[conic-gradient(var(--color-brand-500),var(--color-accent-400),var(--color-brand-200),var(--color-brand-500))]" />
        <div className="relative grid size-[148px] place-items-center rounded-full border-4 border-canvas bg-brand-800 font-display text-[72px] text-white">
          {initials}
        </div>
        <span className="absolute -bottom-2 flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold tracking-wide text-brand-800 uppercase shadow-card">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-600" />
          </span>
          En vivo
        </span>
      </div>

      {/* Datos del estudiante */}
      <div className="relative mt-7 rounded-3xl bg-white p-5 text-center shadow-card">
        <p className="font-display text-[38px] leading-[0.95] tracking-wide text-brand-900 uppercase">{profile?.name}</p>
        {profile?.studentCode && (
          <>
            <p className="mt-3 text-sm text-muted">Código de alumno</p>
            <p className="text-lg font-bold text-ink/90">{profile.studentCode}</p>
          </>
        )}
        <p className="mt-3 font-bold text-ink/80 uppercase">{profile?.career}</p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted">
          <MapPin size={15} className="text-brand-600" /> Campus {profile?.campus}
        </p>
      </div>

      {/* Pedido para recoger */}
      {active ? (
        <button
          onClick={() => navigate(`/pedido/${active.order.id}`)}
          className="relative mt-4 flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-card transition active:scale-[0.99]"
        >
          <FakeQr seed={active.order.pickupCode} />
          <div className="min-w-0">
            <Badge tone={active.status === 'listo' ? 'green' : 'yellow'}>{ORDER_STEPS.find((s) => s.status === active.status)?.label}</Badge>
            <p className="mt-1.5 text-xs font-semibold text-muted uppercase">Código de recojo</p>
            <p className="font-display text-[44px] leading-none tracking-wider text-brand-900">{active.order.pickupCode}</p>
            <p className="truncate text-xs text-muted">
              {active.order.mealLabel} · {active.order.pickupPoint}
            </p>
          </div>
        </button>
      ) : (
        <div className="relative mt-4 flex items-center gap-3 rounded-3xl bg-white p-4 shadow-card">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-800">
            <UtensilsCrossed size={20} />
          </span>
          <p className="flex-1 text-sm text-muted">No tienes pedidos activos hoy.</p>
          <Button size="sm" variant="secondary" onClick={() => navigate('/comidas')}>
            Ordenar
          </Button>
        </div>
      )}

      <p className="relative mt-5 flex gap-2 text-xs leading-snug text-muted">
        <ShieldCheck size={16} className="shrink-0 text-brand-600" />
        Pase para recoger pedidos de UPC Food. El reloj en vivo confirma que no es una captura. No reemplaza tu TIU.
      </p>
    </div>
  )
}

/** Fondo decorativo: nubes que se desplazan lento */
function Clouds() {
  const cloud = 'M10 20a8 8 0 0 1 8-8 11 11 0 0 1 21-2 8 8 0 0 1 11 10z'
  return (
    <svg viewBox="0 0 400 520" className="pointer-events-none absolute inset-x-0 top-24 h-[520px] w-full" preserveAspectRatio="xMidYMin slice" aria-hidden>
      <g fill="var(--color-brand-100)">
        <path d={cloud} transform="translate(30 250) scale(1.4)" className="animate-[pulse_6s_ease-in-out_infinite]" />
        <path d={cloud} transform="translate(300 150) scale(1)" />
        <path d={cloud} transform="translate(320 330) scale(1.2)" className="animate-[pulse_7s_ease-in-out_infinite]" />
        <path d={cloud} transform="translate(250 270) scale(0.7)" />
        <path d={cloud} transform="translate(-10 120) scale(0.8)" />
      </g>
    </svg>
  )
}
