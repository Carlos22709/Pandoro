# Revisión de consistencia de interfaz (fila 7)

Revisión estática del código de todas las pantallas (`src/screens/*`) y sus componentes. No se revisó en dispositivo ni en navegador.

## Qué se revisó

| Aspecto | Criterio | Resultado |
| --- | --- | --- |
| Colores | Usar `palette` y `ui.surface`; evitar valores sueltos repetidos | Casi todo usa tokens. Quedaban fondos de tarjeta `rgba(255, 252, 247, 0.9)` repetidos en 4 archivos y un borde suelto en `SpeechBubble`. |
| Tipografía | Familias `fonts.*` y `typeScale`, nunca `fontWeight` | Correcto en todas las pantallas. |
| Espaciado y radios | `ui.space`, `ui.radius`, `ui.size.touch` (44 px) | Correcto en lo nuevo; algunos valores numéricos sueltos en ilustraciones (aceptable). |
| Textos | Español, tono cercano, concordancia | Había «tarea(s)» y «subtarea(s)». |
| Nombres | Pandask es la app; Pandoro es la mascota (AGENTS.md) | La bienvenida mostraba «PANDORO» como título de la app y `app.json` tenía `name: "Pandoro"`. |
| Salida de la IA | Siempre «Sugerencia de Pandoro» editable | Nueva tarea decía «Propuesta de Pandoro». |

## Qué se corrigió

- Bienvenida: el título ahora es «PANDASK». `app.json` muestra «Pandask» (el `slug` sigue en `pandoro` para no romper builds).
- Nueva tarea: la etiqueta dice «Sugerencia de Pandoro · aún no está en tus tareas», igual que en Hablar.
- Concordancia: `src/utils/plural.ts` reemplaza «tarea(s)» y «subtarea(s)» en Hablar y Nueva tarea (con prueba).
- Nuevo token `ui.surface.card` para el fondo de tarjeta; lo usan Nueva tarea, Hablar, `ProgressWidget` y `ScreenPlaceholder`. `SpeechBubble` usa `ui.surface.border`.

## Pendiente (no se tocó a propósito)

- Ajustes y Perfil tienen su propia paleta clara/oscura (`SettingsScreen.tsx`); unificarla con el tema requiere decidir el modo oscuro global.
- Colores de las ilustraciones (camino de progreso, mundo) son parte del arte, no de la interfaz.
- Componentes y repositorio conservan el nombre «Pandoro» por decisión del equipo.
