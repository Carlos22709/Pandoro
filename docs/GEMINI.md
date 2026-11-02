# Integración con Google Gemini

Información de precios y modelos consultada el **2 de noviembre de 2026** en la documentación oficial. Cambia con frecuencia: verifícala antes de tomar decisiones.

## Configuración

1. Copia `.env.example` como `.env` (ya existe uno vacío en local; Git lo ignora).
2. Pega tu clave en `EXPO_PUBLIC_GEMINI_API_KEY`.
3. Reinicia con `npx expo start --clear`. Expo incorpora estas variables al compilar, así que no se actualizan solas.

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Sí | Clave de Google AI Studio |
| `EXPO_PUBLIC_GEMINI_MODEL` | No | Modelo; por defecto `gemini-3.5-flash-lite` |

## Modelo elegido

**`gemini-3.5-flash-lite`**, de la [Gemini API](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite).

- Es estable y Google lo recomienda para proyectos nuevos.
- Admite salidas estructuradas, de las que depende este flujo.
- Cada plan es una solicitud corta de texto, sin necesidad del razonamiento de un modelo mayor.
- Cuesta menos que `gemini-3.8-flash`. Si los planes salen flojos, se cambia con la variable de entorno, sin tocar la interfaz.

Límites del modelo: 1.048.576 tokens de entrada y 65.536 de salida por solicitud. La app limita además el texto a 4.000 caracteres y la respuesta a 12.000 tokens.

## Costos

Fuente: [precios de la Gemini API](https://ai.google.dev/gemini-api/docs/pricing). Valores en USD por millón de tokens, nivel Standard.

| Modelo | Entrada | Salida (incluye tokens de razonamiento) |
| --- | --- | --- |
| `gemini-3.5-flash-lite` (en uso) | $0,30 | $2,50 |
| `gemini-3.1-flash-lite` | $0,25 | $1,50 |
| `gemini-3.8-flash` | $0,75 hasta el 31/12/2026; $1,50 desde el 1/1/2027 | $3,75 hasta el 31/12/2026; $7,50 desde el 1/1/2027 |

- El nivel gratuito no tiene costo en entrada ni en salida, pero está sujeto a cuotas.
- Los límites dependen del modelo y del proyecto. Las cuotas reales se consultan en [Google AI Studio](https://aistudio.google.com/rate-limit).
- Superar las condiciones gratuitas o activar facturación puede generar costos.
- **Privacidad:** en el nivel gratuito, Google indica que el contenido se usa para mejorar sus productos; en el de pago, no. No escribas datos sensibles mientras uses el nivel gratuito.

## Limitaciones

- **Solicitudes:** los [límites](https://ai.google.dev/gemini-api/docs/rate-limits) se miden en solicitudes por minuto, tokens de entrada por minuto y solicitudes por día. Superar cualquiera produce un error, que la app muestra con opción de reintentar.
- **Tokens y nivel gratuito:** se aplican por proyecto, no por clave, y según el nivel de uso. La documentación no publica cifras fijas para el nivel gratuito, por lo que aquí no se citan.
- **Clave expuesta:** Google advierte que las claves incluidas en apps web o móviles pueden extraerse. Quien la obtenga puede gastar la cuota y generar cargos. Restringe la clave a la Gemini API en AI Studio y a sus orígenes en Google Cloud.
- **Backend obligatorio antes de producción:** todo el acceso está en `src/services/gemini/geminiService.ts`. Para migrar, se reemplaza `geminiGenerate` por una llamada al backend y la clave sale de la app.
- **Sin persistencia:** las tareas y el borrador viven en memoria y se pierden al cerrar la app.

## Contingencia

- **Inmediata:** la creación y edición manual de tareas no depende de Gemini. Si falla, el texto y los cambios se conservan.
- **Futura:** Groq API es una alternativa por evaluar (calidad, salidas estructuradas, cuotas y precios). No está implementada.

## Flujo

1. El usuario escribe en Nueva tarea y marca sus días y minutos disponibles; nada viene preseleccionado.
2. Gemini devuelve JSON con esquema definido, que `planContract.ts` revalida. Una fecha límite solo se acepta si puede citarse del texto del usuario.
3. La propuesta se muestra como borrador editable. Los avisos de sobrecarga, días no disponibles, fechas límite y dependencias se calculan localmente y se actualizan con cada edición, sin llamar a Gemini.
4. Las instrucciones conversacionales revisan el borrador. Lo editado a mano se conserva salvo que Gemini declare que la instrucción lo contradice, y una subtarea omitida sin declararlo se restaura.
5. Al confirmar, cada subtarea se vuelve una fila de Tareas con un id estable, por lo que no puede duplicarse.
