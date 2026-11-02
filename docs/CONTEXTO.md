# Contexto de Pandask

Resumen de lo que el equipo ha definido hasta el **2 de noviembre de 2026**. Fuentes: el informe de la Entrega 2 (ideación, selección del concepto y modelado del prototipo), el documento «Avances Proyecto Pandask» y el cronograma del equipo (Excel). Si algo aquí deja de ser cierto, se actualiza en el mismo pull request que lo cambia.

## Producto

Pandask es una app móvil que reduce el esfuerzo de organizarse. Combina un asistente conversacional (texto y voz), una mascota que acompaña (Pandoro, un panda) y un progreso gamificado que nunca castiga los atrasos.

**Para quién:** estudiantes y trabajadores que deben cumplir plazos de entrega académicos o laborales.

**Problema:** las personas acumulan y posponen responsabilidades porque no dimensionan su carga, en parte porque sus pendientes están dispersos. Aun así evitan organizarse, porque planificar exige tiempo y esfuerzo mental, y cuando ya están saturadas eso se siente como "perder tiempo". En la encuesta (31 personas de la Universidad de La Sabana, más seis entrevistas), el 67,7 % reportó distracciones frecuentes al estudiar o trabajar.

**Punto de vista:** no se trata de construir otro gestor de tareas, sino uno que **reduzca** el esfuerzo de organizarse en lugar de sumarle carga.

**Diferenciador:** la planificación asistida. Pandask convierte responsabilidades generales en un plan concreto mediante cuatro operaciones:

1. **Estimación del esfuerzo:** cuánto tiempo toma cada responsabilidad.
2. **Descomposición:** dividir lo complejo en actividades pequeñas.
3. **Distribución temporal:** repartir las actividades en los días disponibles sin acumularlas.
4. **Priorización:** ordenar según dificultad, importancia, esfuerzo y cercanía de la fecha límite.

El usuario revisa y confirma el plan antes de que pase a su lista de tareas. Al completar tareas acumula progreso y desbloquea lugares del mundo de Pandoro, que luego puede usar como fondo de la pantalla de inicio. El progreso no se pierde por atrasos.

**Objetivo medible:** que al menos el 60 % de los usuarios de prueba reporte una disminución de su estrés. El proyecto se alinea con la meta 3.4 del ODS 3 (salud mental y bienestar), pero **no** diagnostica ni trata problemas de salud mental.

### Necesidades de los usuarios

- Controlar las tareas sin que la herramienta se vuelva otra fuente de pendientes o de estrés.
- Comprender el tiempo disponible frente a las responsabilidades.
- Interactuar de forma rápida y poco intrusiva, sin abandonar lo que se está haciendo.
- Recibir retroalimentación interactiva, no un indicador plano.
- Reducir la presión de las fechas límite.
- Saber qué priorizar sin invertir mucho tiempo en organizarlo.
- Recibir seguimiento sin sentir que la herramienta presiona.

## Restricciones

