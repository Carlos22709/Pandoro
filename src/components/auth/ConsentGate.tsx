import { useEffect, useState } from 'react';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { ConsentCheckbox } from '@/components/auth/ConsentCheckbox';
import { saveConsent, watchConsent } from '@/services/data/userRepository';

export type ConsentStatus = 'checking' | 'given' | 'missing';

// Ley 1581: una cuenta sin constancia de autorización no entra a la app. Pasa con cuentas creadas
// antes de guardar la constancia o si el registro se cortó a mitad.
export function useConsentStatus(uid: string | null): ConsentStatus {
  const [status, setStatus] = useState<ConsentStatus>('checking');

  useEffect(() => {
    setStatus('checking');
    if (!uid) return;
    return watchConsent(
      uid,
      (given) => setStatus(given ? 'given' : 'missing'),
      // Si no se puede comprobar (por ejemplo, sin conexión), no se bloquea a quien ya se registró:
      // el registro siempre guarda la constancia antes de entrar.
      (error) => {
        console.warn('No se pudo comprobar el consentimiento.', error.message);
        setStatus('given');
      },
    );
  }, [uid]);

  return status;
}

export function ConsentGate() {
  const { user, signOut } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al guardarse, useConsentStatus recibe la constancia y _layout deja pasar a la app.
  const accept = async () => {
    if (!accepted) {
      setTriedSubmit(true);
      return;
    }
    if (!user || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveConsent(user.uid);
    } catch {
      setError('No pudimos guardar tu autorización. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout
      tone="blue"
      title="Antes de seguir"
      subtitle="Para usar Pandask necesitamos tu autorización para tratar tus datos."
      submitLabel="Aceptar y continuar"
      onSubmit={accept}
      submitting={saving}
      error={error}
      switchPrompt="¿Prefieres no continuar?"
      switchLabel="Cerrar sesión"
      onSwitch={() => { void signOut(); }}
    >
      <ConsentCheckbox checked={accepted} onChange={setAccepted} showError={triedSubmit} />
    </AuthLayout>
  );
}
