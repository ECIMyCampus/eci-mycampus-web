'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiRequestError, api } from '../../lib/api';
import { safeRedirect, withReturnTo } from '../../lib/auth/redirect';
import { RegisterField, RegisterValues, fieldErrorsFromApi, validateRegister } from '../../lib/auth/validation';
import { useSession } from '../../lib/session/session';
import { Faculty } from '../../types';
import { Button } from '../ui/Button';
import { CheckboxField, PasswordField, SelectField, TextField } from '../ui/Field';
import { AuthShell, FormError } from './AuthShell';

const FIELDS = ['fullName', 'email', 'password', 'academicProgram', 'habeasDataAccepted'] as const;

const EMPTY: RegisterValues = { fullName: '', email: '', password: '', academicProgram: '', habeasDataAccepted: false };

export function RegisterForm() {
  const router = useRouter();
  const returnTo = useSearchParams().get('volver');
  const { status, register } = useSession();

  const [values, setValues] = useState<RegisterValues>(EMPTY);
  const [facultyId, setFacultyId] = useState('');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [touched, setTouched] = useState<Partial<Record<RegisterField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Partial<Record<RegisterField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // La facultad es opcional: si la lista no carga, el formulario funciona igual sin ese campo.
  useEffect(() => {
    let cancelled = false;
    api
      .getFaculties()
      .then((list) => !cancelled && setFaculties(list))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && !submitting) router.replace(safeRedirect(returnTo));
  }, [status, submitting, router, returnTo]);

  const clientErrors = validateRegister(values);
  const errorFor = (field: RegisterField) =>
    serverErrors[field] ?? (touched[field] || submitted ? clientErrors[field] : undefined);

  const clear = (field: RegisterField) => {
    setServerErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };
  const text = (field: Exclude<RegisterField, 'habeasDataAccepted'>) => ({
    value: values[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      clear(field);
    },
    onBlur: () => setTouched((prev) => ({ ...prev, [field]: true })),
    error: errorFor(field),
  });

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const first = FIELDS.find((field) => clientErrors[field]);
    if (first) {
      document.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await register({
        email: values.email.trim(),
        password: values.password,
        fullName: values.fullName.trim(),
        ...(facultyId && { facultyId }),
        ...(values.academicProgram.trim() && { academicProgram: values.academicProgram.trim() }),
        habeasDataAccepted: true,
      });
      router.replace(safeRedirect(returnTo));
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const fromApi = fieldErrorsFromApi(error.details, FIELDS);
        if (Object.keys(fromApi).length > 0) setServerErrors(fromApi);
        // Correo ya registrado: el problema es ese campo, no el formulario entero.
        else if (error.status === 409) setServerErrors({ email: error.message });
        else setFormError(error.message);
      } else {
        setFormError('No pudimos crear tu cuenta. Inténtalo de nuevo.');
      }
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Crear cuenta"
      description="Usa tu correo institucional de la Escuela para entrar a MyCampus."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link href={withReturnTo('/login', returnTo)} className="font-medium text-accent-ink hover:text-ink">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <TextField
          label="Nombre completo"
          name="fullName"
          autoComplete="name"
          enterKeyHint="next"
          placeholder="Ana María Pérez"
          {...text('fullName')}
        />
        <TextField
          label="Correo institucional"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          placeholder="tu.nombre@mail.escuelaing.edu.co"
          {...text('email')}
        />
        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="new-password"
          enterKeyHint="next"
          hint="Mínimo 8 caracteres, con una mayúscula y un número."
          {...text('password')}
        />
        {faculties.length > 0 && (
          <SelectField
            label="Facultad"
            name="facultyId"
            optional
            placeholder="Elige tu facultad"
            options={faculties.map((f) => ({ value: f.id, label: f.name }))}
            value={facultyId}
            onChange={(event) => setFacultyId(event.target.value)}
          />
        )}
        <TextField
          label="Carrera o programa"
          name="academicProgram"
          optional
          autoComplete="off"
          enterKeyHint="done"
          {...text('academicProgram')}
        />
        <CheckboxField
          name="habeasDataAccepted"
          label="Acepto la política de tratamiento de datos personales (Habeas Data)."
          checked={values.habeasDataAccepted}
          onChange={(event) => {
            setValues((prev) => ({ ...prev, habeasDataAccepted: event.target.checked }));
            setTouched((prev) => ({ ...prev, habeasDataAccepted: true }));
            clear('habeasDataAccepted');
          }}
          error={errorFor('habeasDataAccepted')}
        />
        <FormError message={formError} />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthShell>
  );
}
