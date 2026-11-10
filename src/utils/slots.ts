import type { ClassSession, FreeSlot, Minutes } from '../types'

export interface DayBounds {
  dayStart: Minutes
  dayEnd: Minutes
  /** Duración mínima para considerar que un hueco sirve para comer */
  minMealDuration?: Minutes
}

interface MergedBlock {
  start: Minutes
  end: Minutes
  first: ClassSession
  last: ClassSession
}

/**
 * Detecta los espacios libres de un día a partir de sus clases.
 *
 * 1. Ordena las clases y fusiona las que se cruzan o son contiguas.
 * 2. Recorre el día con un cursor; cada hueco entre el cursor y la siguiente clase es un espacio libre.
 * 3. Lo que queda después de la última clase hasta `dayEnd` es el espacio "after".
 */
export function findAvailableSlots(classes: ClassSession[], bounds: DayBounds): FreeSlot[] {
  const { dayStart, dayEnd, minMealDuration = 0 } = bounds
  const sorted = [...classes].sort((a, b) => a.start - b.start || a.end - b.end)

  const blocks: MergedBlock[] = []
  for (const c of sorted) {
    const last = blocks[blocks.length - 1]
    if (last && c.start <= last.end) {
      if (c.end > last.end) {
        last.end = c.end
        last.last = c
      }
    } else {
      blocks.push({ start: c.start, end: c.end, first: c, last: c })
    }
  }

  const slots: FreeSlot[] = []
  let cursor = dayStart
  let prevBlock: MergedBlock | undefined

  const push = (start: Minutes, end: Minutes, nextBlock?: MergedBlock) => {
    if (end <= start) return
    const duration = end - start
    slots.push({
      start,
      end,
      duration,
      kind: !nextBlock ? 'after' : !prevBlock ? 'before' : 'between',
      fitsMeal: duration >= minMealDuration,
      prevClass: prevBlock?.last,
      nextClass: nextBlock?.first,
    })
  }

  for (const block of blocks) {
    if (block.end <= dayStart) {
      prevBlock = block
      continue
    }
    if (block.start >= dayEnd) break
    if (block.start > cursor) push(cursor, Math.min(block.start, dayEnd), block)
    cursor = Math.max(cursor, block.end)
    prevBlock = block
  }
  if (cursor < dayEnd) push(cursor, dayEnd)

  return slots
}
