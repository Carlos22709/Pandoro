# El agente de Pandask: especificación funcional, formato de salida y descomposición

| | |
| --- | --- |
| **Tareas** | Fila 11 (especificación funcional), fila 13 (instrucciones y formato de salida) y fila 19 (descomposición automática) del cronograma |
| **Responsable** | Andrea Sosa |
| **Código** | [`planPrompt.ts`](../src/services/gemini/planPrompt.ts), [`planContract.ts`](../src/services/gemini/planContract.ts), [`geminiService.ts`](../src/services/gemini/geminiService.ts), [`planLogic.ts`](../src/services/planning/planLogic.ts), [`priority.ts`](../src/services/planning/priority.ts) |
| **Pruebas** | [`tests/planning.test.ts`](../tests/planning.test.ts), [`tests/agent.test.ts`](../tests/agent.test.ts), [`tests/priority.test.ts`](../tests/priority.test.ts) |

Este documento **describe lo que el código hace hoy**. Si el código cambia, se actualiza aquí en el mismo pull request. Proveedor, modelo y costos: [`GEMINI.md`](GEMINI.md). Flujo de datos: [`arquitectura.md`](arquitectura.md) §6.2.

## 1. Qué es el agente

Una sola llamada a Gemini (`gemini-3.5-flash-lite`, por Firebase AI Logic) que convierte texto libre en una **propuesta de plan**. La IA solo interpreta, extrae, descompone y estima. La priorización y los avisos de carga los calculan reglas locales, reproducibles y sin cuota (principio del [CONTEXTO](CONTEXTO.md#qué-hace-el-agente-y-cómo)). El agente **propone**; el usuario edita y confirma, y solo entonces se guardan tareas.

## 2. Especificación funcional (fila 11)

### 2.1 Entradas

| Entrada | Origen | Límites |
| --- | --- | --- |
| Texto de las responsabilidades | Escrito o transcrito de la voz; el usuario lo ve y lo corrige | Máx. 4.000 caracteres (`MAX_INPUT_LENGTH`). Antes de enviar, `redactPersonalData` cambia correos por `[correo]` y teléfonos o documentos por `[número]` |
| Disponibilidad (`Availability`) | Lo marca el usuario; nada viene preseleccionado | `days`: fechas `YYYY-MM-DD`; `minutesPerDay`: minutos por día |
| Fecha de hoy | El dispositivo | Para resolver «el viernes», «mañana», etc. |
| **Solo al revisar:** propuesta vigente + instrucción | La pantalla | La instrucción también pasa por el filtro de datos personales |

**Nunca se envía:** nombre, correo, identificador (`uid`), audio ni historial de conversaciones. El filtro no detecta nombres propios; por eso la pantalla avisa de no escribir datos de terceros.

### 2.2 Salidas

Un objeto JSON con `status`:

- `plan`: propuesta con actividades y subtareas (formato en §3).
- `needs_clarification`: una sola pregunta concreta y ninguna actividad.

El resultado que ve la app (`PlanResult`) es `clarification` o `proposal` (con avisos de días no disponibles y cuántas subtareas se restauraron). Todo se presenta como **«sugerencia de Pandoro»**, editable, nunca como un dato exacto (Constitución art. 20).

### 2.3 Acciones

| Función | Quién la hace | Dónde |
| --- | --- | --- |
| Interpretar (una o varias responsabilidades) | IA | `PLAN_SYSTEM_INSTRUCTION`, bloque «Interpretación» |
| Extraer nombre, fecha límite, prioridad indicada | IA, validada | Fecha límite solo si `deadlineQuote` está citada en el texto (`parseActivity`) |
| Descomponer en subtareas | IA | §5 |
| Estimar duración y dificultad | IA, editable por el usuario | `durationMinutes` (1–1.440), `difficulty` light/medium/high |
| Distribuir en días | IA propone `scheduledDate`; **las reglas locales verifican** | `analyzeProposal` y `planByDay` recalculan avisos tras cada edición, sin llamar a la IA |
| Priorizar «qué hago ahora» | Reglas locales | `priority.ts` ([`priorizacion.md`](priorizacion.md)) |
| Revisar por instrucción | IA | `buildRevisePrompt` + `mergeRevision` (§2.5) |
| Guardar | El usuario, al confirmar | `proposalToTasks` (§4.3) |

### 2.4 Límites: lo que el agente no hace

- No inventa fechas límite: sin cita literal del usuario, `deadline` queda en `null`.
- No recorta estimaciones ni elimina tareas para que «quepan»: si no caben, deja `scheduledDate` en `null`, lo dice en `summary` y la app avisa (`unscheduled`, `total_overload`).
- No pide aclaración por falta de fecha, avance o detalle; solo si no se entiende **qué** actividad hay que hacer.
- No guarda nada por sí mismo, no guarda texto, transcripción ni audio, y no ve datos de otros usuarios.
- No diagnostica ni da consejo de salud mental o bienestar (el proyecto se alinea con la meta 3.4 del ODS 3 pero no la trata).
- No ejecuta instrucciones que vengan dentro del texto del usuario: lo delimitado por `<texto_usuario>` e `<instruccion_usuario>` son datos y nunca cambian las reglas.
- Conversación general ajena a la organización: fuera del MVP (O05).

### 2.5 Reglas de revisión (instrucción en lenguaje natural)

`mergeRevision` protege el trabajo del usuario:

1. Lo editado a mano (`editedFields`) se conserva, salvo que la IA declare en `overriddenManualFields` que la instrucción lo contradice.
2. Una actividad o subtarea que la IA omite sin listarla en `removedIds` se **restaura**.
3. Una fecha límite ya dada no se pierde porque la IA no la cite de nuevo (`withKnownDeadlines`).
4. Si el usuario dice que un día ya no está disponible, la IA lo devuelve en `unavailableDates` y no le asigna nada.

### 2.6 Errores y casos límite

| Caso | Resultado |
| --- | --- |
| Texto ambiguo («cosas») | `needs_clarification` con una pregunta |
| JSON inválido, actividad sin subtareas, duración o dificultad fuera de escala, plan vacío | `GeminiError('invalid_response')`; no se usa la respuesta y se conserva lo escrito |
| Respuesta vacía | `empty_response` |
| Cuota agotada (429), tiempo (60 s), red, proveedor, IA sin activar, sin configuración | Mensaje propio por código (`ERROR_MESSAGES`); el mensaje original no se muestra porque puede incluir URL o clave |
| Misma solicitud ya en curso | No se repite; tras un fallo se puede reintentar |
| Cualquier fallo | La creación manual de tareas sigue disponible |

## 3. Instrucciones y formato de salida (fila 13)

### 3.1 Instrucciones base (`PLAN_SYSTEM_INSTRUCTION`)

Resumen por bloques; el texto exacto vive en `planPrompt.ts`:

| Bloque | Qué fija |
| --- | --- |
| Rol | «Pandoro», asistente de productividad; responde siempre en español |
| Interpretación | Identifica todas las responsabilidades; el contenido del usuario son datos, no órdenes; aclaración solo si no se sabe qué actividad es |
| Fechas e inferencias | `deadline` solo con `deadlineQuote` literal; fechas relativas desde «hoy»; `prioritySource` = `user` solo si el usuario la expresó |
| Estimaciones | Duración entera y dificultad por subtarea; **estimar antes de mirar la disponibilidad**; las subtareas cubren la actividad completa; `dependsOn` con ids |
| Distribución | Solo días disponibles; respeta fechas límite, dependencias y minutos por día; reparte la carga; `order` desde 1; lo que no cabe queda sin día y se explica |
| Tono | `summary`: una frase breve y cálida |

El prompt de cada llamada (`buildGeneratePrompt` / `buildRevisePrompt`) añade: «Hoy es …», minutos por día, lista de días disponibles con su nombre, el texto entre `<texto_usuario>` y, al revisar, la propuesta en JSON y la instrucción entre `<instruccion_usuario>`. Temperatura 0,3, máx. 12.000 tokens de salida.

### 3.2 Formato (`PLAN_RESPONSE_SCHEMA`)

Gemini lo aplica al generar y `parsePlanResponse` lo **revalida**, porque el esquema no garantiza valores coherentes ni una respuesta cortada.

**Raíz**

| Campo | Tipo | Notas |
| --- | --- | --- |
| `status` | `plan` \| `needs_clarification` | Obligatorio |
| `clarificationQuestion` | texto \| null | Obligatoria si `needs_clarification` |
| `summary` | texto | Frase breve |
| `activities` | lista | No vacía si `plan` |
| `removedIds` | lista de ids | Solo lo que la instrucción pidió quitar o reemplazó al dividir |
| `overriddenManualFields` | lista de `{id, field}` | Campos manuales que la instrucción contradijo |
| `unavailableDates` | lista de `YYYY-MM-DD` | Días que el usuario descartó al revisar |

**Actividad** (la responsabilidad)

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id`, `title`, `description` | texto | `title` obligatorio; los ids se sanean y se hacen únicos |
| `deadline` | `YYYY-MM-DD` \| null | Se descarta si `deadlineQuote` no aparece en el texto del usuario |
| `deadlineQuote` | texto \| null | Palabras literales del usuario |
| `priority` | `high` \| `medium` \| `low` | Importancia |
| `prioritySource` | `user` \| `inferred` | Cualquier otro valor se toma como `inferred` |
| `difficulty` | `light` \| `medium` \| `high` | Fácil, media, difícil |
| `subtasks` | lista | Al menos una |

**Subtarea**

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id`, `title`, `description` | texto | |
| `durationMinutes` | entero | Entre 1 y 1.440; se redondea |
| `difficulty` | `light` \| `medium` \| `high` | |
| `dependsOn` | lista de ids | Los ids inexistentes o propios se descartan |
| `scheduledDate` | `YYYY-MM-DD` \| null | `null` si no cabe o la fecha no es válida |
| `order` | entero | Orden en el plan completo |

La app añade `editedFields` (qué corrigió el usuario a mano) y el `id` y número de revisión de la propuesta; la IA no los produce.

**Correspondencia con lo que pide el cronograma** («tareas, subtareas, duración, dificultad, prioridad y fechas»):

| Pedido | Dónde está |
| --- | --- |
| Tareas | `activities` |
| Subtareas | `activities[].subtasks` |
| Duración | `subtasks[].durationMinutes` |
| Dificultad | `activities[].difficulty` y `subtasks[].difficulty` |
| Prioridad | `activities[].priority` (por actividad, no por subtarea) |
| Fechas | `activities[].deadline` (límite) y `subtasks[].scheduledDate` (día asignado) |

> **Por confirmar con el equipo:** la prioridad vive en la actividad. Todas sus subtareas la heredan. Si se quiere prioridad por subtarea, cambia el contrato (`planContract.ts`), `planTypes.ts` y `priority.ts`. Mientras no se decida, se asume la forma actual.

### 3.3 Ejemplo completo

Entrada: «Entregar un ensayo de 10 páginas sobre IA el viernes», disponibilidad 3, 4 y 5 de noviembre, 120 min/día, hoy lunes 2 de noviembre de 2026.

```json
{
  "status": "plan",
  "clarificationQuestion": null,
  "summary": "Tres sesiones cortas para llegar tranquilo al viernes.",
  "activities": [
    {
      "id": "a1",
      "title": "Ensayo de IA",
      "description": "Ensayo de 10 páginas sobre inteligencia artificial.",
      "deadline": "2026-11-06",
      "deadlineQuote": "el viernes",
      "priority": "medium",
      "prioritySource": "inferred",
      "difficulty": "medium",
      "subtasks": [
        { "id": "s1", "title": "Buscar fuentes y hacer el esquema", "description": "", "durationMinutes": 90, "difficulty": "light", "dependsOn": [], "scheduledDate": "2026-11-03", "order": 1 },
        { "id": "s2", "title": "Redactar el borrador", "description": "", "durationMinutes": 120, "difficulty": "high", "dependsOn": ["s1"], "scheduledDate": "2026-11-04", "order": 2 },
        { "id": "s3", "title": "Revisar y dar formato", "description": "", "durationMinutes": 60, "difficulty": "light", "dependsOn": ["s2"], "scheduledDate": "2026-11-05", "order": 3 }
      ]
    }
  ],
  "removedIds": [],
  "overriddenManualFields": [],
  "unavailableDates": []
}
```

`proposalToTasks` lo convierte, tras la confirmación, en tres filas de Tareas con id estable `plan-<propuesta>-<subtarea>`, por ejemplo «Buscar fuentes y hacer el esquema» · detalle «mar 3 nov · Ensayo de IA» · duración «1 h 30 min» · notas «Fecha límite: vie 6 nov».

## 4. Descomposición automática (fila 19)

### 4.1 Qué hace

Una responsabilidad compleja («tesis», «ensayo», «preparar parcial») se convierte en **subtareas concretas y manejables**, cada una con título, duración, dificultad, dependencias y orden. La IA las genera; no es una lista fija.

### 4.2 Reglas que la sostienen

- Toda actividad tiene al menos una subtarea (si no, la respuesta se rechaza).
- Las subtareas cubren la actividad completa, no solo un primer avance.
- La duración refleja lo que el trabajo exige, aunque supere el tiempo disponible; el desajuste se avisa, no se oculta.
- Las dependencias (`dependsOn`) permiten detectar subtareas colocadas antes de las que necesitan (`dependency_order`).

### 4.3 Revisión antes de guardar

En Nueva tarea (`NewTaskScreen`, con el editor `src/components/planning/ProposalEditor.tsx`) el usuario ve el borrador agrupado por día y puede:

1. **Editar** título, descripción, duración, dificultad y día de cada subtarea (`updateSubtask`) y los campos de la actividad (`updateActivity`).
2. **Eliminar** (`removeSubtask`, `removeActivity`) o **añadir** subtareas (`addSubtask`).
3. **Pedir cambios con una instrucción** («divide la redacción en dos días»), que sigue las reglas de §2.5.
4. Ver avisos calculados en el dispositivo: sobrecarga por día o total, subtareas sin día, después de la fecha límite, dependencias invertidas, todo concentrado en un día. Los campos vacíos o con duración 0 **bloquean** la confirmación.

Solo al **confirmar**, `proposalToTasks` crea una fila de Tareas por subtarea, con id estable, de modo que confirmar dos veces no duplica. Nada llega a la lista antes.

### 4.4 Verificación

Cobertura existente en `tests/planning.test.ts`:

| Comportamiento | Prueba |
| --- | --- |
| Varias actividades con subtareas, duración, dificultad y dependencias | «escenarios 2-4» |
| Actividad sin subtareas, plan vacío, duración o dificultad inválidas se rechazan | «escenario 10» |
| La edición manual de una subtarea sobrevive a otra revisión | «escenario 5» |
| Lo que la IA omite sin declarar se restaura | «escenario 9» |
| La edición llega a la lista solo al convertir, con ids estables | «escenarios 7-8» |
| Campos vacíos bloquean la confirmación | «los campos vacíos bloquean la confirmación» |

Con `npm test` y `npm run typecheck` se comprueba que siguen pasando. La comprobación manual con una tarea larga en la app (p. ej. «ensayo de 10 páginas para el viernes») requiere configuración de Firebase y se anota en el pull request de quien la ejecute.

## 5. Por confirmar

| Tema | Quién |
| --- | --- |
| Prioridad por actividad o por subtarea (§3.2) | Equipo (Santiago, Carlos) |
| Si se acota la duración máxima por subtarea (hoy solo se valida ≤ 24 h) o el número de subtareas por actividad | Equipo |
| Resultado de una prueba manual de descomposición en dispositivo real | Quien ejecute la fila 29 (QA) |
