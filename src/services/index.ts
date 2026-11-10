import { HttpCafeteriaApi, MockCafeteriaApi, type CafeteriaApi } from './cafeteriaApi'
import { MockMiUpcScheduleSource, type ScheduleSource } from './scheduleSource'

const apiUrl = import.meta.env.VITE_CAFETERIA_API_URL as string | undefined

/** Punto único para cambiar de mock a API real */
export const cafeteriaApi: CafeteriaApi = apiUrl ? new HttpCafeteriaApi(apiUrl) : new MockCafeteriaApi()
export const scheduleSource: ScheduleSource = new MockMiUpcScheduleSource()
