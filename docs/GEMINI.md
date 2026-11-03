# Integración con Google Gemini

Información de precios y modelos consultada el **2 de noviembre de 2026** en la documentación oficial. Cambia con frecuencia: verifícala antes de tomar decisiones.

## Configuración

La app llama a Gemini a través de **Firebase AI Logic** con la Gemini Developer API (fila 17 del cronograma). La clave de Gemini la guarda Firebase; la app no tiene ninguna.

1. En la consola de Firebase, abre **AI Logic** en el proyecto `pandask-f849d`, pulsa **Comenzar** y elige **Gemini Developer API**. No vincules facturación: el proyecto debe seguir en el plan Spark. Ya está hecho; solo se repite en un proyecto nuevo.
2. Copia `.env.example` como `.env` con la configuración de Firebase (ver `docs/FIREBASE.md`).
3. Reinicia con `npx expo start --clear`. Expo incorpora estas variables al compilar, así que no se actualizan solas.

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `EXPO_PUBLIC_FIREBASE_*` | Sí | La misma configuración de Firebase del login |
| `EXPO_PUBLIC_GEMINI_MODEL` | No | Modelo; por defecto `gemini-3.5-flash-lite` |

Si AI Logic no está activado, la app lo dice y deja crear tareas a mano. Tras activarlo, Firebase puede tardar unos minutos en aceptar solicitudes.

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
- **Abuso de la cuota:** la configuración de Firebase es pública, así que cualquiera podría usar AI Logic del proyecto fuera de la app. En el plan Spark eso no genera cobros, pero puede agotar la cuota. La protección prevista es App Check y bajar el límite por usuario de AI Logic (fila 14). Ver `docs/arquitectura.md`.
- **Un solo punto de acceso:** todo pasa por `src/services/gemini/geminiService.ts`. Cambiar de proveedor solo reemplaza `geminiGenerate`.
- **Datos personales:** antes de enviar, `redactPersonalData.ts` reemplaza correos por `[correo]` y teléfonos o números de documento por `[número]`. No detecta nombres propios.
- **Sin persistencia:** las tareas y el borrador viven en memoria y se pierden al cerrar la app.

## Contingencia

- **Inmediata:** la creación y edición manual de tareas no depende de Gemini. Si falla, el texto y los cambios se conservan.
- **Futura:** Groq API es una alternativa por evaluar (calidad, salidas estructuradas, cuotas y precios). No está implementada.

## Flujo

1. El usuario escribe en Nueva tarea y marca sus días y minutos disponibles; nada viene preseleccionado.
2. Se quitan correos y números largos del texto, y la solicitud va a Gemini por Firebase AI Logic. Gemini devuelve JSON con esquema definido, que `planContract.ts` revalida. Una fecha límite solo se acepta si puede citarse del texto del usuario.
3. La propuesta se muestra como borrador editable. Los avisos de sobrecarga, días no disponibles, fechas límite y dependencias se calculan localmente y se actualizan con cada edición, sin llamar a Gemini.
4. Las instrucciones conversacionales revisan el borrador. Lo editado a mano se conserva salvo que Gemini declare que la instrucción lo contradice, y una subtarea omitida sin declararlo se restaura.
5. Al confirmar, cada subtarea se vuelve una fila de Tareas con un id estable, por lo que no puede duplicarse.
