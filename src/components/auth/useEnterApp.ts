import { useRouter } from 'expo-router';
import { useCallback } from 'react';

// Prototipo: cualquier acción de acceso entra directamente en Inicio.
// Se vacía la pila para que "atrás" no regrese a las pantallas de acceso.
export function useEnterApp() {
  const router = useRouter();

  return useCallback(() => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/inicio');
  }, [router]);
}
