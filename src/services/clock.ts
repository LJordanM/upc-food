import type { ClockState, ISODate, Minutes } from '../types'
import { toTimestamp } from '../utils/time'

/**
 * Reloj de la app. En modo "real" usa la hora del dispositivo; en modo "demo"
 * avanza desde una fecha/hora fijada, a la velocidad elegida (x1, x10, x60…).
 * Todo lo que depende de "ahora" (próxima comida, pedidos, recordatorios) lee este reloj.
 */
export const REAL_CLOCK: ClockState = { mode: 'real', demoBase: 0, realAnchor: 0, speed: 1 }

export function computeNow(clock: ClockState, realNow: number = Date.now()): number {
  if (clock.mode === 'real') return realNow
  const elapsed = Math.max(0, realNow - clock.realAnchor)
  return clock.demoBase + elapsed * clock.speed
}

export function demoClockAt(ts: number, speed = 1): ClockState {
  return { mode: 'demo', demoBase: ts, realAnchor: Date.now(), speed }
}

export function demoClockAtDay(date: ISODate, minutes: Minutes, speed = 1): ClockState {
  return demoClockAt(toTimestamp(date, minutes), speed)
}

/** Cambia la velocidad conservando la hora simulada actual */
export function withSpeed(clock: ClockState, speed: number): ClockState {
  const now = computeNow(clock)
  return demoClockAt(now, speed)
}
