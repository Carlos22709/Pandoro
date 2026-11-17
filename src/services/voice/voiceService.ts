import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import type { ExpoSpeechRecognitionErrorCode, ExpoSpeechRecognitionModule as SpeechModule } from 'expo-speech-recognition';

// Única puerta hacia el reconocimiento de voz (arquitectura, regla 6). El audio nunca se guarda:
// el texto transcrito vuelve a la pantalla y solo existe en su estado, igual que lo escrito.

type Module = typeof SpeechModule;

export type DictationHandlers = {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onEnd: () => void;
  onError: (message: string) => void;
};

const ERROR_MESSAGES: Partial<Record<ExpoSpeechRecognitionErrorCode, string>> = {
  'not-allowed': 'Necesito permiso del micrófono para escucharte. Puedes activarlo en los ajustes del teléfono.',
  'no-speech': 'No te escuché. Mantén pulsado el botón mientras hablas.',
  'speech-timeout': 'No te escuché. Mantén pulsado el botón mientras hablas.',
  'audio-capture': 'No pude usar el micrófono. Revisa que ninguna otra app lo esté usando.',
  network: 'Sin conexión no puedo transcribir tu voz. Puedes escribirme.',
  'language-not-supported': 'Tu teléfono no reconoce voz en español. Puedes escribirme.',
  'service-not-allowed': 'Tu teléfono no tiene un servicio de voz disponible. Puedes escribirme.',
  busy: 'El reconocimiento de voz está ocupado. Intenta de nuevo en un momento.',
};

const FALLBACK_ERROR = 'No pude entender el audio. Intenta de nuevo o escríbeme.';

// En la web, Chrome envía el audio a Google para transcribirlo. Hasta que se decida el punto
// abierto de voz (fila 34, Andrea), solo se activa allí con EXPO_PUBLIC_VOICE_ON_WEB=true.
const WEB_ENABLED = process.env.EXPO_PUBLIC_VOICE_ON_WEB === 'true';

let cached: Module | null | undefined;
// Si el reconocimiento en el dispositivo falla (por ejemplo, sin el paquete de español descargado),
// los siguientes dictados usan el servicio de voz del sistema.
let onDeviceFailed = false;
let usingOnDevice = false;

// Expo Go no incluye el módulo nativo y la librería falla al importarse sin él,
// así que se carga solo si existe. Sin él, la voz se oculta y queda la entrada escrita.
function getModule(): Module | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web' ? !WEB_ENABLED : !requireOptionalNativeModule('ExpoSpeechRecognition')) {
    cached = null;
    return cached;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  cached = (require('expo-speech-recognition') as typeof import('expo-speech-recognition')).ExpoSpeechRecognitionModule;
  return cached;
}

export function isVoiceAvailable() {
  const module = getModule();
  return Boolean(module?.isRecognitionAvailable());
}

export function listenToDictation(handlers: DictationHandlers) {
  const module = getModule();
  if (!module) return () => undefined;

  const subscriptions = [
    module.addListener('result', (event) => {
      const text = event.results[0]?.transcript.trim() ?? '';
      if (event.isFinal) {
        if (text) handlers.onFinal(text);
      } else {
        handlers.onPartial(text);
      }
    }),
    module.addListener('end', handlers.onEnd),
    module.addListener('error', (event) => {
      // «aborted» es una cancelación propia, no un fallo que mostrar.
      if (event.error === 'aborted') return;
      if (event.error === 'language-not-supported' && usingOnDevice) {
        onDeviceFailed = true;
        handlers.onError('Ajusté el reconocimiento de voz. Mantén pulsado de nuevo para hablar.');
        return;
      }
      handlers.onError(ERROR_MESSAGES[event.error] ?? FALLBACK_ERROR);
    }),
  ];
  return () => subscriptions.forEach((subscription) => subscription.remove());
}

export async function startDictation() {
  const module = getModule();
  if (!module) throw new Error(FALLBACK_ERROR);
  if (Platform.OS !== 'web') {
    const { granted } = await module.requestPermissionsAsync();
    if (!granted) throw new Error(ERROR_MESSAGES['not-allowed']);
  }
  usingOnDevice = !onDeviceFailed && module.supportsOnDeviceRecognition();
  module.start({
    lang: 'es-CO',
    interimResults: true,
    continuous: true,
    // Si el teléfono lo admite, el audio se transcribe sin salir del dispositivo.
    requiresOnDeviceRecognition: usingOnDevice,
    addsPunctuation: true,
  });
}

export function stopDictation() {
  getModule()?.stop();
}

export function cancelDictation() {
  getModule()?.abort();
}
