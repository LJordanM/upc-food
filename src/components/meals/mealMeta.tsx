import { Apple, Coffee, Moon, Sandwich, UtensilsCrossed } from 'lucide-react'
import type { MealLabel, PlannedMealStatus } from '../../types'
import { Badge } from '../ui'

export function MealIcon({ label, size = 20 }: { label: MealLabel; size?: number }) {
  switch (label) {
    case 'Desayuno':
      return <Coffee size={size} />
    case 'Media mañana':
      return <Apple size={size} />
    case 'Almuerzo':
      return <UtensilsCrossed size={size} />
    case 'Lonche':
      return <Sandwich size={size} />
    case 'Cena':
      return <Moon size={size} />
  }
}

export const STATUS_META: Record<PlannedMealStatus, { text: string; tone: 'green' | 'yellow' | 'coral' }> = {
  ideal: { text: 'En tu horario', tone: 'green' },
  reubicada: { text: 'Reubicada', tone: 'yellow' },
  'snack-rapido': { text: 'Snack rápido', tone: 'yellow' },
  'fuera-de-rango': { text: 'Día cargado', tone: 'coral' },
}

export function MealStatusBadge({ status }: { status: PlannedMealStatus }) {
  const m = STATUS_META[status]
  return <Badge tone={m.tone}>{m.text}</Badge>
}
