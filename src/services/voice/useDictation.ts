import { useCallback, useEffect, useRef, useState } from 'react';

import { cancelDictation, isVoiceAvailable, listenToDictation, startDictation, stopDictation } from './voiceService';

// Dictado para «mantén pulsado para hablar». Cada fragmento final llega por onText para que la
// pantalla lo agregue a su campo: el usuario lo revisa y lo envía como si lo hubiera escrito.
export function useDictation(onText: (text: string) => void) {
  const [available] = useState(isVoiceAvailable);
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onTextRef = useRef(onText);
  onTextRef.current = onText;
  const partialRef = useRef('');
  const pressingRef = useRef(false);

  useEffect(() => {
    if (!available) return undefined;
    const unsubscribe = listenToDictation({
      onPartial: (text) => {
        partialRef.current = text;
        setPartial(text);
      },
      onFinal: (text) => {
        partialRef.current = '';
        setPartial('');
        onTextRef.current(text);
      },
      onEnd: () => {
        // Si el reconocedor termina sin resultado final, no se pierde lo que ya se oyó.
        if (partialRef.current) onTextRef.current(partialRef.current);
        partialRef.current = '';
        setPartial('');
        setListening(false);
      },
      onError: (message) => {
        setError(message);
        setListening(false);
      },
    });
    return () => {
      unsubscribe();
      cancelDictation();
    };
  }, [available]);

  const start = useCallback(async () => {
    pressingRef.current = true;
    setError(null);
    partialRef.current = '';
    setPartial('');
    setListening(true);
    try {
      await startDictation();
      // Soltó el botón mientras se pedía el permiso.
      if (!pressingRef.current) stopDictation();
    } catch (failure) {
      setListening(false);
      setError(failure instanceof Error ? failure.message : String(failure));
    }
  }, []);

  const stop = useCallback(() => {
    pressingRef.current = false;
    stopDictation();
  }, []);

  return { available, listening, partial, error, start, stop };
}
