import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MealSettingsForm } from '../../components/meals/MealSettingsForm'
import { Button } from '../../components/ui'
import { useAppStore } from '../../store/useAppStore'
import type { DayOfWeek } from '../../types'
import { OnboardingLayout } from './OnboardingLayout'

export default function MealSetupPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)
  const schedule = useAppStore((s) => s.schedule)
  const [draft, setDraft] = useState(settings)
  const previewDay = (schedule.map((c) => c.day).sort()[0] ?? 1) as DayOfWeek

  return (
    <OnboardingLayout
      step={3}
      title="Tus horarios de comida"
      subtitle="Aproximado está bien: lo usamos para calcular cuándo te tocará comer."
      footer={
        <Button
          full
          size="lg"
          onClick={() => {
            setSettings(draft)
            navigate('/onboarding/generando')
          }}
        >
          Generar mi plan
        </Button>
      }
    >
      <MealSettingsForm value={draft} onChange={setDraft} schedule={schedule} previewDay={previewDay} />
    </OnboardingLayout>
  )
}
