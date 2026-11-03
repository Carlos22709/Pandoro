# Despliegue de Pandask (fila 31)

Guía para publicar la versión web en Firebase Hosting del proyecto `pandask-f849d`. **Nadie despliega sin el visto bueno del equipo**: el despliegue cambia lo que ven los usuarios de las pruebas (fila 36).

## Requisitos

- Node.js 22.13 o posterior y `npm install` hecho.
- Firebase CLI (`npm i -g firebase-tools`) con sesión de una cuenta con acceso al proyecto: `firebase login`.
- Archivo `.env` local con las variables `EXPO_PUBLIC_FIREBASE_*` del proyecto real (ver `.env.example`). No se sube al repositorio.
- En la consola de Firebase, Authentication → Settings → Authorized domains debe incluir `pandask-f849d.web.app` y `pandask-f849d.firebaseapp.com` (vienen por defecto; revisarlo).

## Pasos

1. Partir de `main` actualizado y con todo integrado:
   ```bash
   git checkout main && git pull
   npm install
   ```
2. Comprobar que todo pasa:
   ```bash
   npm run typecheck
   npm test
   npm run test:rules   # requiere Java 21
   ```
3. Generar la versión web (queda en `dist/`, que está en `.gitignore`):
   ```bash
   npm run build:web
   ```
4. (Opcional) Probarla localmente antes de publicar:
   ```bash
   firebase emulators:start --only hosting --project pandask-f849d
   ```
5. Publicar las reglas de Firestore (solo si cambiaron) y el sitio:
   ```bash
   firebase deploy --only firestore:rules --project pandask-f849d
   firebase deploy --only hosting --project pandask-f849d
   ```
6. Abrir `https://pandask-f849d.web.app`, crear una cuenta de prueba, aceptar el consentimiento, crear una tarea y pedir una sugerencia en «Hablar».

## Vista previa sin tocar producción

Para revisar una versión antes de publicarla, usar un canal temporal (caduca solo):

```bash
firebase hosting:channel:deploy revision --expires 7d --project pandask-f849d
```

## Volver atrás

En la consola de Firebase → Hosting → historial de versiones, «Revertir» en la versión anterior. Las reglas se revierten publicando el `firestore.rules` anterior.

## Configuración

`firebase.json` sirve `dist/` y redirige todas las rutas a `index.html` (Expo Router resuelve la ruta en el navegador). Los `.js` y `.css` llevan caché larga porque Expo les pone un hash en el nombre.
