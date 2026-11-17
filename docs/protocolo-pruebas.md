# Protocolo de pruebas con usuarios

| | |
| --- | --- |
| **Tarea** | Fila 35 del cronograma: preparar protocolo de prueba con usuarios |
| **Responsable** | Andrea Sosa (la ejecución es la fila 36, Esteban; el análisis, la 37) |
| **Se prueba** | La versión **desplegada** (fila 31), no el entorno de desarrollo |

Objetivo: comprobar si Pandask **reduce el esfuerzo de organizarse** y si baja la sensación de presión. Meta del proyecto: que al menos el **60 %** de los participantes reporte menos estrés. Mínimo exigido: **5 participantes**, con resultados comparables.

## 1. Participantes

- 5 a 8 personas que sean estudiantes o trabajen, mayores de edad, que no hayan visto la app antes y que **no** pertenezcan al equipo.
- Una sesión individual de unos 30 minutos, presencial o por videollamada con pantalla compartida, en celular (Android) o en la web.
- Cada persona se identifica como **P1, P2…**; no se guardan nombres junto a las respuestas.

## 2. Consentimiento y cuidado

Antes de empezar, el moderador lee y la persona acepta (sin marcar de antemano) una hoja **propia de la sesión**, distinta de la autorización de la app:

- Qué se evalúa: la app, no a la persona; puede parar cuando quiera.
- Qué se registra: tiempos, observaciones, respuestas a los cuestionarios y, solo con permiso, la grabación de pantalla.
- Que las respuestas sobre estrés son anónimas, sirven para evaluar el proyecto y no son un diagnóstico.
- Que se deben usar **tareas ficticias** y no escribir datos de terceros ni propios sensibles; Pandask envía el texto a Gemini (ver [`privacidad.md`](privacidad.md)).
- Se pide la autorización de la app como cualquier usuario real; el moderador no la marca por la persona.
- Cuenta de prueba por participante, que se elimina al terminar la sesión.

Los cuestionarios de estrés se responden **fuera de la app** (formulario aparte).

## 3. Preparación

- App desplegada, con acceso, autenticación, persistencia y agente verificados.
- Cuentas de prueba sin datos previos; disponibilidad **sin preseleccionar**.
- Cronómetro, hoja de observación (§7), formularios previo y posterior, y copia de los enunciados.
- Anotar dispositivo, navegador o versión y si la IA estuvo disponible (cuota).
- Si el registro de eventos de la fila 32 funciona, anotar el identificador de cada cuenta de prueba para cruzar los tiempos automáticos. **Por confirmar con Esteban.** Si no, solo se mide con cronómetro.

## 4. Guion del moderador

1. **Bienvenida (2 min).** «Estamos probando una app que ayuda a organizar pendientes. Si algo no se entiende, es culpa de la app, no tuya. Piensa en voz alta».
2. **Consentimiento (2 min)** y permiso de grabación.
3. **Cuestionario previo (2 min):** estrés frente a sus pendientes actuales (§6) y cómo se organiza hoy.
4. **Tareas T1–T4 (15 min).** Se lee cada enunciado sin explicar cómo hacerlo. El moderador solo observa. Si la persona lleva **más de 2 minutos bloqueada**, da una pista y se anota como **ayuda**.
5. **Cuestionario posterior (5 min):** §6, tras cada tarea y al final.
6. **Cierre (2 min):** qué fue lo mejor, qué cambiaría, algo que le generó presión. Agradecer.

## 5. Tareas

Todas con material ficticio. Se prueban en este orden.

| Tarea | Enunciado para el participante | Éxito |
| --- | --- | --- |
| **T1. Una responsabilidad** | «Tienes que entregar un ensayo de 10 páginas el viernes. Usa Pandask para organizarte esa semana» | Obtiene un plan con subtareas, lo revisa y lo confirma |
| **T2. Varias a la vez, una ambigua** | «Cuéntale a Pandoro estas tres cosas: preparar una exposición, estudiar para un parcial el próximo lunes, y *cosas de la casa*» | Pandoro entiende las dos claras y pide aclaración de la tercera; la persona responde |
| **T3. Corregir** | «El plan te parece muy cargado un día. Cámbialo: ajusta una duración a mano y pídele a Pandoro por escrito que mueva algo» | Hace un cambio manual y uno por instrucción, y el resultado es el esperado |
| **T4. Hacer y ver el avance** | «Marca una actividad como hecha y mira cómo avanza tu progreso. Dime cuál crees que es la siguiente que debes hacer» | Completa una tarea, ve el progreso y nombra la sugerencia de Pandoro |

