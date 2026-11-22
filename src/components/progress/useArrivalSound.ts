import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';

// El sonido de Pandoro al llegar a un lugar nuevo. Si no puede sonar (la web bloquea el audio sin un
// toque previo, o el dispositivo está en silencio), la celebración sigue sin sonido y sin errores.
export function useArrivalSound() {
  const player = useAudioPlayer(require('../../../assets/audio/audio-panda.mpeg'));

  return useCallback(() => {
    try {
      void player.seekTo(0).catch(() => undefined);
      player.play();
    } catch {
      // Sin sonido: no es motivo para interrumpir la animación.
    }
  }, [player]);
}
