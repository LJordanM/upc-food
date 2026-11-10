import clsx from 'clsx'
import { ChevronRight, X } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

// ---------- Card ----------
export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={clsx('rounded-3xl bg-white p-5 shadow-card', onClick && 'cursor-pointer transition active:scale-[0.99]', className)}
    >
      {children}
    </div>
  )
}

// ---------- Button ----------
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger'
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-900 text-white hover:bg-brand-800 disabled:bg-brand-900/40',
  secondary: 'bg-brand-100 text-brand-900 hover:bg-brand-200',
  outline: 'border-2 border-brand-900 text-brand-900 hover:bg-brand-50',
  ghost: 'text-brand-800 hover:bg-brand-50',
  accent: 'bg-accent-400 text-brand-950 hover:bg-accent-300',
  danger: 'border-2 border-coral-500 text-coral-500 hover:bg-coral-50',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
  icon?: ReactNode
}

export function Button({ variant = 'primary', size = 'md', full, icon, className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[0.98]',
        size === 'sm' && 'px-3 py-2 text-sm',
        size === 'md' && 'px-4 py-3 text-[15px]',
        size === 'lg' && 'px-5 py-4 text-base',
        full && 'w-full',
        VARIANTS[variant],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

// ---------- Chip (como los "Hoy Viernes 2/10" de Mi UPC) ----------
export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'shrink-0 rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition',
        active ? 'border-brand-800 bg-brand-800 text-white' : 'border-brand-700/70 bg-white text-brand-800 hover:bg-brand-50',
        className,
      )}
    >
      {children}
    </button>
  )
}

// ---------- SectionHeader (icono + título condensado + "Ver todo >") ----------
export function SectionHeader({
  icon,
  title,
  action,
  to,
  onAction,
  className,
}: {
  icon?: ReactNode
  title: string
  action?: string
  to?: string
  onAction?: () => void
  className?: string
}) {
  const actionEl = action ? (
    to ? (
      <Link to={to} className="flex items-center gap-0.5 text-sm font-semibold text-brand-700">
        {action} <ChevronRight size={18} />
      </Link>
    ) : (
      <button onClick={onAction} className="flex items-center gap-0.5 text-sm font-semibold text-brand-700">
        {action} <ChevronRight size={18} />
      </button>
    )
  ) : null
  return (
    <div className={clsx('flex items-center justify-between', className)}>
      <div className="flex items-center gap-3">
        {icon && <div className="grid size-11 place-items-center rounded-2xl bg-brand-100 text-brand-800">{icon}</div>}
        <h2 className="font-display text-[30px] leading-none tracking-wide text-ink">{title}</h2>
      </div>
      {actionEl}
    </div>
  )
}

export function PageTitle({ children, subtitle }: { children: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-[40px] leading-none tracking-wide text-brand-900">{children}</h1>
      {subtitle && <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p>}
    </div>
  )
}

// ---------- Badge ----------
type Tone = 'green' | 'yellow' | 'gray' | 'coral' | 'dark'
const TONES: Record<Tone, string> = {
  green: 'bg-brand-100 text-brand-800',
  yellow: 'bg-accent-100 text-accent-600',
  gray: 'bg-line text-muted',
  coral: 'bg-coral-50 text-coral-500',
  dark: 'bg-brand-900 text-white',
}
export function Badge({ tone = 'green', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase', TONES[tone], className)}>
      {children}
    </span>
  )
}

// ---------- BottomSheet (se monta dentro del contenedor del "celular") ----------
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const sheet = (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 animate-fade-in bg-brand-950/40" onClick={onClose} />
      <div className="relative max-h-[90%] animate-slide-up overflow-y-auto rounded-t-[28px] bg-white px-5 pt-3 pb-6 no-scrollbar">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[28px] leading-none tracking-wide text-brand-900">{title}</h3>
            <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-canvas text-muted" aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
  // Se monta en #sheet-root para cubrir toda la pantalla del celular (no solo el área con scroll)
  const root = document.getElementById('sheet-root')
  return root ? createPortal(sheet, root) : sheet
}

// ---------- Campos ----------
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-2xl border-2 border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-brand-600'

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="mb-2 grid size-12 place-items-center rounded-full bg-line text-muted">{icon}</div>
      <p className="font-semibold text-muted">{title}</p>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
    </div>
  )
}

// ---------- QR decorativo (no codifica datos reales) ----------
export function FakeQr({ seed }: { seed: string }) {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const cells: boolean[] = []
  for (let i = 0; i < 81; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    cells.push(((h >> 16) & 1) === 1)
  }
  const finder = (x: number, y: number) => (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5)
  return (
    <div className="grid size-24 shrink-0 grid-cols-9 gap-px rounded-xl bg-white p-1.5 ring-2 ring-line">
      {cells.map((on, i) => {
        const x = i % 9
        const y = Math.floor(i / 9)
        return <span key={i} className={clsx('rounded-[1px]', finder(x, y) || on ? 'bg-brand-950' : 'bg-transparent')} />
      })}
    </div>
  )
}

// ---------- Anillo de progreso ----------
export function ProgressRing({ value, size = 120, stroke = 12, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value))
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-brand-100)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-brand-700)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}
