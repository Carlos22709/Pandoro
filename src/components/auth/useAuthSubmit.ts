import { useCallback, useRef, useState } from 'react';

type SubmitOptions = {
  problem?: string | null;
  action: () => Promise<void>;
  successNotice?: string;
};

// Una sola solicitud a la vez. El candado es una ref porque el estado no se
// actualiza a tiempo si se pulsa dos veces seguidas.
export function useAuthSubmit() {
  const locked = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = useCallback(async ({ problem, action, successNotice }: SubmitOptions) => {
    if (locked.current) return;
    setNotice(null);
    setError(problem ?? null);
    if (problem) return;

    locked.current = true;
    setSubmitting(true);
    try {
      await action();
      setNotice(successNotice ?? null);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      locked.current = false;
      setSubmitting(false);
    }
  }, []);

  return { submit, submitting, error, notice };
}
