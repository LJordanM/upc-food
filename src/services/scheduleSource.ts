import { SAMPLE_SCHEDULE } from '../data/sampleSchedule'
import type { ClassSession } from '../types'

/** Origen del horario. Hoy: mock de Mi UPC. Mañana: integración real con el portal. */
export interface ScheduleSource {
  importSchedule(studentCode?: string): Promise<ClassSession[]>
}

export class MockMiUpcScheduleSource implements ScheduleSource {
  async importSchedule(): Promise<ClassSession[]> {
    await new Promise((r) => setTimeout(r, 1200))
    return SAMPLE_SCHEDULE.map((c) => ({ ...c }))
  }
}
