# Autenticación con Firebase

Pandoro usa Firebase Authentication con correo y contraseña. Toda la configuración está en `src/services/firebase/`, las operaciones en `src/services/auth/authService.ts` y el estado de sesión en `src/components/auth/AuthProvider.tsx`.

## Configuración en Firebase Console

Estos pasos se hacen a mano; el código no los automatiza.

1. Entra a [Firebase Console](https://console.firebase.google.com/) y selecciona el proyecto de Pandoro.
2. Abre **Authentication** y pulsa **Comenzar** si aún no está activado.
3. En **Sign-in method**, habilita **Correo electrónico/contraseña**. No hace falta activar el vínculo por correo.
4. En **Configuración del proyecto > Tus apps**, registra una app web si no existe.
5. Copia los valores de `firebaseConfig` en `.env`:

| Variable | Valor de `firebaseConfig` | Obligatoria |
| --- | --- | --- |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `apiKey` | Sí |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` | Sí |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` | Sí |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `appId` | Sí |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` | No |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` | No |

6. En **Authentication > Configuración > Dominios autorizados**, comprueba que estén `localhost` y el dominio donde publiques la app.
7. Reinicia con `npx expo start --web --clear`. Expo incorpora estas variables al compilar.

Mientras falte alguna variable obligatoria, la app abre pero nadie puede entrar: las pantallas de acceso muestran «El acceso todavía no está configurado en esta app.».

## Decisiones

- **Seguridad:** la configuración web no es una contraseña, pero tampoco protege nada por sí sola. Nunca pongas cuentas de servicio ni credenciales administrativas en la app.
- **Persistencia:** en web, Firebase guarda la sesión en IndexedDB. En iOS y Android usa AsyncStorage, porque allí no existe IndexedDB.
- **Sin verificación de correo:** no está implementada en esta fase porque la interfaz no tiene ese flujo.
- **Recuperar contraseña:** el enlace de Iniciar sesión envía el correo con `sendPasswordResetEmail`. El mensaje es igual exista o no la cuenta.
- **Protección de correos:** Firebase la activa en los proyectos nuevos. Con ella, un correo inexistente o una contraseña incorrecta devuelven `auth/invalid-credential`, así que la app muestra el mismo mensaje en ambos casos.
- **Nombre:** se guarda como `displayName` con `updateProfile`.
- **Perfil:** ya no edita correo ni contraseña, porque esos cambios eran simulados. Solo cambia el nombre.
- **Datos por usuario (fila 15):** se guardan en Cloud Firestore bajo `users/{uid}`, a través de `src/services/data/`. Ahí están las tareas (`tasks/`), el progreso del mundo (`progress/world`) y, en el documento del usuario, las preferencias de Ajustes y la constancia del consentimiento (versión del aviso y fecha). Un usuario nuevo empieza sin tareas y con el progreso en cero. El borrador del plan sigue solo en el dispositivo hasta confirmarlo.
- **Consentimiento:** el registro guarda la constancia junto con la cuenta. Si no se puede guardar, la cuenta recién creada se borra (Ley 1581).
- **Caché sin conexión:** en web, Firestore guarda una copia en IndexedDB. En iOS y Android, el SDK de JavaScript solo tiene caché en memoria, así que sin conexión la lista no carga al abrir la app.

## Firestore

1. En **Firestore Database**, la base `(default)` debe existir en modo de producción.
2. En la pestaña **Reglas**, pega el contenido de [`firestore.rules`](../firestore.rules) y pulsa **Publicar**. Ese archivo es la fuente de verdad: si las reglas cambian, se edita y se vuelve a publicar.
3. Las reglas solo dejan a cada usuario leer y escribir lo suyo. Las validaciones de campos y tamaños quedan para la fila 14 (Esteban).

## Rutas

`src/app/_layout.tsx` decide según la sesión:

- Mientras Firebase comprueba la sesión, una pantalla de carga cubre la app.
- Sin sesión, las rutas privadas redirigen a Iniciar sesión, también al cerrar sesión.
- Con sesión, la bienvenida, Iniciar sesión y Crear cuenta redirigen a Inicio.
