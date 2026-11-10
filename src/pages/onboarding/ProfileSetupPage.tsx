import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Field, inputClass } from '../../components/ui'
import { CAREERS } from '../../data/sampleStudent'
import { useAppStore } from '../../store/useAppStore'
import { OnboardingLayout } from './OnboardingLayout'

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)
  const [name, setName] = useState(profile?.name ?? '')
  const [code, setCode] = useState(profile?.studentCode ?? '')
  const [career, setCareer] = useState(profile?.career ?? CAREERS[0])

  const save = () => {
    setProfile({ name: name.trim(), studentCode: code.trim() || undefined, career, campus: 'Monterrico' })
    navigate('/onboarding/horario')
  }

  return (
    <OnboardingLayout
      step={1}
      title="Crea tu perfil"
      subtitle="Solo lo necesario para personalizar tu plan."
      footer={
        <Button full size="lg" disabled={!name.trim()} onClick={save}>
          Continuar
        </Button>
      }
    >
      <div className="space-y-4">
        <Field label="¿Cómo te llamas?">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Alex" autoFocus />
        </Field>
        <Field label="Código de alumno" hint="Opcional. Servirá para importar tu horario desde Mi UPC.">
          <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="U2026XXXX" />
        </Field>
        <Field label="Carrera">
          <select className={inputClass} value={career} onChange={(e) => setCareer(e.target.value)}>
            {CAREERS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <div className="flex items-center gap-3 rounded-2xl bg-brand-50 p-4">
          <MapPin className="text-brand-700" size={20} />
          <div>
            <p className="text-sm font-semibold">Campus Monterrico</p>
            <p className="text-xs text-muted">Piloto disponible solo en este campus</p>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  )
}
