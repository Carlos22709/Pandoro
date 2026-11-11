# Tratamiento de datos y privacidad

| | |
| --- | --- |
| **Tarea** | Fila 34 del cronograma: definir tratamiento de datos y privacidad |
| **Responsable** | Andrea Sosa |
| **Base** | [Marco normativo](CONTEXTO.md#marco-normativo), [`arquitectura.md`](arquitectura.md) §5–7, [`agente.md`](agente.md) y el código a 10 de noviembre de 2026 |

> **Estado: borrador técnico, no asesoría jurídica.** Lo que aquí se marca «propuesta» o «por confirmar» necesita ratificación del equipo y, antes del piloto, revisión de alguien con criterio legal. Este documento distingue lo que **ya hace el código** de lo que **falta construir**.

Roles: el equipo de Pandask es el **Responsable** del tratamiento; Firebase (Google) es **Encargado** para cuenta y datos. Marco: Ley 1581 de 2012, Decreto 1074 de 2015 (Título 2, Cap. 25), Circular Externa SIC 002 de 2024 y Constitución arts. 15 y 20.

## 1. Datos que se tratan

| Dato | Finalidad | Dónde vive | Conservación | Estado en el código |
| --- | --- | --- | --- | --- |
| Correo, nombre de usuario y credenciales | Crear la cuenta e iniciar sesión | Firebase Authentication | Mientras exista la cuenta | Implementado |
| Tareas y subtareas aprobadas (título, detalle, duración, dificultad, prioridad, fecha, estado) | Mostrar y gestionar la lista (F01, F09) | `users/{uid}/tasks` | Hasta que el usuario las borre o elimine la cuenta | Implementado |
| Tareas completadas (qué y cuándo) | Calcular progreso y cierre de semana (F12) | `users/{uid}/completions` | Ídem | Implementado |
| Progreso y lugares desbloqueados | Gamificación | `users/{uid}/progress` | Ídem | Implementado |
| Preferencias (p. ej. recordatorios) | Ajustes (F13) | `users/{uid}` | Ídem | Implementado |
| Constancia de autorización (versión del aviso y fecha) | Demostrar el consentimiento (Ley 1581) | `users/{uid}.consents` | Ver §5 | Implementado para la autorización principal |
| Disponibilidad (días y minutos) | Planificar | Hoy solo en memoria de la pantalla; el modelo la prevé en `users/{uid}` | Ídem | Por confirmar (fila 10) |
| Plan confirmado (resumen) | Historial del plan | `users/{uid}/plans` en la arquitectura | Ídem | **No implementado**: hoy solo se guardan las tareas del plan |
| Consumo mensual de IA | Mostrar cuota al usuario | `users/{uid}/usage` en la arquitectura | Ídem | **No implementado** |

**Lo que no se guarda, en ningún caso:** el texto libre que el usuario escribe al asistente, la transcripción, el audio ni la conversación. Tampoco se registran en los registros de errores. Solo se conservan las tareas y planes aprobados.

**Datos que no se piden:** ubicación, contactos, calendario, salud, estrés ni bienestar.

## 2. Qué se envía a la IA

Solo lo necesario para planificar (Circular SIC 002, principio de necesidad):

- Texto de las responsabilidades (≤ 4.000 caracteres) tras un filtro local que cambia correos por `[correo]` y teléfonos o documentos por `[número]`; lo mismo para las instrucciones de ajuste.
- Días y minutos disponibles.
- La fecha de hoy.

**Nunca** se envía el nombre, el correo, el `uid`, el audio ni el historial. El filtro **no detecta nombres propios**; la pantalla recuerda no escribir datos de terceros.

Proveedor: Gemini (`gemini-3.5-flash-lite`) a través de Firebase AI Logic. Voz: en Android la transcripción se pide en el dispositivo cuando el teléfono lo permite; en la web Chrome envía el audio a Google para transcribirlo. Pandask no guarda el audio.

## 3. Datos sensibles (estrés y bienestar)

- La app **no recoge** datos de estrés, hábitos o bienestar. Si en el futuro se añade una función que los pida, irá con una autorización **aparte y opcional**, con su finalidad, y la app seguirá completa sin ella (Decreto 1074, art. 2.2.2.25.2.3).
- Las preguntas de percepción de estrés del [protocolo de pruebas](protocolo-pruebas.md) se responden **fuera de la app**, en un formulario con su propio consentimiento, de forma anónima y para evaluar el proyecto, no al usuario.
- Pandask no diagnostica ni trata problemas de salud mental.

## 4. Autorizaciones

| # | Autorización | Cuándo | Obligatoria | Estado |
| --- | --- | --- | --- | --- |
| 1 | Aviso de privacidad y tratamiento de datos | Registro, antes de crear la cuenta. Casilla **sin marcar**; se guardan versión (`PRIVACY_NOTICE_VERSION`, hoy `borrador-2026-11-02`) y fecha; `ConsentGate` la exige a quien aún no la tenga | Sí, para tener cuenta | Implementada. El texto de la casilla es provisional |
| 2 | Uso del asistente de IA (y de la voz en la web) | Antes de la primera vez que se use. Casilla propia, sin marcar | **No.** Sin ella, Pandask funciona completa en modo manual | **Propuesta, por ratificar.** No está en el código. Motivo: en el nivel gratuito Google usa el contenido enviado para mejorar sus productos, así que no actúa solo como Encargado (decisión 3 del marco normativo) |
| 3 | Datos de estrés o bienestar | Solo si se añade esa función | No | No aplica al MVP |

Seguir usando la app **no** cuenta como aceptación. Cada autorización guarda su versión y su fecha. Revocar la 2 desactiva solo «Hablar» y la generación de planes.

## 5. Conservación, eliminación y derechos

Derechos (Ley 1581, art. 8; Constitución art. 15): conocer, actualizar y rectificar, pedir prueba de la autorización, ser informado del uso, presentar quejas ante la SIC, revocar y solicitar supresión.

| Derecho | Cómo se ejerce | Estado |
| --- | --- | --- |
| Consultar y corregir | Perfil: ver y editar los datos personales | Por confirmar qué cubre Perfil hoy (F13) |
| Revocar autorizaciones opcionales | Ajustes | Pendiente con la autorización 2 |
| Eliminar la cuenta y todo el historial | Perfil: explica qué se borra y borra `users/{uid}` y la cuenta. Pide reingresar la contraseña si la sesión es antigua | **Los repositorios tienen `deleteAllTasks` y `deleteAllCompletions`, pero no hay un flujo de eliminar cuenta completo**: por implementar (Santiago/Carlos) |
| Reglas de acceso | Cada usuario solo lee y escribe `users/{uid}`; `firestore.rules` y `scripts/check-firestore.mts` lo comprueban | Implementado; falta verificarlo con dos cuentas antes del piloto |

**Constancia mínima tras eliminar la cuenta — propuesta a ratificar.** Borrar todo lo de `users/{uid}` borra también la prueba del consentimiento. Se propone conservar, fuera de `users/{uid}` y con su propia regla de seguridad, solo: un identificador **no reversible** (hash), la versión del aviso, la fecha de aceptación y la fecha de eliminación. Sin correo, nombre ni contenido. Plazo propuesto: **2 años** desde la eliminación, luego se borra. Validar el plazo con asesoría legal. Si el equipo prefiere no conservar nada, se acepta que no habrá prueba del consentimiento.

Plazos de eliminación del proveedor: **por verificar** con Firebase antes del piloto (decisión 4).

## 6. Proveedores y transmisión internacional

| Proveedor | Qué trata | Papel | Nota |
| --- | --- | --- | --- |
| Firebase (Authentication, Firestore, Hosting, AI Logic) | Cuenta, tareas, progreso, constancia | Encargado | Firestore está en `nam5` (multirregión de EE. UU.); la ubicación no se cambia |
| Gemini (nivel gratuito, vía AI Logic) | Texto filtrado, disponibilidad y fecha | Google lo usa para mejorar sus productos | Por eso la autorización 2. Pasar al nivel de pago exige facturación (descartada) |
| Servicio de voz del sistema / Chrome | Audio durante el dictado | Proveedor del dispositivo o navegador | No se guarda el audio en Pandask |

**Transmisión internacional (por confirmar):** los datos salen de Colombia. El aviso y la política deben decirlo (§7). Falta revisar qué términos del proveedor respaldan la transferencia y si la SIC exige algo adicional.

## 7. Texto para el usuario

Redacción en lenguaje claro. Los textos entre corchetes son pendientes de definir.

### 7.1 Aviso corto del registro (sustituye a la casilla provisional)

> **Antes de crear tu cuenta**
>
> Pandask, creada por estudiantes de la Universidad de La Sabana, guardará tu correo, las tareas que aceptes, tu progreso y tus ajustes para que tu lista siga ahí cuando vuelvas. Usamos estos datos solo para que la app funcione. No los vendemos ni los usamos para publicidad.
>
> Tus datos se guardan con Google Firebase, en servidores fuera de Colombia. Puedes consultarlos, corregirlos, pedir que los eliminemos o retirar tu autorización cuando quieras, desde Perfil.
>
> ☐ Acepto el tratamiento de mis datos según la [política completa].

La casilla va sin marcar. Cuando el texto cambie, se actualiza `ConsentCheckbox.tsx` y `PRIVACY_NOTICE_VERSION`.

### 7.2 Aviso de la función de IA (autorización 2, propuesta)

> **Usar el asistente de Pandoro**
>
> Para convertir lo que escribas o dictes en un plan, enviamos ese texto a Google Gemini. Quitamos correos y teléfonos antes, pero **no escribas nombres ni datos de otras personas**. En esta versión, Google puede usar lo que enviamos para mejorar sus productos.
>
> No guardamos tu texto, tu voz ni la conversación: solo las tareas que tú confirmes. Lo que propone Pandoro son **sugerencias** que puedes editar antes de guardar.
>
> Si no lo activas, puedes crear y organizar tus tareas a mano.
>
> ☐ Quiero usar el asistente de Pandoro.

### 7.3 Política de tratamiento de datos (esquema)

1. Quiénes somos y cómo contactarnos: [nombre del responsable y **correo de contacto por definir**].
2. Qué datos recogemos y para qué (tabla de §1 en lenguaje simple).
3. Qué enviamos a la IA y a la voz, y qué no guardamos (§2).
4. Datos de estrés o bienestar: no los pedimos.
5. Con quién los compartimos: Google Firebase y Gemini (§6) y que están fuera de Colombia.
6. Cuánto tiempo los conservamos y la constancia mínima tras eliminar la cuenta (§5).
7. Tus derechos y cómo ejercerlos desde Perfil o por correo; queja ante la Superintendencia de Industria y Comercio.
8. Menores de edad: [por definir; el público objetivo son estudiantes y trabajadores adultos].
9. Cambios en la política: versión y fecha; si cambia lo esencial, se pide una nueva aceptación.
10. Fecha y versión. Publicada en [URL por definir].

## 8. Por confirmar

| Tema | Quién |
| --- | --- |
| Ratificar la autorización 2 y construirla (casilla, desactivar «Hablar» y generación sin ella, modo manual) | Equipo; implementa Santiago/Carlos |
| Ratificar constancia mínima y 2 años; ubicación y regla de seguridad | Equipo + criterio legal |
| Flujo completo de eliminar cuenta, consulta y edición en Perfil | Equipo (F13 y F14) |
| Reglas de Firestore, App Check y límite por usuario de AI Logic; prueba con dos cuentas | Esteban (fila 14) |
| Voz en la web: incluirla en la autorización 2 o desactivarla; exigir transcripción en el dispositivo en Android | Andrea y Santiago |
| Redacción jurídica de transmisión internacional | Andrea, con apoyo legal |
| URL de la política y correo de contacto | Equipo |
| Plazos de eliminación de Firebase | Esteban |
| Guardar el historial de planes (`plans`) y el consumo de IA (`usage`) o retirarlos de la arquitectura | Andrea (modelo de datos) y Carlos |
