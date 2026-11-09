import AsyncStorage from '@react-native-async-storage/async-storage';

// Dónde vio el usuario a Pandoro por última vez en la pestaña Progreso. Con eso, al volver, se le ve
// caminar desde ahí hasta donde está ahora (aunque la app se haya cerrado entre una visita y otra).
// Se guarda solo en el dispositivo y son dos números: el lugar y la posición en el sendero.
export type SeenPosition = { stage: number; t: number };

const keyOf = (uid: string) => `pandask.pandaSeen.${uid}`;
const cache = new Map<string, SeenPosition | null>();

function parse(raw: string | null): SeenPosition | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<SeenPosition>;
    return typeof value.stage === 'number' && typeof value.t === 'number' && value.t >= 0 && value.t <= 1
      ? { stage: value.stage, t: value.t }
      : null;
  } catch {
    return null;
  }
}

// undefined = todavía no se ha leído del dispositivo; null = leído y no hay nada guardado.
export function peekSeen(uid: string) {
  return cache.get(uid);
}

export async function loadSeen(uid: string) {
  if (cache.has(uid)) return cache.get(uid) ?? null;
  let stored: SeenPosition | null = null;
  try {
    stored = parse(await AsyncStorage.getItem(keyOf(uid)));
  } catch {
    stored = null;
  }
  // Si mientras tanto se guardó una posición nueva, esa manda.
  if (!cache.has(uid)) cache.set(uid, stored);
  return cache.get(uid) ?? null;
}

export function saveSeen(uid: string, position: SeenPosition) {
  cache.set(uid, position);
  AsyncStorage.setItem(keyOf(uid), JSON.stringify(position)).catch(() => undefined);
}

// Ajustes → Reiniciar demo: Pandoro vuelve a empezar y no se compara con una visita anterior.
export function clearSeen(uid: string) {
  cache.set(uid, null);
  AsyncStorage.removeItem(keyOf(uid)).catch(() => undefined);
}
