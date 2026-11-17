# Lógica de priorización

| | |
| --- | --- |
| **Tarea** | Fila 21 del cronograma: implementar lógica de priorización |
| **Responsable** | Carlos Sánchez |
| **Código** | [`src/services/planning/priority.ts`](../src/services/planning/priority.ts) |
| **Pruebas** | [`tests/priority.test.ts`](../tests/priority.test.ts): 12 escenarios más 3 pruebas de sugerencia y motivos |

Responde a la pregunta *"¿qué hago ahora?"*. Combina fecha límite, importancia, dificultad, esfuerzo y tiempo disponible con reglas fijas: los mismos datos dan siempre el mismo orden. No usa IA ni consume cuota (principio 4 de la [arquitectura](arquitectura.md)).

## Qué recibe

| Dato | De dónde sale |
| --- | --- |
| Fecha límite (opcional) | La tarea |
| Importancia: alta, media o baja | La tarea (el mismo tipo `PlanPriority` de los planes) |
| Dificultad: fácil, media o difícil | La tarea |
| Minutos que faltan | La tarea |
| Fecha programada (opcional) | El plan confirmado |
| Fecha de hoy | El dispositivo |
| Disponibilidad (opcional): días y horas por día | Lo que registró el usuario (F05) |

## Cómo ordena

**1. Holgura.** Minutos disponibles desde hoy hasta la fecha límite, ambos días incluidos, menos los minutos que faltan. Solo cuentan los días que el usuario marcó como disponibles. Si no registró disponibilidad, se calcula con 2 horas por día.

**2. Nivel de urgencia** (de más a menos urgente):

| Nivel | Cuándo | Motivo que ve el usuario |
| --- | --- | --- |
| No alcanza | La fecha límite ya pasó | *La fecha límite era el vie 30 oct. ¿La reprogramamos?* |
| | La holgura es negativa (solo con disponibilidad registrada) | *Necesitas 3 h y hasta el mié 4 nov tienes 2 h libres. ¿La ajustamos?* |
| Hoy | Vence hoy | *Vence hoy* |
| | El plan la programó para hoy o antes | *Estaba en tu plan para hoy* |
| | La holgura es menor a un día de trabajo | *Conviene empezarla hoy para llegar al mar 3 nov* |
| Pronto | La holgura es menor a 3 días de trabajo | *Vence el mié 4 nov* |
| Con tiempo | Tiene más holgura | *Tienes tiempo hasta el lun 30 nov* |
| Sin fecha | No tiene fecha límite ni está programada | *Sin fecha límite* |

**3. Desempate dentro del mismo nivel**, en este orden:

1. Importancia: alta antes que media, media antes que baja.
2. Dificultad: **la más fácil primero**, para arrancar con impulso (decisión del equipo, 2 de noviembre de 2026).
3. Menor holgura.
4. Identificador de la tarea, para que el orden no dependa del orden de entrada.

## Qué devuelve

- **La lista ordenada,** con el nivel, el motivo y la holgura de cada tarea.
- **La sugerencia de Pandoro para ahora:** la primera de la lista, o ninguna si no hay pendientes.
- **Avisos de tiempo:** las tareas cuyo tiempo disponible no alcanza, con los minutos necesarios y los disponibles. Solo se generan con disponibilidad registrada; sin ella, el aviso sería inventado.

Los motivos se devuelven como códigos y `describeReason` los convierte en texto. Los textos sugieren, no regañan, y presentan el orden como una sugerencia que el usuario puede cambiar (marco normativo, Constitución art. 20).

## Decisiones tomadas en la implementación

- **2 horas por día** como capacidad cuando no hay disponibilidad registrada.
- **3 días de trabajo** como umbral del nivel "pronto".
- Un día que el usuario no marcó como disponible no cuenta como tiempo, aunque sea hoy.
- Lo que el plan programó para un día pasado y sigue pendiente sube al nivel "hoy", sin tono de reproche.

Las cuatro se ajustan cambiando una constante o una regla, y cada una tiene su prueba.

## Conexión con la vista «Ahora»

Desde el 13 de noviembre de 2026, la vista «Ahora» de Tareas usa esta lógica a través de [`src/services/tasks/nowOrder.ts`](../src/services/tasks/nowOrder.ts) (pruebas en [`tests/nowOrder.test.ts`](../tests/nowOrder.test.ts)). Reemplaza la fórmula provisional del prototipo (`sortTasksForNow`), que se retiró.

- **Tarea de un plan** (id `plan-…`): `deadline` es la fecha límite de su actividad y `dueDate` el día en que el plan la programó.
- **Tarea creada a mano:** su fecha (`dueDate`) hace de fecha límite.
- **Importancia:** la del plan (`importance`); sin ella, media.
- **Minutos que faltan:** la duración escrita (`duration`); si no se entiende, 30 minutos.
- **Disponibilidad:** todavía no se guarda (modelo de datos, F05), así que se usan las 2 horas por día por defecto y no hay avisos de tiempo.
- **Desempate final:** antes del identificador, la posición que ya tenía la tarea en la lista (`priority`), para respetar el orden del plan.
- La primera pendiente se marca como **«Sugerencia de Pandoro»** con su motivo (`describeReason`). Las completadas van al final.

Los dos campos nuevos de la tarea (`deadline` e `importance`) están en el [modelo de datos](modelo-de-datos.md#22-tarea--usersuidtaskstaskid-taskitem). Las tareas guardadas antes de este cambio no los traen y se ordenan con importancia media y sin fecha límite propia.
