# Seguridad de Pandask (fila 14)

Complementa [arquitectura.md §7](arquitectura.md#7-seguridad-y-privacidad) y el [marco normativo](CONTEXTO.md#marco-normativo). Pandask es la app; Pandoro es la mascota.

## Autenticación

- Firebase Authentication con correo y contraseña ([FIREBASE.md](FIREBASE.md)). Sin sesión, las rutas privadas redirigen a Iniciar sesión.
- Con la protección de enumeración de correos activa, un correo inexistente y una contraseña incorrecta muestran el mismo mensaje.

## Reglas de Firestore

- Archivo: [`firestore.rules`](../firestore.rules), referenciado desde [`firebase.json`](../firebase.json).
- Cada persona solo lee y escribe `users/{uid}/**` (tareas, planes, progreso, uso) cuando `request.auth.uid == uid`.
- Todo lo demás está denegado, incluida una regla explícita `allow read, write: if false`.
- Publicarlas: `npx firebase-tools deploy --only firestore:rules --project <id>` (a mano, por quien administra el proyecto).

### Pruebas

- `npm test` incluye `tests/firestoreRules.test.ts`: revisión estática de que solo existen la regla del dueño y la denegación, sin `if true`.
- `npm run test:rules` ejecuta `tests/rules/firestore.rules.emulator.ts` en el emulador de Firestore (proyecto `demo-pandask`, sin costo ni credenciales). Comprueba con dos cuentas y sin sesión: la dueña lee y escribe; otra cuenta y el usuario sin sesión reciben 403; fuera de `users/{uid}` todo es 403. Requiere Java 21+ (firebase-tools 15). El emulador usa el puerto 8181.
- Pendiente (filas 15, 28 y 29): validar tipos y tamaños de campos cuando exista el esquema de persistencia.

## App Check

- Se activa en AI Logic y en Firestore antes de las pruebas con usuarios (fila 31): reCAPTCHA Enterprise en web y Play Integrity en Android.
- Primero en modo de supervisión para ver métricas; luego se aplica (enforce). Para desarrollo se usan tokens de depuración registrados en la consola, nunca en el repositorio.
- Además, bajar el límite por usuario de AI Logic de 100 a unas 10 solicitudes por minuto. La app ya limita la entrada a 4.000 caracteres y la respuesta a 12.000 tokens.

## Configuración y secretos

- La configuración web de Firebase (`EXPO_PUBLIC_FIREBASE_*`) **no es secreta**: identifica el proyecto. Se pone en `.env` (no versionado) y se documenta sin valores en `.env.example`.
- La clave de Gemini vive en Firebase AI Logic; la app nunca la ve.
- Nunca van en la app ni en el repositorio: cuentas de servicio, claves de administrador, tokens de depuración de App Check.
- Lo que protege los datos son las reglas, la autenticación y App Check, no ocultar la configuración.

## Decisiones

| Decisión | Motivo |
| --- | --- |
| Datos bajo `users/{uid}` y regla única de dueño | Simple de auditar; ninguna colección compartida. |
| Denegar por defecto | Una colección nueva queda cerrada hasta que se escriba su regla. |
| Pruebas con el emulador y proyecto `demo-` | Gratis y sin tocar datos reales. |
| Sin backend propio | Plan Spark; las cuotas mensuales reales quedan para la etapa comercial (ver arquitectura §7). |
| No guardar ni registrar texto libre ni conversaciones | Minimización de datos (Ley 1581 de 2012). |
