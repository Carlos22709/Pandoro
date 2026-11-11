# Progreso: niveles, lugares y desbloqueo

| | |
| --- | --- |
| **Tarea** | Fila 6 del cronograma: completar niveles y lugares de Progreso |
| **Responsable** | Andrea Sosa |
| **Código** | [`worldData.ts`](../src/components/progress/worldData.ts) (lugares), [`src/services/progress/`](../src/services/progress/) (pasos, semanas, cierre), [`demoState.ts`](../src/demo/demoState.ts) (aplicación del cierre) |
| **Pruebas** | [`tests/progress.test.ts`](../tests/progress.test.ts), [`tests/weeks.test.ts`](../tests/weeks.test.ts) |
| **Decisión** | «Semana viva», registrada el 8 de noviembre de 2026 en [`CONTEXTO.md`](CONTEXTO.md#decisiones), por confirmar con el equipo |

## 1. Escenarios de la demo final y orden de desbloqueo

Seis lugares, en este orden. El primero está abierto desde el inicio y cada uno siguiente se gana al **cerrar una semana completa**.

| # | Lugar | Cómo se llega |
| --- | --- | --- |
| 1 | Estanque de Pandoro | Desde el inicio |
| 2 | Bosque de origami | 1.ª semana completa |
| 3 | La casa de la Sra. Venus | 2.ª semana completa |
| 4 | El rosal del fantasma enamorado | 3.ª semana completa |
| 5 | El valle de las estrellas ciegas | 4.ª semana completa |
| 6 | El Pandén | 5.ª semana completa |

Con seis lugares, la historia completa son cinco semanas completas. Los lugares ganados pueden usarse como fondo de la pantalla de inicio. Cada lugar está en un estado: **completado** (anterior al actual), **actual** o **bloqueado**.

## 2. Cómo se actualiza el progreso con tareas reales

1. **Completar una tarea es un paso.** Se guarda un evento (`completions/{taskId}`) con su instante y `completedAt` en la tarea. Pandoro camina un trecho por el sendero hacia el siguiente lugar; cada paso mueve un poco menos que el anterior (`pandaTrailFraction`), de modo que siempre avanza algo y **nunca llega solo** al siguiente lugar. No hay barra ni porcentaje.
2. **Agregar o descartar tareas no cambia los pasos.** «Ya no aplica» quita la tarea de las listas sin dar ni quitar pasos.
3. **Una tarea completada puede desmarcarse solo en la semana abierta**, lo que quita su paso. Lo completado en una semana cerrada se queda.
4. **El lugar nuevo se decide únicamente al cerrar la semana** (lunes 00:00 a domingo 23:59, hora local; se calcula por calendario, no sumando 168 horas, para que el cambio de hora no la desplace).

## 3. Cuándo una semana da un lugar

Una semana está **completa** si:

- tuvo **al menos un paso**, y
- al cerrarse no quedaba ninguna tarea **pendiente con fecha hasta el domingo**.

No cuentan: tareas sin fecha o con fecha futura, descartadas, ni creadas después de que la semana terminó. Es un sí o un no, nunca un porcentaje. Una semana sin pasos no se gana aunque no haya pendientes. Cada semana da **un lugar una sola vez** y lo ganado nunca se revierte.

El domingo, si la semana en curso ya está completa, el cierre puede aparecer ese mismo día; si está a medias, espera al lunes.

## 4. Cierre de semana

Al abrir la app tras una o más semanas cerradas aparece **un solo resumen** con los pasos ganados, el lugar nuevo (si lo hubo) y las tareas vencidas que pasan a la semana abierta. El usuario elige:

- **«Pasar todo»:** las tareas siguen como están.
- **«Ajustar una por una»:** para cada una, **mover la fecha** o marcarla **«ya no aplica»**.

Salir sin elegir equivale a «Pasar todo»: nada cambia. Si pasaron varias semanas sin abrir la app, cada semana completa gana su lugar. No hay racha de días ni umbrales por total de tareas.

## 5. Principios

- **Nunca castiga atrasos:** el progreso no se pierde y los textos del cierre no usan lenguaje de culpa (hay una prueba que lo verifica).
- Sin notificaciones ni tareas en segundo plano para el cierre: se calcula al abrir la app.
- Si el reloj retrocede, no se reevalúan semanas ya reconocidas.

## 6. Cobertura de pruebas

| Comportamiento | Prueba (`tests/progress.test.ts` salvo indicación) |
| --- | --- |
| Agregar tareas no da pasos | «1» |
| Frontera domingo 23:59:59 / lunes 00:00 | «2»; `weeks.test.ts` |
| Completar hoy una tarea con fecha lejana suma a esta semana | «3» |
| Una semana cerrada no se reabre | «4» |
| Descartar nunca reduce pasos | «5» |
| Desmarcar solo en la semana abierta | «6» |
| Varias semanas sin abrir: un resumen | «7» |
| Semana con 0 pasos: sin logros | «8» |
| Cerrar sin elegir no toca tareas | «9» |
| Mover fecha / ya no aplica | «10» |
| Semana completa y lugar ganado una sola vez | «semana completa…», «al cerrar…», «una semana ya ganada…» |
| Lenguaje sin culpa | «RNF-01» |
| Cierre el domingo | «el domingo…» |
| Cambio de hora y año | `weeks.test.ts` |

## 7. Por confirmar

| Tema | Quién |
| --- | --- |
| Ratificar la regla de «semana completa» (interpretación de Andrea) | Equipo |
| Si cinco semanas bastan para la demo final o se necesitan más escenarios (O07) | Equipo |
| Que el progreso real use los mismos lugares en la versión desplegada | Carlos / Esteban (QA) |
