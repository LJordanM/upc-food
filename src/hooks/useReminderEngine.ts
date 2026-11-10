import { useEffect, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { buildReminderEvents, dueReminders } from '../utils/reminders'
import { useDayPlan } from './useDayPlan'
import { useToday } from './useNow'

/**
 * Motor de recordatorios (la "señal" del hábito).
 * Revisa cada segundo qué eventos ya vencieron y los dispara una sola vez.
 */
export function useReminderEngine() {
  const { now, today } = useToday()
  const { meals } = useDayPlan(today)
  const orders = useAppStore((s) => s.orders)
  const logs = useAppStore((s) => s.logs)
  const firedKeys = useAppStore((s) => s.firedKeys)
  const onboardingDone = useAppStore((s) => s.onboardingDone)

  const events = useMemo(() => buildReminderEvents(meals, orders, logs), [meals, orders, logs])

  useEffect(() => {
    if (!onboardingDone) return
    const due = dueReminders(events, now, new Set(firedKeys))
    if (due.length === 0) return
    const { pushNotification, markFired } = useAppStore.getState()
    markFired(due.map((e) => e.key))
    due.forEach((e, i) => {
      // Solo el más reciente aparece como banner; todos quedan en la bandeja
      pushNotification({ key: e.key, type: e.type, title: e.title, body: e.body, link: e.link, createdAt: e.at }, i === due.length - 1)
    })
  }, [events, now, firedKeys, onboardingDone])
}
