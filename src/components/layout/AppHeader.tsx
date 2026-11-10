import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'

export function Logo({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`font-display text-[30px] leading-none tracking-wide ${light ? 'text-white' : 'text-ink'}`}>UPC FOOD</span>
      <span className={`h-6 w-px ${light ? 'bg-white/40' : 'bg-ink/30'}`} />
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <circle cx="16" cy="17" r="11" fill="none" stroke="#F5C542" strokeWidth="3" />
        <path d="M16 10.5V17l4.5 2.8" stroke={light ? '#fff' : '#17462E'} strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <path d="M20 2c-3.5 0-6 2.3-6 5.3 3 0 6-1.8 6-5.3z" fill="#3F9A65" />
      </svg>
    </div>
  )
}

export function AppHeader() {
  const unread = useAppStore((s) => s.notifications.filter((n) => !n.read).length)
  return (
    <header className="flex items-center justify-between pt-2 pb-4">
      <Logo />
      <Link
        to="/notificaciones"
        className="relative grid size-12 place-items-center rounded-full bg-white text-ink shadow-card"
        aria-label="Notificaciones"
      >
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-5 animate-pop place-items-center rounded-full bg-accent-400 px-1 text-[11px] font-bold text-brand-950">
            {unread}
          </span>
        )}
      </Link>
    </header>
  )
}
