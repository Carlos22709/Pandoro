# Instrucciones para agentes

Este archivo lo leen los agentes de IA que usa el equipo (Claude Code, Codex, Cursor, Copilot, Gemini CLI…). `CLAUDE.md` y `GEMINI.md` solo lo importan: cualquier cambio se hace aquí.

Antes de trabajar, lee [`docs/CONTEXTO.md`](docs/CONTEXTO.md): qué es el producto, sus restricciones, el alcance del MVP, quién es responsable de qué y las decisiones ya tomadas.

## Proyecto

- **Pandask** es el nombre oficial de la app. **Pandoro** es el nombre del panda (la mascota).
- El repositorio, el paquete y algunos componentes (`Pandoro.tsx`, `PandoroHead.tsx`, `PandoroBrandMark.tsx`) conservan el nombre anterior. No los renombres salvo que te lo pidan; en textos nuevos para el usuario, la app se llama Pandask.
- Proyecto Capstone de la Universidad de La Sabana (2026), hecho por cuatro estudiantes: Andrea Sosa, Esteban Forero, Santiago Lozano y Carlos Sánchez. Entrega final: 16 de noviembre de 2026.

## Reglas de trabajo

### 1. El orden es el del cronograma

El equipo trabaja en el orden del cronograma (Excel del equipo), por fecha objetivo. La lista está en [`docs/CONTEXTO.md`](docs/CONTEXTO.md#cronograma). Una tarea con fecha posterior no se adelanta si depende de una anterior que sigue pendiente. Si te piden algo fuera de ese orden, dilo antes de empezar.

### 2. Coherencia antes que velocidad

Pandask lo construyen cuatro personas, cada una con sus tareas.

- Antes de crear algo, busca si ya existe en `src/` o `docs/` y reutiliza sus convenciones: paleta, tipografía, tipos y nombres.
- Si lo que te piden depende de la tarea de otro integrante, confirma primero que esa parte esté hecha y dónde está (rama y documento). Si no está, está incompleta o es ambigua, **detente y pregunta**. No inventes la parte de otro para poder avanzar; si hay que seguir, marca explícitamente lo que queda "por confirmar" y quién debe confirmarlo.
- Si un cambio contradice `docs/CONTEXTO.md` o una decisión registrada allí, señálalo antes de seguir.
- El estado de cada tarea (pendiente o completada) vive en el Excel, que no puedes leer. Si necesitas saberlo, pregúntale a quien te está usando.

### 3. Secretos

- Nunca subas claves ni archivos `.env`. Las variables nuevas se documentan en `.env.example` sin valor.
- Todo lo que empieza por `EXPO_PUBLIC_` queda dentro del paquete de la app y puede extraerse. No lo trates como secreto.

## Stack

- React Native + Expo + TypeScript, con Expo Router (rutas por archivo en `src/app/`).
- Arte en SVG nativo con `react-native-svg` (`src/components/art/`), sin imágenes externas.
- Animaciones con `react-native-reanimated` y `react-native-worklets`.
- Tema centralizado: colores en `src/theme/palette.ts`, tipografía en `src/theme/typography.ts` (Fraunces para títulos y lo que dice Pandoro, Figtree para el resto; cada peso es una familia, así que se usa `fontFamily`, no `fontWeight`), tokens en `src/theme/ui.ts`.
- Pantallas en `src/screens/`, componentes agrupados por dominio en `src/components/`.
- Referencias de Figma exportadas en `design/figma/`.

Requiere Node.js 22.13 o posterior.

```bash
npm install
npm start            # Expo; luego a / i / w para Android, iOS o web
npm run typecheck    # siempre antes de dar algo por terminado
npm test             # cuando la rama tenga la carpeta tests/
```

## Qué es real y qué está simulado

Revisa el `README.md` de la rama en la que trabajas; cambia a medida que se integran tareas. Al 2 de noviembre de 2026, en `main`:

- El acceso (inicio de sesión y registro) es solo visual. El registro pide aceptar el consentimiento de datos.
- La conversación de «Hablar» y el plan que propone siguen un guion fijo (`src/demo/demoScript.ts`). No hay micrófono ni IA.
- Tareas y progreso viven en memoria (`src/demo/`) y se pierden al cerrar la app.

La rama `santiago-cambios` agrega la generación del plan con Gemini, pero todavía no está integrada en `main`.

## Convenciones

- Textos visibles para el usuario: en español.
- Código: sigue el estilo del archivo que tocas (nombres, densidad de comentarios, estructura).
- Commits: un emoji de [gitmoji](https://gitmoji.dev) más una frase corta en imperativo, como en el historial (`✨ Add …`, `💄 Refine …`, `📝 Document …`).
- Ramas: cada integrante trabaja en su rama (`<nombre>-cambios`) y llega a `main` mediante un pull request.
