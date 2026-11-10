import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { generateSampleHistory } from '../data/sampleHistory'
import { SAMPLE_SCHEDULE } from '../data/sampleSchedule'
import { DEFAULT_MEAL_SETTINGS, SAMPLE_STUDENT } from '../data/sampleStudent'
import { computeNow, REAL_CLOCK } from '../services/clock'
import type {
  AppNotification,
  ClassSession,
  ClockState,
  ISODate,
  MealLog,
  MealPlace,
  MealSettings,
  Order,
  StudentProfile,
} from '../types'
import { buildDayPlan } from '../utils/dayPlans'
import { toISODate } from '../utils/time'

interface AppState {
  onboardingDone: boolean
  profile: StudentProfile | null
  schedule: ClassSession[]
  settings: MealSettings
  logs: MealLog[]
  orders: Order[]
  notifications: AppNotification[]
  firedKeys: string[]
  clock: ClockState
  mealPlaces: Record<string, MealPlace>
  /** Notificación visible como banner (no se persiste) */
  banner: AppNotification | null
  /** Panel de presentación visible en escritorio */
  presenterPanel: boolean

  setProfile: (p: StudentProfile) => void
  setSchedule: (s: ClassSession[]) => void
  upsertClass: (c: ClassSession) => void
  removeClass: (id: string) => void
  setSettings: (s: Partial<MealSettings>) => void
  completeOnboarding: () => void

  logMeal: (log: MealLog) => void
  undoLog: (mealId: string) => void
  setMealPlace: (mealId: string, place: MealPlace) => void

  addOrder: (o: Order) => void
  pickUpOrder: (id: string, ts: number) => void
  cancelOrder: (id: string, ts: number) => void

  pushNotification: (n: Omit<AppNotification, 'id' | 'read'>, showBanner?: boolean) => void
  markFired: (keys: string[]) => void
  markAllRead: () => void
  dismissBanner: () => void

  setClock: (c: ClockState) => void
  setPresenterPanel: (v: boolean) => void
  loadSampleHistory: () => void
  loadDemoData: () => void
  resetAll: () => void
}

const initialData = {
  onboardingDone: false,
  profile: null,
  schedule: [] as ClassSession[],
  settings: DEFAULT_MEAL_SETTINGS,
  logs: [] as MealLog[],
  orders: [] as Order[],
  notifications: [] as AppNotification[],
  firedKeys: [] as string[],
  clock: REAL_CLOCK,
  mealPlaces: {} as Record<string, MealPlace>,
  banner: null,
  presenterPanel: true,
}

function todayFor(clock: ClockState): ISODate {
  return toISODate(new Date(computeNow(clock)))
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData,

      setProfile: (profile) => set({ profile }),
      setSchedule: (schedule) => set({ schedule }),
      upsertClass: (c) =>
        set((s) => ({
          schedule: s.schedule.some((x) => x.id === c.id) ? s.schedule.map((x) => (x.id === c.id ? c : x)) : [...s.schedule, c],
        })),
      removeClass: (id) => set((s) => ({ schedule: s.schedule.filter((c) => c.id !== id) })),
      setSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
      completeOnboarding: () => set({ onboardingDone: true }),

      logMeal: (log) => set((s) => ({ logs: [...s.logs.filter((l) => l.mealId !== log.mealId), log] })),
      undoLog: (mealId) => set((s) => ({ logs: s.logs.filter((l) => l.mealId !== mealId) })),
      setMealPlace: (mealId, place) => set((s) => ({ mealPlaces: { ...s.mealPlaces, [mealId]: place } })),

      addOrder: (o) => set((s) => ({ orders: [...s.orders.filter((x) => x.mealId !== o.mealId || x.cancelledAt), o] })),
      pickUpOrder: (id, ts) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, pickedUpAt: ts } : o)) })),
      cancelOrder: (id, ts) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, cancelledAt: ts } : o)) })),

      pushNotification: (n, showBanner = true) => {
        const notification: AppNotification = { ...n, id: `${n.key}-${Date.now()}`, read: false }
        set((s) => ({
          notifications: [notification, ...s.notifications].slice(0, 60),
          banner: showBanner ? notification : s.banner,
        }))
      },
      markFired: (keys) => set((s) => ({ firedKeys: [...s.firedKeys, ...keys].slice(-300) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      dismissBanner: () => set({ banner: null }),

      setClock: (clock) => set({ clock }),
      setPresenterPanel: (presenterPanel) => set({ presenterPanel }),

      loadSampleHistory: () => {
        const { schedule, settings, clock } = get()
        const today = todayFor(clock)
        const logs = generateSampleHistory(today, (date) => buildDayPlan(date, schedule, settings).meals)
        // Conserva lo que el usuario registró hoy
        set((s) => ({ logs: [...logs, ...s.logs.filter((l) => l.date >= today)] }))
      },

      loadDemoData: () => {
        set({ profile: SAMPLE_STUDENT, schedule: SAMPLE_SCHEDULE.map((c) => ({ ...c })), settings: DEFAULT_MEAL_SETTINGS })
        get().loadSampleHistory()
        set({ onboardingDone: true })
      },

      resetAll: () => set({ ...initialData, clock: get().clock }),
    }),
    {
      name: 'upc-food-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const { banner: _banner, ...rest } = s
        return rest
      },
    },
  ),
)
