# Despliegue de Pandask (fila 31)

Guía para publicar la versión web en Firebase Hosting del proyecto `pandask-f849d`, fuera del entorno de desarrollo del equipo. **Nadie despliega a producción ni a un canal de vista previa sin el visto bueno explícito de Esteban y sin que Carlos haya fusionado el PR en `main`**: el despliegue cambia lo que ven los usuarios de las pruebas (fila 36).

Estado al 9 de noviembre de 2026: la configuración de hosting, el script de build y las reglas de Firestore están en el repositorio y listas. **La app todavía no está publicada** en `https://pandask-f849d.web.app`. Falta el comando de despliegue (abajo), después del merge.

## Requisitos

- Node.js 22.13 o posterior y `npm install` hecho.
- Firebase CLI (`npm i -g firebase-tools`) con sesión de una cuenta con acceso al proyecto: `firebase login`.
- Proyecto activo: el archivo `.firebaserc` apunta a `pandask-f849d`. También se puede pasar `--project pandask-f849d` en cada comando.
- Archivo `.env` local con las variables `EXPO_PUBLIC_FIREBASE_*` del proyecto real (ver `.env.example`). No se sube al repositorio. Esas variables se embeben en el build web.
- En la consola de Firebase, Authentication → Settings → Authorized domains debe incluir `pandask-f849d.web.app` y `pandask-f849d.firebaseapp.com` (vienen por defecto; revisarlo).
- Authentication → Sign-in method: correo/contraseña activado.
- Firebase AI Logic / Gemini habilitado en el proyecto (sin eso, «Hablar» y Nueva tarea fallan con un error controlado).

## Pasos (producción)

1. Partir de `main` actualizado y con todo integrado (PR de Esteban fusionado por Carlos):
   ```bash
   git checkout main && git pull
   npm install
   ```
2. Comprobar que todo pasa:
   ```bash
   npm run typecheck
   npm test
   npm run test:rules   # requiere Java 21; el emulador usa el puerto 8181
   ```
3. Generar la versión web (queda en `dist/`, que está en `.gitignore`):
   ```bash
   npm run build:web
   ```
4. (Opcional) Probarla localmente antes de publicar, sin tocar producción:
   ```bash
   firebase emulators:start --only hosting --project pandask-f849d
   ```
5. Publicar las reglas de Firestore y el sitio (estos son los comandos que faltan; **no ejecutarlos sin OK**):
   ```bash
   firebase deploy --only firestore:rules --project pandask-f849d
   firebase deploy --only hosting --project pandask-f849d
   ```
   Equivalente en un solo paso:
   ```bash
   firebase deploy --only firestore:rules,hosting --project pandask-f849d
   ```
6. Abrir `https://pandask-f849d.web.app` y verificar (checklist):
   - [ ] Carga la app (no 404 ni pantalla en blanco).
   - [ ] Registro e inicio de sesión con correo/contraseña.
   - [ ] Consentimiento de datos (Ley 1581) antes de entrar.
   - [ ] Crear una tarea y verla en Tareas (persistencia Firestore).
   - [ ] Pedir una sugerencia en «Hablar» y aceptarla (agente Gemini).
   - [ ] Marcar una tarea hecha y ver avance en Progreso.
   - [ ] (Opcional) Programar un recordatorio en un dispositivo que lo soporte.

## Vista previa sin tocar el canal live

Para revisar una versión antes de publicarla, usar un canal temporal (también es un cambio en Firebase Hosting; **requiere el mismo OK**):

```bash
firebase hosting:channel:deploy revision --expires 7d --project pandask-f849d
```

## Volver atrás

En la consola de Firebase → Hosting → historial de versiones, «Revertir» en la versión anterior. Las reglas se revierten publicando el `firestore.rules` anterior desde `main`.

## Configuración en el repo

- `firebase.json`: sirve `dist/`, redirige todas las rutas a `index.html` (Expo Router) y pone caché larga en `.js` / `.css`.
- `.firebaserc`: proyecto por defecto `pandask-f849d`.
- `npm run build:web`: `expo export --platform web`.
- `firestore.rules`: reglas por usuario; desplegarlas junto con el hosting si cambiaron.
