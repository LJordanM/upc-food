import { Bell, ChefHat, Lightbulb, PackageCheck } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import type { AppNotification } from '../../types'

export function notificationIcon(n: Pick<AppNotification, 'type' | 'key'>, size = 20) {
  if (n.type === 'order') return n.key.endsWith('ready') ? <PackageCheck size={size} /> : <ChefHat size={size} />
  if (n.type === 'suggestion') return <Lightbulb size={size} />
  return <Bell size={size} />
}

/** Notificación tipo "push" que baja desde arriba dentro del celular */
export function NotificationBanner() {
  const banner = useAppStore((s) => s.banner)
  const dismiss = useAppStore((s) => s.dismissBanner)
  const navigate = useNavigate()

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(dismiss, 6000)
    return () => clearTimeout(t)
  }, [banner, dismiss])

  if (!banner) return null
  return (
    <button
      key={banner.id}
      onClick={() => {
        dismiss()
        if (banner.link) navigate(banner.link)
      }}
      className="absolute inset-x-3 top-3 z-50 flex animate-slide-down items-start gap-3 rounded-3xl bg-brand-950/95 p-4 text-left text-white shadow-float backdrop-blur"
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent-400 text-brand-950">{notificationIcon(banner)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-[11px] font-semibold tracking-wide text-white/60 uppercase">
          <span>UPC Food</span>
          <span>ahora</span>
        </div>
        <p className="mt-0.5 font-semibold leading-snug">{banner.title}</p>
        <p className="text-sm leading-snug text-white/75">{banner.body}</p>
      </div>
    </button>
  )
}
