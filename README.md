# UPC Food — prototipo

Aplicación móvil (web app) que analiza el horario universitario y **encuentra automáticamente espacios para comer**, convirtiendo la alimentación en una actividad planificada más del día.

Problema: *malos hábitos alimenticios en estudiantes de pregrado de la UPC, campus Monterrico* (comida rápida por falta de tiempo y comidas saltadas). Enfoque: **organización + disponibilidad + formación de hábitos**. No es una app médica, no cuenta calorías ni recomienda dietas.

Ciclo del hábito (señal → rutina → recompensa):

| | En la app |
|---|---|
| **Señal** | Detecta el espacio libre y avisa 30 min antes de comer |
| **Rutina** | Reserva el espacio en el horario y programa el pedido |
| **Recompensa** | Comida lista sin cola, progreso semanal y racha |

## Cómo ejecutarlo

Requiere Node 20+.

```bash
npm install
npm run dev
```

- Abrir `http://localhost:5173`. En una pantalla grande se ve dentro de un marco de celular, con el **panel de presentación** al lado.
- **Para abrirlo en el celular** (misma red Wi-Fi): `npm run dev -- --host` y entrar a la IP que muestra la consola (ej. `http://192.168.1.20:5173`).
- **APK de Android (Capacitor)**: con el celular conectado por USB y la depuración USB activada:
  ```bash
  npm run build && npx cap sync android
  cd android && ./gradlew.bat assembleDebug
  adb install -r app/build/outputs/apk/debug/app-debug.apk
  ```
  El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk` y funciona sin PC ni internet.
- `npm run test` corre las pruebas de la lógica y `npm run build` genera la versión estática en `dist/`, que se puede subir a cualquier hosting estático.

## Arquitectura

React + TypeScript + Tailwind CSS v4 + Zustand (estado persistido en `localStorage`) + React Router (HashRouter).

```
src/
  types/      Tipos de dominio (ClassSession, FreeSlot, PlannedMeal, Order, MealLog…)
  data/       Datos mock: estudiante, horario, menú, historial y reglas de intervalos (nutritionRules.ts)
  utils/      LÓGICA PURA, sin React y con tests:
              slots.ts        → findAvailableSlots()
              mealPlanner.ts  → scheduleMeals(), planDay()
              orders.ts       → computeOrderTiming(), getOrderStatusAt()
              progress.ts     → estadísticas, racha, historial
              reminders.ts    → recordatorios
  services/   Capa preparada para backend: CafeteriaApi (Mock / Http), ScheduleSource (Mi UPC mock), reloj
  store/      Estado global (Zustand)
  hooks/      useNow, useDayPlan, useNextMeal, useReminderEngine, useMealActions
  components/ UI reutilizable (ui/, layout/, home/, schedule/, meals/, demo/)
  pages/      Onboarding + Inicio, Horario, Comidas, Pedido, Progreso, Perfil, Notificaciones
```

### Algoritmo de planificación

1. **`findAvailableSlots(classes, { dayStart, dayEnd })`**: ordena y fusiona las clases y devuelve los huecos entre ellas (antes, entre y después de clases).
2. **`scheduleMeals(freeSlots, firstMealTime, hungerInterval, minimumMealDuration)`**:
   - La primera comida apunta a la hora de desayuno y cada siguiente a `anterior + intervalo`.
   - Solo acepta inicios dentro de una ventana referencial de **3 a 5 h** después de la comida anterior (±1 h del objetivo).
   - Dentro de cada hueco busca el inicio más cercano a la hora objetivo, sin cruzarse nunca con una clase y dejando 5 min para llegar a la siguiente.
   - Si no hay hueco suficiente aplica, en este orden: **snack rápido** en un micro-hueco (≥10 min); **el hueco más cercano fuera del rango**, con aviso; o no agrega más comidas.
   - Cada comida trae su explicación ("¿Por qué a esta hora?").
   - Si el estudiante registra la hora real de una comida, el resto del día se recalcula.
3. **`computeOrderTiming(mealStart, prepMinutes, now)`**: `envío = comida − preparación`. Ejemplo: comida a las 13:00 con 15 min de preparación → el pedido se envía a las 12:45.

Con el horario de ejemplo del lunes (08:00 Matemática, 10:00 Intro a la Ingeniería, 12:00 Física, 15:00 Programación) el resultado es **07:00 Desayuno · 11:30 Media mañana (reubicada) · 14:30 Almuerzo · 18:30 Cena**.

> Los intervalos 3–5 h son **referenciales** (Cleveland Clinic, Northwestern Medicine) y están en `src/data/nutritionRules.ts`. En una versión real deben validarse con un nutricionista de la UPC.

### Conectar la API real de la cafetería

Implementar los endpoints que usa `HttpCafeteriaApi` (`GET /menu?date=`, `POST /orders`, `DELETE /orders/:id`) y definir la variable:

```bash
VITE_CAFETERIA_API_URL=https://api.ejemplo.edu.pe npm run dev
```

El horario de Mi UPC se conecta implementando la interfaz `ScheduleSource` (`src/services/scheduleSource.ts`).

## Guion de demo (5 minutos)

1. **Bienvenida → Empezar.** Crear el perfil "Alex", elegir *Importar desde Mi UPC* y continuar.
2. **Horarios de comida.** Mover el slider de intervalo y mostrar cómo cambia la vista previa del lunes en vivo. Luego *Generar mi plan*.
3. En el panel de presentación, elegir el escenario **Lunes 10:40**. Inicio muestra *Tu próxima comida 11:30* y el aviso "Reubicada: tu hora ideal era 11:00". La **vista del algoritmo** del panel enseña los huecos y las decisiones tomadas.
4. Elegir el escenario **Lunes 13:50**, ir a *Ordenar para recoger*, elegir *Pollo a la plancha* y leer el mensaje "Se enviará a las 14:15 para que esté listo a las 14:30". Confirmar.
5. En el pedido, pulsar *Demo: adelantar al siguiente estado* para recorrer Recibido → Preparando → Listo; aparecen las notificaciones. Luego *Ya lo recogí* → registrar la comida.
6. **Progreso:** % semanal, racha, "cómo vas formando tu hábito" e historial.
7. Escenarios extra: **Martes 10:20** (día cargado, almuerzo fuera de rango) y **Jueves 06:05 / 09:35** (desayuno adelantado y snack rápido en un hueco de 15 min).

*Reiniciar (onboarding)*, en el panel o en Perfil, deja la app como nueva.
