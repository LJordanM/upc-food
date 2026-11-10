import type { NutritionRules } from '../types'

/**
 * Reglas referenciales para espaciar comidas.
 *
 * Las recomendaciones generales de nutricionistas suelen ubicarse entre 3 y 5 horas
 * entre comidas. NO son una prescripción médica: en una versión real deben validarse
 * con el equipo de nutrición de la UPC y ajustarse por perfil.
 */
export const NUTRITION_RULES: NutritionRules = {
  minInterval: 3 * 60,
  maxInterval: 5 * 60,
  tolerance: 60,
  bufferBeforeClass: 5,
  microSnackMin: 10,
  absoluteMinGap: 2 * 60,
  maxMealsPerDay: 6,
  dayStart: 6 * 60,
  sources: [
    {
      title: 'Cleveland Clinic: What time is the right time to eat?',
      url: 'https://my.clevelandclinic.org/podcasts/health-essentials/what-time-is-the-right-time-to-eat-with-julia-zumpano',
    },
    {
      title: 'Northwestern Medicine: Best times to eat',
      url: 'https://www.nm.org/healthbeat/healthy-tips/nutrition/best-times-to-eat',
    },
  ],
  note: 'Rango referencial de 3 a 5 h entre comidas. Pendiente de validación con un nutricionista de la UPC.',
}

/** Límites de la configuración que el estudiante puede elegir */
export const SETTINGS_LIMITS = {
  hungerInterval: { min: NUTRITION_RULES.minInterval, max: NUTRITION_RULES.maxInterval, step: 30 },
  minMealDuration: { min: 15, max: 45, step: 5 },
}
