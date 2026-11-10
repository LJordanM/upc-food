import type { ClassSession, DayOfWeek } from '../types'
import { toMinutes } from '../utils/time'

const c = (
  id: string,
  day: DayOfWeek,
  start: string,
  end: string,
  courseName: string,
  location: string,
): ClassSession => ({ id, day, start: toMinutes(start), end: toMinutes(end), courseName, location, modality: 'presencial' })

/**
 * Horario semanal de ejemplo.
 * - Lunes: el del enunciado (huecos 09:30, 11:30, 13:30–15:00 y 17:00 en adelante).
 * - Martes: clases seguidas de 09:00 a 13:00 → almuerzo "fuera de rango".
 * - Jueves: clase a las 07:00 → desayuno reubicado + micro-hueco de 15 min (snack rápido).
 */
export const SAMPLE_SCHEDULE: ClassSession[] = [
  // Lunes
  c('lun-1', 1, '08:00', '09:30', 'Matemática Básica', 'A-305'),
  c('lun-2', 1, '10:00', '11:30', 'Introducción a la Ingeniería', 'B-201'),
  c('lun-3', 1, '12:00', '13:30', 'Física I', 'Lab C-104'),
  c('lun-4', 1, '15:00', '17:00', 'Programación', 'Lab H-501'),
  // Martes
  c('mar-1', 2, '09:00', '11:00', 'Química General', 'D-402'),
  c('mar-2', 2, '11:00', '13:00', 'Matemática Básica', 'A-305'),
  c('mar-3', 2, '14:00', '16:00', 'Comprensión y Producción de Lenguaje', 'E-110'),
  c('mar-4', 2, '18:00', '20:00', 'Taller de Liderazgo', 'F-201'),
  // Miércoles
  c('mie-1', 3, '08:00', '09:30', 'Matemática Básica', 'A-305'),
  c('mie-2', 3, '10:00', '11:30', 'Introducción a la Ingeniería', 'B-201'),
  c('mie-3', 3, '16:00', '18:00', 'Física I (Laboratorio)', 'Lab C-104'),
  // Jueves
  c('jue-1', 4, '07:00', '10:00', 'Física I', 'C-301'),
  c('jue-2', 4, '10:15', '13:00', 'Programación', 'Lab H-501'),
  c('jue-3', 4, '15:00', '17:00', 'Ética y Ciudadanía', 'E-204'),
  // Viernes
  c('vie-1', 5, '09:00', '11:00', 'Matemática Básica (Taller)', 'A-210'),
  c('vie-2', 5, '13:00', '15:00', 'Programación', 'Lab H-501'),
]
