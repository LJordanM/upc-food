import clsx from 'clsx'
import { Check, ChevronLeft, FastForward, PartyPopper, QrCode, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BottomSheet, Button, Card, FakeQr } from '../components/ui'
import { useDayPlan } from '../hooks/useDayPlan'
import { useMealActions, useMenu } from '../hooks/useMealActions'
import { useToday } from '../hooks/useNow'
import { cafeteriaApi } from '../services'
import { demoClockAt } from '../services/clock'
import { useAppStore } from '../store/useAppStore'
import { formatPrice, getOrderStatusAt, nextTransitionAt, ORDER_STEPS, stepIndex } from '../utils/orders'
import { formatDuration, minutesOfDay, toHHMM } from '../utils/time'

const hhmm = (ts: number) => toHHMM(minutesOfDay(new Date(ts)))

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { now, today } = useToday()
  const order = useAppStore((s) => s.orders.find((o) => o.id === id))
  const pickUpOrder = useAppStore((s) => s.pickUpOrder)
  const cancelOrder = useAppStore((s) => s.cancelOrder)
  const clock = useAppStore((s) => s.clock)
  const setClock = useAppStore((s) => s.setClock)
  const menu = useMenu(today)
  const plan = useDayPlan(order?.date ?? today)
  const { markDone } = useMealActions()
  const [askLog, setAskLog] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  if (!order) {
    return (
      <div className="p-5">
        <p className="text-muted">Pedido no encontrado.</p>
      </div>
    )
  }

  const status = getOrderStatusAt(order, now)
  const current = stepIndex(status)
  const meal = plan.meals.find((m) => m.id === order.mealId)
  const next = nextTransitionAt(order, now)
  const minutesToSend = Math.ceil((order.sendAt - now) / 60000)
  const minutesToReady = Math.ceil((order.readyAt - now) / 60000)

  const headline =
    status === 'programado'
      ? `Se enviará a las ${hhmm(order.sendAt)}`
      : status === 'recibido' || status === 'preparando'
        ? `Listo a las ${hhmm(order.readyAt)}`
        : status === 'listo'
          ? '¡Listo para recoger!'
          : status === 'recogido'
            ? '¡Buen provecho!'
            : 'Pedido cancelado'

  return (
    <div className="px-5 pt-3 pb-8">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="grid size-10 place-items-center rounded-full bg-white shadow-card" aria-label="Atrás">
          <ChevronLeft size={22} />
        </button>
        <p className="font-display text-[28px] leading-none tracking-wide">Tu pedido</p>
      </div>

      {/* Estado principal */}
      <div className={clsx('rounded-[28px] p-5 text-white shadow-float', status === 'listo' ? 'bg-brand-700' : 'bg-brand-900')}>
        <p className="text-sm text-brand-200">
          {order.mealLabel} · {meal ? toHHMM(meal.start) : ''}
        </p>
        <p className="mt-1 font-display text-[42px] leading-none tracking-wide">{headline}</p>
        <p className="mt-2 text-sm text-white/80">
          {status === 'programado' && `Lo enviamos automáticamente en ${formatDuration(minutesToSend)} para que esté listo a las ${hhmm(order.readyAt)}.`}
          {(status === 'recibido' || status === 'preparando') && `Faltan ${formatDuration(Math.max(0, minutesToReady))}.`}
          {status === 'listo' && `Acércate a ${order.pickupPoint} y muestra tu código.`}
          {status === 'recogido' && 'Ahorraste la cola de la cafetería.'}
        </p>
        {order.late && status !== 'recogido' && (
          <p className="mt-2 rounded-xl bg-white/12 px-3 py-1.5 text-xs">Se pidió tarde: estará listo después de la hora planificada.</p>
        )}
      </div>

      {/* Código de recojo */}
      {status !== 'cancelado' && (
        <div className="relative mt-4 flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card">
          <FakeQr seed={order.pickupCode} />
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Código de recojo</p>
            <p className="font-display text-[52px] leading-none tracking-wider text-brand-900">{order.pickupCode}</p>
            <p className="text-xs text-muted">{order.pickupPoint}</p>
          </div>
        </div>
      )}

      {/* Stepper */}
      <Card className="mt-4">
        <ol>
          {ORDER_STEPS.map((s, i) => {
            const done = status !== 'cancelado' && i <= current
            const active = i === current
            return (
              <li key={s.status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={clsx(
                      'grid size-8 place-items-center rounded-full text-sm font-bold transition',
                      done ? 'bg-brand-700 text-white' : 'bg-canvas text-muted',
                      active && 'ring-4 ring-brand-200',
                    )}
                  >
                    {done && !active ? <Check size={16} /> : i + 1}
                  </span>
                  {i < ORDER_STEPS.length - 1 && <span className={clsx('w-0.5 flex-1', i < current ? 'bg-brand-700' : 'bg-line')} />}
                </div>
                <div className="pb-5">
                  <p className={clsx('font-semibold', !done && 'text-muted')}>{s.label}</p>
                  <p className="text-xs text-muted">
                    {s.status === 'programado' && `Envío automático ${hhmm(order.sendAt)}`}
                    {s.status === 'recibido' && hhmm(order.sendAt)}
                    {s.status === 'preparando' && `${order.prepMinutes} min de preparación`}
                    {s.status === 'listo' && hhmm(order.readyAt)}
                    {s.status === 'recogido' && (order.pickedUpAt ? hhmm(order.pickedUpAt) : s.hint)}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </Card>

      {/* Resumen */}
      <Card className="mt-4">
        {order.items.map((it) => {
          const m = menu.find((x) => x.id === it.menuItemId)
          return (
            <div key={it.menuItemId} className="flex items-center gap-3">
              <span className="text-3xl">{m?.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold">
                  {it.qty > 1 ? `${it.qty}× ` : ''}
                  {m?.name}
                </p>
                <p className="text-xs text-muted">{m?.components.join(' · ')}</p>
              </div>
            </div>
          )
        })}
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <span className="flex items-center gap-2 text-sm text-muted">
            <Wallet size={16} /> Pago en caja (simulado)
          </span>
          <span className="font-bold">{formatPrice(order.total)}</span>
        </div>
      </Card>

      {/* Acciones */}
      <div className="mt-5 space-y-2">
        {status === 'listo' && (
          <Button
            full
            size="lg"
            variant="accent"
            onClick={() => {
              pickUpOrder(order.id, now)
              setAskLog(true)
            }}
          >
            Ya lo recogí
          </Button>
        )}
        {status !== 'cancelado' && status !== 'recogido' && (
          <Button full variant="secondary" icon={<QrCode size={18} />} onClick={() => navigate('/pase')}>
            Mostrar mi pase
          </Button>
        )}
        {status === 'programado' && (
          <Button
            full
            variant="danger"
            onClick={async () => {
              await cafeteriaApi.cancelOrder(order.id)
              cancelOrder(order.id, now)
            }}
          >
            Cancelar pedido
          </Button>
        )}
        {next && (
          <button
            onClick={() => setClock(demoClockAt(next, clock.mode === 'demo' ? clock.speed : 1))}
            className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-semibold text-muted"
          >
            <FastForward size={14} /> Demo: adelantar al siguiente estado ({hhmm(next)})
          </button>
        )}
      </div>

      <BottomSheet open={askLog} onClose={() => setAskLog(false)}>
        <div className="text-center">
          <div className="mx-auto mb-3 grid size-16 animate-pop place-items-center rounded-full bg-accent-400 text-brand-950">
            <Check size={30} />
          </div>
          <p className="font-display text-[30px] leading-none tracking-wide text-brand-900">¿Registramos tu {order.mealLabel.toLowerCase()}?</p>
          <p className="mt-2 text-sm text-muted">Así suma a tu progreso de la semana.</p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" full onClick={() => setAskLog(false)}>
              Ahora no
            </Button>
            <Button
              full
              onClick={() => {
                if (meal) markDone(meal)
                setAskLog(false)
                setCelebrate(true)
              }}
            >
              Sí, marcar
            </Button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={celebrate} onClose={() => setCelebrate(false)}>
        <div className="text-center">
          <div className="mx-auto mb-3 grid size-16 animate-pop place-items-center rounded-full bg-brand-100 text-brand-800">
            <PartyPopper size={30} />
          </div>
          <p className="font-display text-[32px] leading-none tracking-wide text-brand-900">¡Comida a tiempo!</p>
          <p className="mt-2 text-sm text-muted">Te ahorraste la cola y sumaste a tu racha.</p>
          <Button full className="mt-5" onClick={() => navigate('/progreso')}>
            Ver mi progreso
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
