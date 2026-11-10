import { PanelRightOpen } from 'lucide-react'
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PresenterPanel } from './components/demo/PresenterPanel'
import { BottomNav } from './components/layout/BottomNav'
import { NotificationBanner } from './components/layout/NotificationBanner'
import { PhoneFrame } from './components/layout/PhoneFrame'
import { useReminderEngine } from './hooks/useReminderEngine'
import HomePage from './pages/HomePage'
import MealsPage from './pages/MealsPage'
import NotificationsPage from './pages/NotificationsPage'
import OrderDetailPage from './pages/OrderDetailPage'
import PassPage from './pages/PassPage'
import ProfilePage from './pages/ProfilePage'
import ProgressPage from './pages/ProgressPage'
import SchedulePage from './pages/SchedulePage'
import GeneratingPlanPage from './pages/onboarding/GeneratingPlanPage'
import MealSetupPage from './pages/onboarding/MealSetupPage'
import ProfileSetupPage from './pages/onboarding/ProfileSetupPage'
import ScheduleSetupPage from './pages/onboarding/ScheduleSetupPage'
import WelcomePage from './pages/onboarding/WelcomePage'
import { useAppStore } from './store/useAppStore'

const DESKTOP_QUERY = '(min-width: 1024px) and (min-height: 700px)'
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(DESKTOP_QUERY)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
  )
}

const TAB_ROUTES = ['/', '/horario', '/comidas', '/progreso', '/perfil']

/** Contenido de la app: rutas + barra inferior + banner de notificaciones */
function AppScreen() {
  const onboardingDone = useAppStore((s) => s.onboardingDone)
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)
  useReminderEngine()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  const showNav = onboardingDone && TAB_ROUTES.includes(location.pathname)
  const guard = (el: ReactNode) => (onboardingDone ? el : <Navigate to="/bienvenida" replace />)

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-canvas">
      <NotificationBanner />
      <div ref={scrollRef} id="app-scroll" className="relative min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <Routes>
          <Route path="/bienvenida" element={<WelcomePage />} />
          <Route path="/onboarding/perfil" element={<ProfileSetupPage />} />
          <Route path="/onboarding/horario" element={<ScheduleSetupPage />} />
          <Route path="/onboarding/comidas" element={<MealSetupPage />} />
          <Route path="/onboarding/generando" element={<GeneratingPlanPage />} />
          <Route path="/" element={guard(<HomePage />)} />
          <Route path="/horario" element={guard(<SchedulePage />)} />
          <Route path="/comidas" element={guard(<MealsPage />)} />
          <Route path="/pedido/:id" element={guard(<OrderDetailPage />)} />
          <Route path="/progreso" element={guard(<ProgressPage />)} />
          <Route path="/perfil" element={guard(<ProfilePage />)} />
          <Route path="/pase" element={guard(<PassPage />)} />
          <Route path="/notificaciones" element={guard(<NotificationsPage />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
      {/* Las hojas inferiores se montan aquí para cubrir toda la pantalla del celular */}
      <div id="sheet-root" />
    </div>
  )
}

export default function App() {
  const isDesktop = useIsDesktop()
  const presenterPanel = useAppStore((s) => s.presenterPanel)
  const setPresenterPanel = useAppStore((s) => s.setPresenterPanel)

  if (!isDesktop) {
    return (
      // Márgenes de la barra de estado y de navegación (navegador móvil y APK de Android)
      <div className="safe-area h-dvh">
        <AppScreen />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center gap-10 bg-[radial-gradient(circle_at_20%_10%,#e3f2e8,transparent_45%),radial-gradient(circle_at_90%_90%,#fdf0c7,transparent_40%)] p-6">
      <PhoneFrame>
        <AppScreen />
      </PhoneFrame>
      {presenterPanel ? (
        <PresenterPanel />
      ) : (
        <button
          onClick={() => setPresenterPanel(true)}
          className="fixed top-6 right-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 shadow-card"
        >
          <PanelRightOpen size={18} /> Panel de presentación
        </button>
      )}
    </div>
  )
}
