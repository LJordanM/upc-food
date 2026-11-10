// Tipos de dominio de UPC Food.
// Todas las horas del día se manejan como minutos desde medianoche (ej. 07:30 → 450).

export type Minutes = number
/** Fecha local en formato YYYY-MM-DD */
export type ISODate = string
/** 0 = domingo … 6 = sábado (igual que Date.getDay()) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface ClassSession {
  id: string
  courseName: string
  day: DayOfWeek
  start: Minutes
  end: Minutes
  location?: string
  modality?: 'presencial' | 'virtual'
}

export interface StudentProfile {
  name: string
  studentCode?: string
  career: string
  campus: string
}

export interface MealSettings {
  /** Hora aproximada del desayuno (primera comida) */
  firstMealTime: Minutes
  /** Cada cuánto suele tener hambre */
  hungerInterval: Minutes
  /** Tiempo mínimo que necesita para comer */
  minMealDuration: Minutes
  /** Hora límite: ninguna comida termina después de esta hora */
  dayEnd: Minutes
}

export interface NutritionSource {
  title: string
  url: string
}

export interface NutritionRules {
  /** Intervalo mínimo recomendado entre el inicio de dos comidas */
  minInterval: Minutes
  /** Intervalo máximo recomendado */
  maxInterval: Minutes
  /** Tolerancia alrededor de la hora objetivo */
  tolerance: Minutes
  /** Margen para llegar a la siguiente clase */
  bufferBeforeClass: Minutes
  /** Hueco mínimo para sugerir un snack rápido */
  microSnackMin: Minutes
  /** Separación mínima absoluta entre dos comidas (para el fallback) */
  absoluteMinGap: Minutes
  maxMealsPerDay: number
  /** Desde qué hora se analiza el día */
  dayStart: Minutes
  sources: NutritionSource[]
  note: string
}

export type SlotKind = 'before' | 'between' | 'after'

export interface FreeSlot {
  start: Minutes
  end: Minutes
  duration: Minutes
  kind: SlotKind
  /** ¿Entra una comida de duración mínima? */
  fitsMeal: boolean
  /** Clase que termina justo antes del hueco (si existe) */
  prevClass?: ClassSession
  /** Clase que empieza justo después del hueco (si existe) */
  nextClass?: ClassSession
}

export type MealLabel = 'Desayuno' | 'Media mañana' | 'Almuerzo' | 'Lonche' | 'Cena'

export type PlannedMealStatus = 'ideal' | 'reubicada' | 'snack-rapido' | 'fuera-de-rango'

export interface PlannedMeal {
  id: string
  date: ISODate
  index: number
  label: MealLabel
  start: Minutes
  end: Minutes
  /** Hora que el intervalo de hambre sugería */
  target: Minutes
  slot: FreeSlot
  status: PlannedMealStatus
  /** Explicación legible de la decisión */
  reason: string
  /** El espacio libre es justo (sobran ≤ 10 min) */
  tight: boolean
}

export type MenuCategory = 'plato' | 'ensalada' | 'para-llevar' | 'bebida' | 'snack'

export interface MenuItem {
  id: string
  name: string
  description: string
  components: string[]
  price: number
  prepMinutes: number
  category: MenuCategory
  emoji: string
  tags: string[]
}

export interface OrderItem {
  menuItemId: string
  qty: number
}

export type OrderStatus = 'programado' | 'recibido' | 'preparando' | 'listo' | 'recogido' | 'cancelado'

export interface Order {
  id: string
  mealId: string
  mealLabel: MealLabel
  date: ISODate
  items: OrderItem[]
  total: number
  prepMinutes: number
  /** Timestamps (ms) */
  createdAt: number
  sendAt: number
  readyAt: number
  pickupCode: string
  pickupPoint: string
  pickedUpAt?: number
  cancelledAt?: number
  /** El pedido se hizo tarde y estará listo después de la hora planificada */
  late: boolean
}

export interface MealLog {
  mealId: string
  date: ISODate
  label: MealLabel
  plannedStart: Minutes
  status: 'realizada' | 'omitida'
  actualTime?: Minutes
  onTime: boolean
  viaOrder: boolean
  skipReason?: string
}

export type NotificationType = 'reminder' | 'order' | 'suggestion' | 'info'

export interface AppNotification {
  id: string
  key: string
  type: NotificationType
  title: string
  body: string
  createdAt: number
  read: boolean
  link?: string
}

export interface ClockState {
  mode: 'real' | 'demo'
  /** Timestamp simulado en el momento del ancla */
  demoBase: number
  /** Timestamp real en el momento en que se fijó la hora demo */
  realAnchor: number
  speed: number
}

export type MealPlace = 'cafeteria' | 'propia' | 'otro'
