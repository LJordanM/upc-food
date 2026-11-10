import type { ReactNode } from 'react'
import { Bell, Gift, Repeat, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { AlgorithmView } from './AlgorithmView'
import { DemoControls } from './DemoControls'

/** Panel lateral para proyector: reloj simulado, escenarios y vista del algoritmo */
export function PresenterPanel() {
  const setPresenterPanel = useAppStore((s) => s.setPresenterPanel)
  const onboardingDone = useAppStore((s) => s.onboardingDone)
  return (
    <aside className="flex h-[844px] max-h-[calc(100dvh-48px)] w-[560px] flex-col overflow-hidden rounded-[32px] bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <p className="font-display text-[28px] leading-none tracking-wide text-brand-900">Panel de presentación</p>
          <p className="text-xs text-muted">Solo visible en pantallas grandes · no forma parte de la app</p>
        </div>
        <button onClick={() => setPresenterPanel(false)} className="grid size-9 place-items-center rounded-full bg-canvas text-muted" aria-label="Ocultar panel">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 no-scrollbar">
        <DemoControls />
        {onboardingDone && (
          <div className="border-t border-line pt-5">
            <AlgorithmView />
          </div>
        )}
        <div className="border-t border-line pt-5">
          <h4 className="mb-3 text-sm font-semibold text-ink">Ciclo del hábito en la app</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <LoopStep icon={<Bell size={16} />} title="Señal" text="Detecta el espacio libre y avisa 30 min antes." />
            <LoopStep icon={<Repeat size={16} />} title="Rutina" text="Reserva el espacio y programa el pedido." />
            <LoopStep icon={<Gift size={16} />} title="Recompensa" text="Comida lista, sin cola, racha que crece." />
          </div>
        </div>
      </div>
    </aside>
  )
}

function LoopStep({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-brand-50 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 font-bold text-brand-900">
        <span className="grid size-7 place-items-center rounded-lg bg-white text-brand-700">{icon}</span>
        {title}
      </div>
      <p className="leading-snug text-muted">{text}</p>
    </div>
  )
}
