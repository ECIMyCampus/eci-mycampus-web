'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiRequestError } from '../../lib/api';
import { safeRedirect, withReturnTo } from '../../lib/auth/redirect';
import { LoginField, fieldErrorsFromApi, validateLogin } from '../../lib/auth/validation';
import { useSession } from '../../lib/session/session';
import { Button } from '../ui/Button';
import { PasswordField, TextField } from '../ui/Field';
import { AuthShell, FormError } from './AuthShell';
import { MicrosoftButton } from './MicrosoftButton';

const FIELDS = ['email', 'password'] as const;

/** Cuenta de demostración provisional: el botón solo aparece si las dos variables están definidas (ver .env.example). */
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL;
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD;
const HAS_DEMO = Boolean(DEMO_EMAIL && DEMO_PASSWORD);

export function LoginForm() {
  const router = useRouter();
  const returnTo = useSearchParams().get('volver');
  const { status, login } = useSession();

  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState<Partial<Record<LoginField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Partial<Record<LoginField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Quien ya tiene sesión no necesita esta pantalla.
  useEffect(() => {
    if (status === 'authenticated' && !submitting) router.replace(safeRedirect(returnTo));
  }, [status, submitting, router, returnTo]);

  const clientErrors = validateLogin(values);
  const errorFor = (field: LoginField) =>
    serverErrors[field] ?? (touched[field] || submitted ? clientErrors[field] : undefined);

  const update = (field: LoginField) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setServerErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };
  const blur = (field: LoginField) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(clientErrors).length > 0) {
      const first = FIELDS.find((field) => clientErrors[field]);
      // Lleva el foco al primer campo con error, para teclado y lectores de pantalla.
      if (first) document.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await login(values.email.trim(), values.password);
      router.replace(safeRedirect(returnTo));
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const fromApi = fieldErrorsFromApi(error.details, FIELDS);
        if (Object.keys(fromApi).length > 0) setServerErrors(fromApi);
        else setFormError(error.message);
      } else {
        setFormError('No pudimos iniciar sesión. Inténtalo de nuevo.');
      }
      setSubmitting(false);
    }
  };

  const onDemo = async () => {
    if (!DEMO_EMAIL || !DEMO_PASSWORD) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      router.replace(safeRedirect(returnTo));
    } catch (error) {
      setFormError(error instanceof ApiRequestError ? error.message : 'No pudimos entrar con la cuenta demo.');
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      showGuest={false}
      title="Iniciar sesión"
      description="Entra con tu cuenta para inscribirte a actividades y ver tu agenda."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link href={withReturnTo('/registro', returnTo)} className="font-medium text-accent-ink hover:text-ink">
            Crear cuenta
          </Link>
        </>
      }
    >
      <MicrosoftButton returnTo={returnTo} />
      <Button href="/" variant="secondary" className="mt-3 w-full">
        Entrar como invitado
      </Button>
      <p className="mt-2 text-center text-xs leading-relaxed text-ink-subtle">
        Como invitado puedes ver el radar y el mapa. Para inscribirte necesitas tu cuenta institucional.
      </p>
      {HAS_DEMO && (
        <Button variant="ghost" className="mt-2 w-full" disabled={submitting} onClick={onDemo}>
          {submitting ? 'Entrando…' : 'Entrar con la cuenta demo (provisional)'}
        </Button>
      )}
      <details className="group mt-5 border-t border-line pt-4" open={Boolean(formError) || submitted}>
        <summary className="cursor-pointer list-none text-center text-sm text-ink-muted hover:text-ink">
          Usar correo y contraseña
        </summary>
      <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
        <TextField
          label="Correo"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          placeholder="tu.nombre@mail.escuelaing.edu.co"
          value={values.email}
          onChange={update('email')}
          onBlur={blur('email')}
          error={errorFor('email')}
        />
        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          enterKeyHint="go"
          value={values.password}
          onChange={update('password')}
          onBlur={blur('password')}
          error={errorFor('password')}
        />
        <FormError message={formError} />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      </details>
    </AuthShell>
  );
}
