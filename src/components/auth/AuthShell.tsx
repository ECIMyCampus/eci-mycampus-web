import React from 'react';
import { Card } from '../ui/Card';

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  /** Enlace a la pantalla hermana ("¿No tienes cuenta?..."). */
  footer?: React.ReactNode;
}

/** Marco común de las pantallas de entrada: una columna angosta y centrada. */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
      <p className="mt-1.5 text-sm text-ink-muted">{description}</p>
      <Card className="mt-6 p-5 sm:p-6">{children}</Card>
      {footer && <p className="mt-5 text-center text-sm text-ink-muted">{footer}</p>}
    </div>
  );
}

/** Mensaje de error de la acción completa (no de un campo). Los lectores de pantalla lo anuncian. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-control border border-accent-ink/40 bg-accent/10 px-3 py-2.5 text-sm text-ink">
      {message}
    </p>
  );
}