- **Económica:** costo cero de herramientas e infraestructura durante el MVP; solo cuotas gratuitas, sin activar facturación. Si se comercializa, precio final menor a $20.000 COP.
- **Técnica:** portable o de fácil acceso, de baja complejidad de uso, hecho por cuatro estudiantes en máximo tres meses.
- **Humana:** interferir lo menos posible con el trabajo del usuario; las notificaciones no deben generar presión.
- **Normativa:** cumplir la regulación colombiana de protección de datos personales. La información sobre estrés, hábitos o bienestar puede ser sensible. Detalle en [Marco normativo](#marco-normativo).
- **Alcance:** llega hasta un MVP funcional, no a un producto comercial pulido.

## Marco normativo

Fuente: ficha técnica del equipo (Sección A, normas; Sección B, decisiones condicionadas). En el tratamiento de datos, el equipo actúa como **Responsable** y Firebase como **Encargado**.

### Normas

| Norma | Emite | Qué implica para Pandask |
| --- | --- | --- |
| [Ley 1581 de 2012](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981) | Congreso de la República | La app recolecta y guarda datos personales (cuenta, tareas, perfil y progreso). Exige autorización previa, expresa e informada al ingresar, una política de tratamiento de datos publicada y garantizar los derechos de acceso, rectificación y supresión. |
| [Circular Externa SIC 002 de 2024](https://sedeelectronica.sic.gov.co/sites/default/files/normativa/Circular%20Externa%20No.%20002%20del%2021%20de%20agosto%20de%202024.pdf), datos personales en sistemas de IA | Superintendencia de Industria y Comercio | El asistente usa solo lo estrictamente necesario para armar el plan (tarea, fecha, duración y dificultad). No se guardan audios ni conversaciones completas. Antes de enviar algo al modelo se quitan los datos personales que no se necesitan. El usuario confirma el plan antes de guardarlo. |
| [Decreto 1074 de 2015](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=76608), Título 2, Capítulo 25 | Presidencia y Ministerio de Comercio, Industria y Turismo | En el registro, antes de crear la cuenta: aviso de privacidad corto (qué datos y para qué) y autorización con una casilla que **no** venga marcada. Cualquier dato de estrés o bienestar va en una autorización aparte y opcional; la app funciona completa sin ella. |
| [Constitución Política, arts. 15 y 20](https://www.secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991.html) | Asamblea Nacional Constituyente | Art. 15: en Perfil el usuario ve todos sus datos, los edita y puede borrar su cuenta con todo su historial. Art. 20: los planes y estimaciones del asistente se muestran siempre como **"sugerencias de Pandoro"**, corregibles antes de aceptarlas, nunca como información exacta o definitiva. |

### Decisiones del MVP condicionadas por normas

1. **Pedir autorización antes de recoger datos.** Aviso breve antes del registro con los datos, su finalidad y un enlace a la política completa. Casilla sin marcar. Se guarda constancia de la aceptación y de la versión del aviso. Seguir usando la app no cuenta como aceptación. *Ley 1581, arts. 9 y 12; Decreto 1074, arts. 2.2.2.25.2.2, 2.2.2.25.2.4 y 2.2.2.25.2.5.*
2. **Datos de estrés y bienestar opcionales.** No se piden en el registro. Si se prueba una función para reportar estrés, se explica su finalidad y se pide una autorización explícita y aparte. Si el usuario no acepta, solo se desactiva esa función. *Ley 1581, arts. 5 y 6; Decreto 1074, art. 2.2.2.25.2.3.*
3. **Limitar lo que se envía a la IA y conservar el control del plan.** El asistente recibe solo lo necesario para interpretar las responsabilidades. Antes de enviar se reducen los datos identificables. Se conservan las tareas y los planes aprobados, no audios ni conversaciones completas. Antes del piloto se revisa qué conserva el proveedor de IA y de voz; si no se puede asegurar un tratamiento adecuado, esa integración no se habilita. El usuario revisa y corrige la propuesta antes de guardarla. *Circular SIC 002 de 2024; Ley 1581, art. 4.*
4. **Controles sobre los datos desde la primera versión.** En Perfil: consultar y corregir la información personal, solicitar su eliminación y revocar la autorización, explicando qué se elimina y qué se conserva por razones legales. Cada usuario accede solo a sus registros. Antes del piloto se comprueba con dos cuentas que una no pueda leer ni modificar los datos de la otra, y se verifican con el proveedor la eliminación y sus plazos. *Ley 1581, arts. 4 y 8; Decreto 1074, art. 2.2.2.25.2.6.*

### Puntos abiertos

Detectados al cruzar estas decisiones con la arquitectura. Los decide el equipo, con Andrea como responsable de la fila 34.

- **Gemini en nivel gratuito frente a la decisión 3.** Google indica que usa el contenido enviado en el nivel gratuito para mejorar sus productos, así que no actúa solo como Encargado. El nivel de pago exige vincular facturación. Propuesta: una autorización aparte y opcional para usar el asistente; sin ella, Pandask funciona completa en modo manual.
- **Voz.** En la web, Chrome envía el audio a Google para transcribirlo; en Android puede pasar lo mismo si el teléfono no transcribe en el dispositivo. Pandask no guarda audios, pero el proveedor sí lo procesa. Propuesta: en Android, transcribir en el dispositivo cuando el teléfono lo permita; en la web, incluir la voz en la autorización opcional o desactivarla.
- **Constancia del consentimiento al eliminar la cuenta.** Borrar todos los datos del usuario borra también la constancia que exige la decisión 1. Hay que decidir si se conserva un registro mínimo (fechas de autorización y de eliminación) y por cuánto tiempo.
- **Transmisión internacional.** Firebase y Gemini procesan datos fuera de Colombia. Hay que revisar si el aviso y la política deben mencionarlo.

## Alcance del MVP

### Obligatorias (MUST-HAVE)

| ID | Funcionalidad | Alcance |
| --- | --- | --- |
| F01 | Gestión de tareas | Crear, consultar, editar, eliminar, iniciar y completar tareas, con descripción, fecha límite, importancia, dificultad y duración estimada. |
| F02 | Entrada por voz | Capturar la voz, convertirla a texto y enviarla al agente. Conservar también la entrada por texto. |
| F03 | Agente conversacional con IA | Entender responsabilidades en lenguaje natural, pedir la información indispensable que falte y proponer cómo organizarlas. |
| F04 | Descomposición | Dividir actividades complejas en subtareas con duración aproximada, dificultad y orden. |
| F05 | Disponibilidad del usuario | Registrar los días y bloques horarios disponibles para estudiar o trabajar. |
| F06 | Planificación automática | Distribuir tareas y subtareas en los horarios disponibles según fechas límite, duración y carga. |
| F07 | Priorización inteligente | Recomendar qué hacer primero según urgencia, importancia, esfuerzo y tiempo disponible. |
| F08 | Confirmación y edición de planes | Mostrar el plan propuesto, permitir modificarlo y guardar solo lo aprobado. |
| F09 | Persistencia de datos | Guardar tareas, planes, disponibilidad, ajustes y progreso, y conservarlos al cerrar la app. |
| F10 | Recordatorios configurables | Notificaciones locales sobre actividades y fechas próximas, que se pueden desactivar. |
| F11 | Mascota interactiva | Pandoro acompaña con mensajes contextuales, expresiones y reacciones sencillas al completar actividades. |
| F12 | Gamificación y progreso | Acumular progreso por tareas completadas, desbloquear escenarios y usarlos como fondo de inicio, sin penalizar atrasos. |
| F13 | Perfil y ajustes | Nombre de usuario, estadísticas básicas y ajustes funcionales de recordatorios y privacidad. |
| F14 | Protección de datos | Aviso de tratamiento de datos, solicitud de autorizaciones y opción de eliminar la información almacenada. |
| F15 | Despliegue y pruebas | Versión accesible y funcional, sin conversaciones simuladas ni datos predefinidos. |

### Opcionales (después del MVP)

| ID | Funcionalidad |
| --- | --- |
| O01 | Aprendizaje de hábitos a partir del historial del usuario. |
| O02 | Replanificación proactiva al detectar retrasos. |
| O03 | Importar responsabilidades de Google Calendar, Gmail, Teams u otras apps. |
| O04 | Sincronización entre dispositivos mediante cuenta. |
| O05 | Conversaciones generales, ajenas a la organización. |
| O06 | Estadísticas avanzadas e informes semanales. |
| O07 | Personalización avanzada: más escenarios, accesorios y animaciones. |
| O08 | Planes de suscripción, pagos y administración de suscripciones. |
| O09 | Exportar planes a calendarios externos. |
| O10 | Colaboración entre usuarios. |

## Qué hace el agente y cómo

La IA solo interpreta, extrae, descompone y estima. La distribución temporal y la priorización se calculan con reglas propias, que son reproducibles y no consumen cuota.

| Función | Qué hace | Cómo |
| --- | --- | --- |
| Interpretación | Entiende las responsabilidades que el usuario describe por voz o texto. | Convierte la voz a texto y usa un modelo de lenguaje para identificar tareas, fechas y restricciones. |
| Extracción | Identifica nombres, fechas límite, duración y condiciones especiales. | Pide al modelo una respuesta estructurada en JSON y valida sus campos. |
| Descomposición | Divide tareas generales en pasos concretos. | El modelo genera subtareas según la descripción y la complejidad. |
| Estimación del esfuerzo | Propone cuánto tarda cada actividad. | Estimaciones del modelo que el usuario puede corregir. |
| Consulta de disponibilidad | Obtiene los espacios disponibles. | Lee la disponibilidad configurada y las tareas ya programadas. |
| Distribución temporal | Ubica las subtareas en días y horarios. | Algoritmo propio: duración, fechas límite, disponibilidad y dependencias. |
| Priorización | Decide qué atender primero. | Reglas que ponderan urgencia, importancia y esfuerzo. |
| Generación del plan | Presenta un cronograma por día. | Une lo que procesó la IA con el resultado del algoritmo. |
| Ajustes y confirmación | Permite revisar el plan y pedir cambios. | Modifica la propuesta y vuelve a validar los horarios antes de guardar. |
| Recomendaciones | Indica qué tarea hacer a continuación. | Consulta el plan vigente, el estado de las tareas y las prioridades. |

## Modelo de negocio (propuesta, por validar)

Freemium. El plan gratuito permite el ciclo completo: expresar responsabilidades por voz o texto, dividirlas, organizarlas, revisar el plan, completar actividades y ver el progreso con Pandoro. El de pago amplía capacidad y personalización sin quitarle nada esencial al gratuito.

| Diferencia | Gratuito | Pago |
| --- | --- | --- |
| Capacidad de IA | Cuota mensual básica. | Cuota mayor, también limitada. Nunca ilimitada. |
| Análisis de progreso | Estadísticas básicas (F12–F13). | Informes semanales e históricos (O06). |
| Personalización visual | Mascota y escenarios desbloqueables (F11–F12). | Catálogo adicional (O07), sin penalizar al gratuito. |
| Calendario | Planificación dentro de Pandask (F05–F08). | Exportación a calendarios externos (O03/O09). |
| Sincronización | Persistencia en el dispositivo (F09). | Sincronización entre dispositivos (O04). |

- Agotar la cuota de IA no impide consultar, editar a mano ni completar tareas.
- Las cuotas se controlan en el servidor y el usuario ve su consumo antes de confirmar una operación.
- Hipótesis de precio: $14.900 COP al mes, pendiente de validar con usuarios y costos reales.
- Sin publicidad ni venta de datos personales.
- Para el MVP solo se construye el plan gratuito; pagos y suscripciones son opcionales (O08).

## Áreas y responsables

| Área | Integrantes con tareas en el área |
| --- | --- |
| 1. Estrategia | Andrea, Esteban, Carlos |
| 2. Diseño | Santiago, Andrea, Esteban |
| 3. Arquitectura | Santiago, Carlos, Andrea, Esteban |
| 4. Desarrollo | Carlos, Santiago, Andrea, Esteban |
| 5. Calidad (QA) | Carlos, Santiago |
| 6. Lanzamiento | Esteban, Carlos |
| 7. Legal y evaluación | Andrea, Esteban, Carlos, Santiago |

El responsable de cada tarea está en el cronograma.

## Cronograma

Copia del Excel del equipo, ordenada por fecha objetivo. **El estado (pendiente o completada) solo se lleva en el Excel.** La columna «Fila» es la fila del Excel, para encontrarla rápido. Fechas en formato día/mes de 2026.

| Fila | Área | Tarea | Criterio de aceptación | Fecha | Responsable |
| --- | --- | --- | --- | --- | --- |
| 8 | Arquitectura | Documentar el stack tecnológico actual | Documentar el stack real del MVP: React Native, Expo, TypeScript, navegación, manejo de estado, SVG/animaciones y servicios externos. | 10/10 | Santiago |
| 2 | Estrategia | Validar disposición real de uso | Consultar a 8–10 personas sobre si usarían Pandask, en qué situaciones y qué barreras tendrían. Consolidar resultados. | 12/10 | Andrea |
| 3 | Estrategia | Definir plan gratuito y plan pago | Máximo 5 diferencias. El gratuito conserva el valor central y el pago respeta la restricción económica. | 16/10 | Esteban |
| 4 | Estrategia | Cerrar alcance técnico del MVP | Lista cerrada de funcionalidades obligatorias para el 16/11, separadas de las opcionales. | 17/10 | Carlos |
| 5 | Diseño | Documentar flujo final de usuario | Diagrama del flujo: ingreso → registrar/hablar → propuesta de plan → tareas → completar → progreso → ajustes. | 18/10 | Santiago |
| 9 | Arquitectura | Definir la arquitectura técnica del MVP | Diagrama con app, almacenamiento/base de datos, autenticación, servicio del agente, voz y flujo de datos entre componentes. | 20/10 | Carlos |
| 10 | Arquitectura | Diseñar el modelo de datos | Entidades y campos mínimos de Usuario, Tarea, Subtarea, Plan, Progreso, Lugar desbloqueado y Preferencias, con sus relaciones. | 21/10 | Andrea |
| 11 | Arquitectura | Definir especificación funcional del agente | Entradas, salidas, límites y acciones: interpretar, descomponer, estimar, priorizar y distribuir. | 21/10 | Andrea |
| 12 | Arquitectura | Seleccionar tecnología/proveedor para el agente | Modelo o servicio de IA compatible con el presupuesto, con costo, límites y alternativa de contingencia. | 22/10 | Santiago |
| 13 | Arquitectura | Diseñar instrucciones y formato de salida del agente | Instrucciones base y formato estructurado convertible en tareas, subtareas, duración, dificultad, prioridad y fechas. | 23/10 | Andrea |
| 6 | Diseño | Completar niveles y lugares de Progreso | Escenarios de la demo final, su orden de desbloqueo y actualización real del progreso al completar tareas. | 24/10 | Andrea |
| 14 | Arquitectura | Definir autenticación y seguridad | Cómo funciona el registro e inicio de sesión, dónde se guardan los datos, cómo se protegen las credenciales y cómo se mantienen las API keys fuera del cliente. | 24/10 | Esteban |
| 7 | Diseño | Revisar consistencia de interfaz final | Componentes, textos, navegación, estados y comportamiento visual coherentes en las pantallas principales. | 26/10 | Esteban |
| 15 | Desarrollo | Implementar persistencia de datos | Tareas, progreso y preferencias se mantienen al cerrar y volver a abrir la app. | 27/10 | Carlos |
| 16 | Desarrollo | Implementar autenticación básica | Reemplazar el acceso solo visual por registro e inicio de sesión funcionales. | 28/10 | Santiago |
| 17 | Desarrollo | Crear capa de servicio para el agente | Servicio aislado que envía contexto al agente, recibe la respuesta, valida el formato y maneja fallos. | 28/10 | Carlos |
| 18 | Desarrollo | Implementar interpretación de responsabilidades | A partir de texto libre, identificar una o más responsabilidades y extraer su información, sin guion fijo. | 30/10 | Santiago |
| 19 | Desarrollo | Implementar descomposición automática | Una responsabilidad compleja se convierte en subtareas que el usuario revisa antes de guardar. | 31/10 | Andrea |
| 20 | Desarrollo | Implementar estimación de esfuerzo | El agente propone duración y dificultad por actividad, y el usuario puede corregirlas. | 01/11 | Santiago |
| 21 | Desarrollo | Implementar lógica de priorización | Lógica reproducible con fecha límite, importancia, dificultad/esfuerzo y tiempo disponible, probada con al menos 5 escenarios. | 02/11 | Carlos |
| 22 | Desarrollo | Implementar generación del plan | Distribuir tareas y subtareas en los días disponibles y mostrar una propuesta editable antes de agregarla a la lista. | 03/11 | Santiago |
| 23 | Desarrollo | Integrar agente con la gestión real de tareas | Las tareas aceptadas en la conversación se guardan en la misma persistencia, sin duplicados, y se reflejan en Tareas y Progreso. | 04/11 | Carlos |
| 24 | Desarrollo | Reemplazar conversación simulada por interacción real | «Hablar» deja de depender de respuestas predefinidas y usa el agente. | 05/11 | Esteban |
| 25 | Desarrollo | Implementar entrada de voz | Capturar voz, convertirla a texto y enviarla al mismo flujo del agente, manteniendo la entrada manual. | 06/11 | Santiago |
| 26 | Desarrollo | Implementar manejo de errores y casos ambiguos | Si faltan datos o la respuesta del agente es inválida, Pandask pide aclaración o permite corregir sin perder información. | 06/11 | Esteban |
| 27 | Desarrollo | Implementar recordatorios mínimos | Recordatorios básicos de tareas próximas, sin notificaciones excesivas ni punitivas. | 07/11 | Esteban |
| 28 | Calidad | Crear pruebas unitarias de lógica crítica | Cubrir creación/edición de tareas, priorización, generación/validación del plan y actualización de progreso. | 08/11 | Carlos |
| 29 | Calidad | Realizar QA funcional y de interfaz | Probar el flujo completo en los dispositivos objetivo y corregir errores bloqueantes o inconsistencias visibles. | 09/11 | Santiago |
| 30 | Calidad | Preparar build estable para lanzamiento | Versión reproducible que se instale o abra sin depender del entorno de desarrollo. | 10/11 | Carlos |
| 31 | Lanzamiento | Desplegar Pandask | Versión accesible fuera del entorno de desarrollo, con acceso, autenticación, persistencia, agente, tareas y progreso verificados. Debe estar desplegada antes de las pruebas finales con usuarios. | 11/11 | Esteban |
| 32 | Lanzamiento | Implementar registro básico de eventos y errores | Registrar creación de tarea, aceptación de plan, tarea completada, error del agente y tiempos básicos del flujo. | 11/11 | Esteban |
| 33 | Lanzamiento | Verificar persistencia y recuperación básica | Los datos permanecen tras cerrar sesión o reabrir la app, y fallos simples no destruyen el estado. | 11/11 | Carlos |
| 34 | Legal y evaluación | Definir tratamiento de datos y privacidad | Datos recolectados, finalidad, datos sensibles, consentimiento, conservación/eliminación y texto de privacidad para el usuario. | 11/11 | Andrea |
| 35 | Legal y evaluación | Preparar protocolo de prueba con usuarios | Tareas, guion y métricas: tiempo de organización, número de pasos, claridad, facilidad, calidad de priorización y percepción de presión/estrés. | 11/11 | Andrea |
| 36 | Legal y evaluación | Realizar pruebas del MVP desplegado con usuarios | Probar con al menos 5 usuarios y registrar resultados comparables. | 13/11 | Esteban |
| 37 | Legal y evaluación | Analizar feedback y priorizar mejoras | Clasificar hallazgos en críticos, importantes y opcionales, con evidencia y decisión explícita. | 14/11 | Esteban |
| 38 | Legal y evaluación | Implementar ajustes prioritarios | Corregir lo crítico e importante sin romper el flujo principal desplegado. | 15/11 | Carlos |
| 39 | Legal y evaluación | Validar versión final ajustada | Regresión final; los problemas críticos quedaron resueltos. | 16/11 | Santiago |
| 40 | Legal y evaluación | Cerrar entrega final de Pandask | Informe, demo, decisiones técnicas, evidencia de pruebas, privacidad y presentación corresponden a la misma versión final. El 17 y 18/11 quedan como margen de contingencia. | 16/11 | Carlos |

## Decisiones

Registro de decisiones ya tomadas. Si una tarea nueva contradice alguna, se discute antes de cambiarla.

| Registrada | Decisión | Quién | Notas |
| --- | --- | --- | --- |
| 2026-11-02 | **Pandask** es el nombre de la app; **Pandoro**, el del panda. | Equipo | El código conserva "Pandoro" en nombres internos por ahora. |
| 2026-11-02 | Proveedor de IA: Gemini API, modelo `gemini-3.5-flash-lite`. | Santiago (fila 12) | Admite salidas estructuradas en JSON. Contingencia por evaluar: Groq. Detalle en la rama `santiago-cambios`. |
| 2026-11-02 | Autenticación con Firebase. | Santiago | Definición de seguridad pendiente (fila 14, Esteban). |
| 2026-11-02 | Sin backend propio separado: Firebase para usuarios y Gemini llamado desde la app. | Santiago | La arquitectura lo concreta con Firebase AI Logic, para que la clave de Gemini no quede en la app. La cuota mensual "controlada en el servidor" queda como límite conocido del MVP. Ver [`arquitectura.md`](arquitectura.md). |
| 2026-11-02 | Plataformas del MVP: app instalada en Android (EAS Build) y la misma app como web (Firebase Hosting) para iPhone y otros dispositivos. Se desarrolla con development build, no con Expo Go. | Carlos, con el equipo | La app de iPhone requiere una cuenta de Apple Developer pagada; queda para después del MVP. |
| — | La IA solo interpreta, extrae, descompone y estima; distribución temporal y priorización usan reglas propias. | Equipo | Reduce costo y hace el plan reproducible. |
| — | La gamificación nunca castiga atrasos ni quita progreso. | Equipo | Contra mecánicas punitivas como las de Habitica o Forest. |
| 2026-11-02 | Se adoptan las cuatro decisiones condicionadas por normas de la ficha técnica. | Equipo | Ver [Marco normativo](#marco-normativo); los puntos abiertos siguen pendientes. |
