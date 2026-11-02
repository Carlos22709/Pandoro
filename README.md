# Pandoro — demo de navegación

Prototipo móvil hecho con React Native, Expo, TypeScript y Expo Router. Incluye un onboarding deslizable de cuatro páginas, pantallas de Iniciar sesión y Crear cuenta, y las rutas Inicio, Tareas, Progreso, Perfil, Hablar y Nueva tarea. Nueva tarea convierte texto libre en un plan editable con Google Gemini; el resto no tiene lógica de negocio y nada se guarda al cerrar la app.

Flujo de entrada:

```text
Bienvenida ⇄ Organiza ⇄ Prioriza ⇄ Avanza
   │
   ├── Iniciar sesión → /login    → Inicio
   └── Crear cuenta   → /register → Inicio
```

El acceso es solo visual: los campos admiten texto, pero no hay autenticación, validación ni persistencia. Cualquier botón de acceso entra en Inicio y vacía la pila de navegación. Las pantallas de acceso comparten `src/components/auth/` (`AuthLayout`, `AuthInput`, `PandoroBrandMark`).

## Ejecutar

Requiere Node.js 22.13 o posterior para Expo SDK 58.

```bash
npm install
cp .env.example .env   # pega tu clave en EXPO_PUBLIC_GEMINI_API_KEY
npm start
```

Después, escanea el QR con Expo Go o pulsa `a`, `i` o `w` para abrir Android, iOS o web.

Comandos directos:

```bash
npm run android
npm run ios
npm run web
npm run typecheck
npm test
```

Sin clave, la app funciona igual: solo Nueva tarea avisa que la IA no está configurada y mantiene la creación manual.

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
- Fondo de las pantallas de acceso: `src/components/art/AuthBackdrop.tsx`

Cada pieza es un componente independiente. Para sustituirla por una imagen final, conserva el componente contenedor y reemplaza su SVG por un `Image` con un archivo ubicado en `assets/`. De ese modo las pantallas y futuras animaciones no necesitan cambiar.

La paleta se centraliza en `src/theme/palette.ts`.

La tipografía está en `src/theme/typography.ts`: Fraunces para títulos, cifras y lo que dice Pandoro, y Figtree para el resto. Cada peso es una familia propia (`fonts.bold`, `fonts.semibold`…), así que los estilos usan `fontFamily` en lugar de `fontWeight`. Los tamaños salen de `typeScale`.
