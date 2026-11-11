# Verificación de persistencia y recuperación básica

| | |
| --- | --- |
| **Tarea** | Fila 33 del cronograma: verificar persistencia y recuperación básica |
| **Responsable** | Carlos Sánchez |
| **Fecha de verificación** | 11 de noviembre de 2026 |
| **Comando** | `npm run check:firestore` |

La comprobación usa el proyecto real de Firebase configurado en `.env`. Crea dos cuentas temporales,
ejecuta las operaciones con los mismos servicios que usa la app y elimina las cuentas y sus datos al
terminar. No imprime credenciales, texto libre ni identificadores de usuario.

## Resultado

Las 16 comprobaciones pasaron:

- el registro conserva versión y fecha del consentimiento;
- las tareas se crean, leen, editan y eliminan;
- confirmar dos veces el mismo plan no duplica tareas;
- el progreso y las preferencias se guardan y vuelven a leerse;
- guardar preferencias no borra el consentimiento;
- sin sesión no se pueden leer tareas;
- una segunda cuenta no puede leer el perfil ni las tareas de la primera ni borrar sus datos;
- después de esos accesos denegados y de volver a iniciar sesión, las tareas, el progreso y las
  preferencias de la primera cuenta reaparecen intactos;
- las dos cuentas y todos los documentos temporales se eliminan al finalizar.

Los accesos denegados de la segunda cuenta forman parte de la prueba: el mensaje
`PERMISSION_DENIED` esperado demuestra que las reglas rechazaron la operación.

## Qué demuestra

- Los datos aprobados viven en Firestore y no en el estado temporal de una pantalla.
- Cerrar sesión limpia la información visible del usuario anterior, pero no elimina sus datos.
- Al volver a entrar, los repositorios recuperan el mismo estado.
- Un fallo de permisos no modifica ni destruye los datos existentes.
- Las tareas de un plan usan identificadores estables y la escritura repetida sobrescribe los mismos
  documentos en vez de crear duplicados.

## Límite conocido

En web, Firebase conserva sesión y caché en IndexedDB. En Android, la sesión usa AsyncStorage, pero el
SDK JavaScript de Firestore mantiene la caché solo en memoria. Por eso, al reabrir Android con conexión
los datos se recuperan desde Firestore; reabrir sin conexión todavía no muestra la lista guardada. Esta
limitación ya está registrada en [`arquitectura.md`](arquitectura.md) y [`FIREBASE.md`](FIREBASE.md).

Al ejecutar el script desde Node aparece un aviso de que IndexedDB no está disponible y Firebase usa
caché en memoria. Es esperado en el entorno de prueba y no afecta las escrituras y lecturas contra el
Firestore real.
