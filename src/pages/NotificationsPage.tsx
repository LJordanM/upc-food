import clsx from 'clsx'
import { BellOff, ChevronLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationIcon } from '../components/layout/NotificationBanner'
import { EmptyState } from '../components/ui'
import { useAppStore } from '../store/useAppStore'
import { DAY_ABBR, minutesOfDay, toHHMM } from '../utils/time'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const notifications = useAppStore((s) => s.notifications)
  const markAllRead = useAppStore((s) => s.markAllRead)

  // Al salir de la pantalla se marcan como leídas
  useEffect(() => () => markAllRead(), [markAllRead])

  return (
    <div className="px-5 pt-3 pb-8">
      <div className="mb-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="grid size-10 place-items-center rounded-full bg-white shadow-card" aria-label="Atrás">
          <ChevronLeft size={22} />
        </button>
        <p className="font-display text-[32px] leading-none tracking-wide">Notificaciones</p>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={<BellOff size={22} />} title="Sin notificaciones por ahora" text="Te avisaremos 30 minutos antes de cada comida." />
      ) : (
        <ul className="space-y-2.5">
          {notifications.map((n) => {
            const d = new Date(n.createdAt)
            return (
              <li key={n.id}>
                <button
                  onClick={() => n.link && navigate(n.link)}
                  className={clsx('flex w-full gap-3 rounded-3xl p-4 text-left shadow-card', n.read ? 'bg-white' : 'bg-brand-50 ring-2 ring-brand-200')}
                >
                  <span
                    className={clsx(
                      'grid size-10 shrink-0 place-items-center rounded-2xl',
                      n.type === 'order' ? 'bg-accent-100 text-accent-600' : 'bg-brand-100 text-brand-800',
                    )}
                  >
                    {notificationIcon(n, 18)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2">
                      <span className="font-semibold leading-snug">{n.title}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {DAY_ABBR[d.getDay()]} {toHHMM(minutesOfDay(d))}
                      </span>
                    </span>
                    <span className="block text-sm leading-snug text-muted">{n.body}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
