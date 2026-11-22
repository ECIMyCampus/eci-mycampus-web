'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiRequestError } from '../../lib/api';
import { safeRedirect } from '../../lib/auth/redirect';
import { useSession } from '../../lib/session/session';
import { Button } from '../ui/Button';
import { AuthShell, FormError } from './AuthShell';
import { MicrosoftButton } from './MicrosoftButton';

/** Cuenta de demostración provisional: el acceso solo aparece si las dos variables están definidas (ver .env.example). */
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL;
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD;
const HAS_DEMO = Boolean(DEMO_EMAIL && DEMO_PASSWORD);

/** Motivos con los que el backend puede devolver a la pantalla (`/login?error=...`) tras el inicio de sesión de Microsoft. */
const ACCESS_ERRORS: Record<string, string> = {
  dominio: 'Esa cuenta no es de la Escuela. Usa tu correo @mail.escuelaing.edu.co o entra como invitado.',
};
const ACCESS_ERROR_FALLBACK = 'No pudimos completar el acceso con Microsoft. Inténtalo de nuevo.';

/**
 * Pantalla de acceso. No hay registro propio: se entra con la cuenta de la Escuela (Microsoft) o como invitado.
 * La restricción al dominio de la Escuela la aplica el backend; aquí solo se muestra su respuesta.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get('volver');
  const errorCode = params.get('error');
  const { status, login } = useSession();

  const [submitting, setSubmitting] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  // Quien ya tiene sesión no necesita esta pantalla.
  useEffect(() => {
    if (status === 'authenticated' && !submitting) router.replace(safeRedirect(returnTo));
  }, [status, submitting, router, returnTo]);

  const message = demoError ?? (errorCode ? (ACCESS_ERRORS[errorCode] ?? ACCESS_ERROR_FALLBACK) : null);

  const onDemo = async () => {
    if (!DEMO_EMAIL || !DEMO_PASSWORD) return;
    setSubmitting(true);
    setDemoError(null);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      router.replace(safeRedirect(returnTo));
    } catch (error) {
      setDemoError(error instanceof ApiRequestError ? error.message : 'No pudimos entrar con la cuenta demo.');
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Acceder"
      description="Con tu cuenta de la Escuela te inscribes a actividades y ves tu agenda."
      fineprint={
        <>
          <p>¿No tienes correo de la Escuela? Entra como invitado y explora el campus.</p>
          {HAS_DEMO && (
            <button
              type="button"
              onClick={onDemo}
              disabled={submitting}
              aria-label="Entrar con la cuenta demo (provisional)"
              className="rounded px-1 text-[11px] text-ink-subtle/70 transition-colors duration-fast ease-out hover:text-ink-muted disabled:opacity-50"
            >
              acceso de pruebas
            </button>
          )}
        </>
      }
    >
      {message && (
        <div className="mb-4">
          <FormError message={message} />
        </div>
      )}
      <MicrosoftButton returnTo={returnTo} />
      <p className="mt-2 text-center text-xs text-ink-muted">Con tu correo @mail.escuelaing.edu.co</p>
      <Button href="/" variant="ghost" className="mt-5 w-full">
        Entrar como invitado
      </Button>
    </AuthShell>
  );
}
