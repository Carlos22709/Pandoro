# Instrucciones para agentes

Este archivo lo leen los agentes de IA que usa el equipo (Claude Code, Codex, Cursor, Copilot, Gemini CLI…). `CLAUDE.md` y `GEMINI.md` solo lo importan: cualquier cambio se hace aquí.

Antes de trabajar, lee [`docs/CONTEXTO.md`](docs/CONTEXTO.md): qué es el producto, sus restricciones, el alcance del MVP, quién es responsable de qué y las decisiones ya tomadas. Si la tarea toca datos, autenticación, IA, voz, recordatorios o despliegue, lee también [`docs/arquitectura.md`](docs/arquitectura.md).

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

### 4. Privacidad (lo exige la norma)

Pandask está sujeta a la Ley 1581 de 2012 y a los lineamientos de la SIC sobre IA. El detalle está en [`docs/CONTEXTO.md`](docs/CONTEXTO.md#marco-normativo). En código, eso significa:

- No guardes el texto libre, la transcripción ni el audio de lo que dice el usuario, ni en la base de datos ni en registros de errores. Solo se guardan tareas y planes aprobados.
- Al modelo de IA envía solo lo necesario para planificar. Nunca el nombre, el correo ni el identificador del usuario.
- Las casillas de autorización nunca vienen marcadas. Cada autorización guarda su versión y su fecha.
- Los datos de estrés o bienestar solo se piden con una autorización aparte y opcional. La app debe funcionar completa sin ella.
- Lo que propone la IA se muestra como **"sugerencia de Pandoro"**, editable, nunca como un dato exacto o definitivo.
- Cada usuario accede únicamente a sus propios datos.

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

Revisa el `README.md` de la rama en la que trabajas; cambia a medida que se integran tareas. Al 11 de noviembre de 2026, en `main`:

- El registro y el inicio de sesión funcionan con Firebase Authentication. El registro exige aceptar el consentimiento de datos.
- «Hablar» y «Nueva tarea» usan Gemini por texto, permiten editar la sugerencia y solo guardan las tareas que el usuario confirma. Todavía no hay entrada de voz.
- Tareas, progreso y preferencias se guardan por usuario en Firestore. La conversación y el borrador del plan permanecen solo en memoria.

## Convenciones

- Textos visibles para el usuario: en español.
- Código: sigue el estilo del archivo que tocas (nombres, densidad de comentarios, estructura).
- Commits: un emoji de [gitmoji](https://gitmoji.dev) más una frase corta en imperativo, como en el historial (`✨ Add …`, `💄 Refine …`, `📝 Document …`).
- Ramas: cada integrante trabaja en su rama (`<nombre>-cambios`) y llega a `main` mediante un pull request.
