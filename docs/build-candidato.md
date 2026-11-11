# Candidato de build de Pandask

| | |
| --- | --- |
| **Tarea** | Fila 30 del cronograma: preparar build estable para lanzamiento |
| **Responsable** | Carlos Sánchez |
| **Fecha** | 11 de noviembre de 2026 |
| **Estado** | Build enviado a EAS; pendiente del APK, su instalación y el QA funcional de Santiago |

Este candidato no usa Docker. Expo genera la web estática y EAS Build compila el APK Android en
la nube. El código queda vinculado al proyecto `@carlos22709s-team/pandoro`, con identificador
Android `com.pandask.app`.

## Perfiles reproducibles

[`eas.json`](../eas.json) fija EAS CLI 27.7.2 y define:

- `preview`: distribución interna y APK instalable para las pruebas del equipo;
- `production`: Android App Bundle para una publicación futura, no usado en el MVP.

La versión de este candidato es `1.0.0` y su `versionCode` Android es `1`. La clave de firma fue
generada y queda administrada por EAS; no se guarda ninguna credencial en el repositorio.

Cada ejecución captura una instantánea de los archivos locales en ese momento. Los cambios futuros
en `main` no modifican un APK existente ni generan otro automáticamente; hay que actualizar la rama,
incrementar la versión Android y ejecutar de nuevo el perfil correspondiente.

## Repetir desde una instalación limpia

```bash
npm ci
npx expo install --check
npm run typecheck
npm test
npm run build:web
npm run build:android:preview
```

El archivo `.env` nunca se sube a Git. Para una compilación remota funcional, una persona con acceso
al proyecto EAS carga únicamente la configuración pública al entorno Preview:

```bash
npx --yes eas-cli@27.7.2 env:push preview --path .env --force
```

## Evidencia del 11 de noviembre

- Las dependencias coinciden con las versiones recomendadas por Expo SDK 58.
- `npx expo-doctor`: 20 comprobaciones aprobadas, ninguna incidencia detectada.
- `npm run typecheck`: correcto.
- `npm test`: 100 pruebas aprobadas, ninguna fallida.
- `npm run check:firestore`: 16 comprobaciones aprobadas contra Firebase real; las cuentas y datos
  temporales se eliminaron al finalizar.
- `npm run build:web`: exportación correcta; 67 archivos, 5.387.686 bytes.
- La exportación web respondió HTTP 200 desde un servidor estático local.
- Exportación Metro para Android: correcta; 1.820 módulos, 60 archivos, 8.104.321 bytes.
- Proyecto EAS: `4adbad44-e34e-4178-a7c6-251ff2b4096a`.
- Build Android Preview enviado a la cola de EAS:
  `ba01099b-4e4e-4d6c-af20-22a7e18cb9b6`.

Seguimiento del build:
<https://expo.dev/accounts/carlos22709s-team/projects/pandoro/builds/ba01099b-4e4e-4d6c-af20-22a7e18cb9b6>

## Comprobaciones pendientes

- Instalar el APK resultante en Android y abrirlo sin Metro ni el computador de desarrollo.
- Ejecutar el flujo funcional completo de Santiago antes de cambiar el estado de “candidato” a
  “estable”.
- `npm run test:rules` necesita Java 21; este equipo no tiene Java instalado. La comprobación contra
  Firebase real sigue disponible con `npm run check:firestore`.

## Avisos de dependencias

`npm audit --omit=dev` reporta cuatro avisos altos en `@grpc/grpc-js`, dependencia de la variante
Node de Firestore, y tres moderados en herramientas de Expo. Las correcciones automáticas propuestas
por npm requieren versiones mayores incompatibles con Expo SDK 58 o degradar Firebase, por lo que no
se aplicó `npm audit fix --force`. Deben revisarse de nuevo cuando Expo o Firebase publiquen una ruta
compatible de actualización.
