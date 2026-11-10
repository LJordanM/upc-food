import clsx from 'clsx'
import { CalendarDays, House, TrendingUp, User, UtensilsCrossed } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Inicio', icon: House },
  { to: '/horario', label: 'Horario', icon: CalendarDays },
  { to: '/comidas', label: 'Comidas', icon: UtensilsCrossed },
  { to: '/progreso', label: 'Progreso', icon: TrendingUp },
  { to: '/perfil', label: 'Perfil', icon: User },
]

/** Navegación inferior con indicador superior en la pestaña activa (como Mi UPC) */
export function BottomNav() {
  return (
    <nav className="relative z-30 grid shrink-0 grid-cols-5 border-t border-line bg-white pb-2">
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            clsx('relative flex flex-col items-center gap-1 pt-3 pb-1 text-[12px] font-medium', isActive ? 'font-bold text-brand-800' : 'text-ink/80')
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={clsx(
                  'absolute top-0 h-1 w-10 rounded-b-full bg-brand-700 transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
              />
              <Icon size={23} strokeWidth={isActive ? 2.3 : 1.8} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
