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
- **Nombre:** se guarda como `displayName` con `updateProfile`. No hay base de datos de perfiles.
- **Perfil:** ya no edita correo ni contraseña, porque esos cambios eran simulados. Solo cambia el nombre.
- **Datos por usuario:** las tareas siguen en memoria y son las mismas de ejemplo para todos. Se reinician al cerrar sesión o cambiar de cuenta.

## Rutas

`src/app/_layout.tsx` decide según la sesión:

- Mientras Firebase comprueba la sesión, una pantalla de carga cubre la app.
- Sin sesión, las rutas privadas redirigen a Iniciar sesión, también al cerrar sesión.
- Con sesión, la bienvenida, Iniciar sesión y Crear cuenta redirigen a Inicio.
