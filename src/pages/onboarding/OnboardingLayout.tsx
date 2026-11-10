import clsx from 'clsx'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export function OnboardingLayout({
  step,
  title,
  subtitle,
  children,
  footer,
}: {
  step: number
  title: string
  subtitle?: string
  children: ReactNode
  footer: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-full flex-col px-5 pt-3 pb-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="grid size-10 place-items-center rounded-full bg-white shadow-card" aria-label="Atrás">
          <ChevronLeft size={22} />
        </button>
        <div className="flex flex-1 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={clsx('h-1.5 flex-1 rounded-full transition', i <= step ? 'bg-brand-700' : 'bg-line')} />
          ))}
        </div>
        <span className="text-xs font-semibold text-muted">{step}/4</span>
      </div>
      <h1 className="font-display text-[38px] leading-[0.95] tracking-wide text-brand-900">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] leading-snug text-muted">{subtitle}</p>}
      <div className="mt-6 flex-1 animate-fade-in">{children}</div>
      <div className="sticky bottom-0 mt-6 bg-canvas pt-2">{footer}</div>
    </div>
  )
}
