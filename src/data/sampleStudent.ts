import type { MealSettings, StudentProfile } from '../types'

export const SAMPLE_STUDENT: StudentProfile = {
  name: 'Alex',
  studentCode: 'U20261234',
  career: 'Ingeniería de Sistemas',
  campus: 'Monterrico',
}

export const DEFAULT_MEAL_SETTINGS: MealSettings = {
  firstMealTime: 7 * 60,
  hungerInterval: 4 * 60,
  minMealDuration: 25,
  dayEnd: 22 * 60,
}

export const CAREERS = [
  'Ingeniería de Sistemas',
  'Ingeniería de Software',
  'Ingeniería Biomédica',
  'Ingeniería Industrial',
  'Ingeniería Civil',
  'Administración',
  'Arquitectura',
  'Comunicaciones',
  'Medicina',
  'Psicología',
  'Otra',
]
