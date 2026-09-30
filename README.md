# Pandoro — demo interactiva

Prototipo móvil hecho con React Native, Expo, TypeScript y Expo Router. Incluye un onboarding deslizable de cuatro páginas, pantallas de Iniciar sesión y Crear cuenta, y las rutas Inicio, Tareas, Progreso, Perfil, Hablar y Nueva tarea. No hay backend, micrófono ni IA: una simulación en memoria hace que las acciones tengan consecuencias en toda la app para presentarla en vivo.

Flujo de entrada:

```text
Bienvenida ⇄ Organiza ⇄ Prioriza ⇄ Avanza
   │
   ├── Iniciar sesión → /login    → Inicio
   └── Crear cuenta   → /register → Inicio
```

El acceso es solo visual: los campos admiten texto, pero no hay autenticación, validación ni persistencia. Cualquier botón de acceso entra en Inicio y vacía la pila de navegación. Las pantallas de acceso comparten `src/components/auth/` (`AuthLayout`, `AuthInput`, `PandoroBrandMark`).

## Simulación para presentar

La demo cuenta una historia fija que sale igual en cada ensayo:

```text
Inicio → Hablar con Pandoro (dos turnos con guion) → Pandoro propone un plan de 6 tareas
      → Agregar a mis tareas → Tareas: "Terminar el informe" destacada
      → completarla → celebración → Ver mi mundo → Pandoro camina al Bosque de origami
      → Inicio: el zorro y las flores de origami se despliegan
```

- **Hablar:** mantén pulsado el pajarito mientras dices tu frase; la transcripción del guion se escribe sola y se envía al soltar. Un toque corto no envía nada. Lo que se diga en voz alta no importa, pero conviene decir algo parecido al guion.
- **Guion:** todos los textos (frases, respuestas, plan, títulos de celebración y burbuja de Inicio) están en `src/demo/demoScript.ts`. Las fechas suponen que la demo se presenta un martes.
- **Estado:** `src/demo/demoState.ts` guarda tareas y progreso, y `DemoProvider` lo comparte con todas las pantallas. La demo arranca con 24 tareas completadas, así que la tarea que se completa en escena abre el Bosque de origami.
- **Reiniciar:** Ajustes → Demo → "Reiniciar demo" (pide un segundo toque). Recargar la app también vuelve al inicio, porque nada se guarda en disco.

## Ejecutar

Requiere Node.js 22.13 o posterior para Expo SDK 57.

```bash
npm install
npm start
```

Después, escanea el QR con Expo Go o pulsa `a`, `i` o `w` para abrir Android, iOS o web.

Comandos directos:

```bash
npm run android
npm run ios
npm run web
npm run typecheck
```

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
