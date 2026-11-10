import { useSyncExternalStore } from 'react'
import { computeNow } from '../services/clock'
import { useAppStore } from '../store/useAppStore'
import { minutesOfDay, toISODate } from '../utils/time'

// Un único "tic" global por segundo compartido por todos los componentes
let tick = Date.now()
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined

function subscribe(cb: () => void) {
  listeners.add(cb)
  if (!timer) {
    timer = setInterval(() => {
      tick = Date.now()
      listeners.forEach((l) => l())
    }, 1000)
  }
  return () => {
    listeners.delete(cb)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

/** Timestamp actual según el reloj de la app (real o demo) */
export function useNow(): number {
  const real = useSyncExternalStore(subscribe, () => tick)
  const clock = useAppStore((s) => s.clock)
  return computeNow(clock, Math.max(real, clock.realAnchor))
}

/** Fecha y minutos del día del reloj de la app */
export function useToday() {
  const now = useNow()
  const d = new Date(now)
  return { now, today: toISODate(d), nowMinutes: minutesOfDay(d) }
}
