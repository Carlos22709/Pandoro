# Pandask — MVP

Aplicación móvil hecha con React Native, Expo, TypeScript y Expo Router. Incluye un onboarding deslizable de cuatro páginas, acceso con Firebase y las rutas Inicio, Tareas, Progreso, Perfil, Hablar y Nueva tarea. Hablar y Nueva tarea convierten texto libre en una sugerencia de plan editable con Google Gemini. La sesión, las tareas, el progreso y las preferencias se conservan con Firebase.

Flujo de entrada:

```text
Bienvenida ⇄ Organiza ⇄ Prioriza ⇄ Avanza
   │
   ├── Iniciar sesión → /login    → Inicio
   └── Crear cuenta   → /register → Inicio
```

El acceso usa Firebase Authentication con correo y contraseña; sin sesión, las rutas privadas no abren. La configuración está en [docs/FIREBASE.md](docs/FIREBASE.md). Las pantallas de acceso comparten `src/components/auth/` (`AuthLayout`, `AuthInput`, `PandoroBrandMark`).

## Flujo principal

```text
Inicio → Hablar con Pandoro → conversación real con Gemini → sugerencia editable
      → Agregar a mis tareas → Tareas → completar una tarea
      → celebración → Ver mi mundo → avance de Pandoro
```

- **Hablar:** elige los días y minutos disponibles y escribe tus responsabilidades. Pandoro pregunta lo indispensable que falte y muestra una sugerencia editable antes de guardarla. La voz sigue pendiente.
- **Persistencia:** al confirmar, cada subtarea se guarda en la misma colección de Tareas con un identificador estable, así que repetir la confirmación no crea duplicados.
- **Privacidad:** la conversación y el borrador no se guardan. Solo llegan a Firestore las tareas aprobadas.
- **Reiniciar:** Ajustes → Demo → "Reiniciar demo" pide un segundo toque y borra las tareas y el progreso del usuario.

## Ejecutar

Requiere Node.js 22.13 o posterior para Expo SDK 58.

```bash
npm ci
cp .env.example .env   # completa las claves de Gemini y Firebase
npm start
```

En web, pulsa `w`. En Android se usa un development build o el APK de distribución interna; Expo
Go no incluye todos los módulos nativos de Pandask.

Comandos directos:

```bash
npm run android
npm run ios
npm run web
npm run typecheck
npm test
npm run build:web
npm run build:android:preview
```

La configuración y la evidencia del candidato Android están en
[`docs/build-candidato.md`](docs/build-candidato.md). El despliegue web está en
[`docs/despliegue.md`](docs/despliegue.md).

Sin clave de Gemini, la planificación avisa que la IA no está configurada y mantiene la creación manual. Sin la configuración de Firebase, la app abre pero no se puede entrar.

## Planificación con IA

> **Provisional, no apto para producción.** Las variables `EXPO_PUBLIC_*` quedan dentro del paquete de la app y cualquiera puede extraerlas. Usa esta integración solo para el MVP y migra a un backend antes de publicar.

El modelo, los costos, los límites y la contingencia están en [docs/GEMINI.md](docs/GEMINI.md).

## Capas visuales

El arte está implementado como SVG nativo para conservar nitidez y evitar depender de recursos externos:

- Escenario: `src/components/art/ForestScene.tsx`
- Pandoro: `src/components/art/Pandoro.tsx`
- Cabeza del onboarding y del acceso: `src/components/art/PandoroHead.tsx` (recorta la misma cabeza de `Pandoro.tsx`; sus variantes solo cambian el color de las iluminaciones)

El color de Pandoro son iluminaciones de acuarela: óvalos con degradado radial que se desvanecen hasta transparente, agrupados por zona (`HEAD_LIGHTS`, `BODY_LIGHTS`, reflejos de las partes oscuras) y con una intensidad global (`LIGHT_INTENSITY`) en `Pandoro.tsx`.
- Pajarito: `src/components/art/VoiceBird.tsx`
- Bosque de origami de Inicio: el fondo `src/components/art/OrigamiForestScene.tsx` sustituye al de bambú al desbloquear el lugar, y en el frente se despliegan `OrigamiFox.tsx` y los tulipanes de `OrigamiFlowers.tsx` (dibujos propios, distintos de las piezas pequeñas del mapa de Progreso)
- Fondo de las pantallas de acceso: `src/components/art/AuthBackdrop.tsx`

Cada pieza es un componente independiente. Para sustituirla por una imagen final, conserva el componente contenedor y reemplaza su SVG por un `Image` con un archivo ubicado en `assets/`. De ese modo las pantallas y futuras animaciones no necesitan cambiar.

La paleta se centraliza en `src/theme/palette.ts`.

La tipografía está en `src/theme/typography.ts`: Fraunces para títulos, cifras y lo que dice Pandoro, y Figtree para el resto. Cada peso es una familia propia (`fonts.bold`, `fonts.semibold`…), así que los estilos usan `fontFamily` en lugar de `fontWeight`. Los tamaños salen de `typeScale`.
