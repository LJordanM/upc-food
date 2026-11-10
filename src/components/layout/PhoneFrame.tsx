import { BatteryFull, Signal, Wifi } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNow } from '../../hooks/useNow'

/** Marco de celular para presentar en laptop/proyector. En el celular real no se usa. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const now = useNow()
  const time = new Date(now).toTimeString().slice(0, 5)
  return (
    <div className="relative h-[844px] max-h-[calc(100dvh-48px)] w-[390px] shrink-0 rounded-[56px] bg-brand-950 p-[11px] shadow-[0_30px_80px_rgba(14,43,28,0.35)]">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[46px] bg-canvas">
        <div className="relative z-30 flex h-11 shrink-0 items-center justify-between bg-canvas px-8 text-[14px] font-semibold text-ink">
          <span>{time}</span>
          <div className="absolute top-2.5 left-1/2 h-7 w-28 -translate-x-1/2 rounded-full bg-brand-950" />
          <div className="flex items-center gap-1.5">
            <Signal size={15} strokeWidth={2.5} />
            <Wifi size={15} strokeWidth={2.5} />
            <BatteryFull size={20} strokeWidth={2} />
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  )
}