Variante de entrada: la mitad de los participantes usa **voz** en T1 y los demás texto, si la voz está disponible en su dispositivo.

## 6. Métricas

| Métrica | Cómo se mide | Instrumento | Cuándo |
| --- | --- | --- | --- |
| **Tiempo de organización** | Segundos desde que la persona empieza a escribir o hablar hasta confirmar el plan (T1, T2). Referencia: tiempo que dice que le toma hoy | Cronómetro del moderador (o eventos de la fila 32) | Por tarea |
| **Número de pasos** | Toques/acciones desde el inicio hasta la confirmación, frente al camino mínimo (se fija en un ensayo previo del equipo) | Conteo en observación o grabación | T1–T4 |
| **Claridad** | «El plan que propuso Pandoro fue claro» (1 = nada claro, 5 = muy claro) | Escala 1–5 | Tras T1, T2 y T3 |
| **Facilidad** | «Qué tan fácil fue esta tarea» (1 = muy difícil, 7 = muy fácil), SEQ | Escala 1–7 | Tras cada tarea |
| **Calidad de priorización** | «El orden que sugirió Pandoro tiene sentido» (1–5) y «¿Pondrías esto primero?» (sí/no/otra) | Escala + pregunta | Tras T3 y T4 |
| **Presión / estrés** | Estrés frente a sus pendientes **antes** y **después** (1 = ninguno, 5 = muchísimo); «Pandoro y los avisos me hicieron sentir presión» (1–5) | Formulario aparte, anónimo | Previo y posterior |
| **Calidad del agente** | Aclaraciones pedidas, ediciones al plan, respuestas inválidas o errores, cuántas subtareas se editaron o borraron | Hoja de observación | T1–T3 |
| **Éxito y ayuda** | Éxito/fracaso de cada tarea y pistas dadas | Hoja de observación | T1–T4 |

**Reducción de estrés (meta del 60 %):** cuenta como reducción cuando la calificación posterior es **menor** que la previa. Porcentaje = personas con reducción ÷ participantes. Con 5 personas, 3 cumplen el 60 %.

**Tiempo y pasos** no se interpretan como promedios fiables con tan pocos casos: se reportan por persona y con mediana, y se comparan con la referencia de cada participante.

## 7. Hoja de observación (una por participante)

| Campo | Registro |
| --- | --- |
| Participante (P#), fecha, moderador | |
| Dispositivo / navegador | |
| ¿IA disponible? ¿Voz usada? | |
| Estrés previo (1–5) | |
| **T1**: tiempo, pasos, éxito (S/N), ayuda (S/N), claridad (1–5), facilidad (1–7) | |
| **T2**: ídem + ¿entendió la aclaración? | |
| **T3**: ídem + calidad de priorización (1–5) | |
| **T4**: ídem + siguiente tarea nombrada | |
| Errores o respuestas inválidas del agente | |
| Ediciones al plan (cuántas y qué) | |
| Citas textuales relevantes | |
| Estrés posterior (1–5); presión por avisos (1–5) | |
| Qué cambiaría | |

## 8. Consolidación (fila 36) y análisis (fila 37)

Tabla comparable, una fila por participante y una columna por métrica de §6, más el total de reducción de estrés. Los hallazgos de la fila 37 se clasifican así:

| Nivel | Criterio |
| --- | --- |
| **Crítico** | Impide completar T1 a una persona, pierde datos, o muestra algo como dato exacto en vez de sugerencia |
| **Importante** | Lo sufren 2 o más participantes, o hace que la persona pida ayuda |
| **Opcional** | Mejora de comodidad o gusto personal |

Cada hallazgo lleva evidencia (participante, cita o dato) y una decisión explícita: corregir, posponer o descartar.

## 9. Por confirmar

| Tema | Quién |
| --- | --- |
| Camino mínimo de toques por tarea (ensayo previo del equipo) | Esteban |
| Si el registro de eventos y tiempos de la fila 32 estará listo; si no, solo cronómetro | Esteban |
| Hoja de consentimiento de la sesión y formularios en la herramienta que use el equipo | Andrea, Esteban |
| Revisión legal de lo que se pregunta sobre estrés | Equipo |
