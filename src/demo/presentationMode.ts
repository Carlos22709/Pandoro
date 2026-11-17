// Herramientas de presentación (ver los seis lugares, reiniciar la demo): solo en desarrollo o en
// builds internos con EXPO_PUBLIC_PRESENTATION_MODE=true. Nunca en la versión que usan las personas.
export const PRESENTATION_MODE_AVAILABLE = (
  (typeof __DEV__ !== 'undefined' && __DEV__)
  || process.env.EXPO_PUBLIC_PRESENTATION_MODE === 'true'
);
