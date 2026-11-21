import React from 'react';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Wordmark } from '../brand/Wordmark';

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  /** Enlace a la pantalla hermana ("¿No tienes cuenta?..."). */
  footer?: React.ReactNode;
  /** Muestra al pie el acceso de invitado (la pantalla de entrada lo pone dentro de la tarjeta). */
  showGuest?: boolean;
}

/**
 * Marco común de las pantallas de entrada, partido en dos mitades: el formulario a la izquierda y el
 * contorno animado del edificio E a la derecha. En celular la animación pasa arriba, como banda corta.
 * Ocupa toda la pantalla, sin las barras de navegación.
 */
export function AuthShell({ title, description, children, footer, showGuest = true }: AuthShellProps) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-canvas lg:overflow-hidden">
      <div className="grid min-h-full lg:h-full lg:grid-cols-2">
        <section className="order-2 flex flex-col justify-start px-4 py-8 sm:px-12 lg:order-1 lg:justify-center lg:overflow-y-auto lg:py-12">
          <div className="mx-auto w-full max-w-md">
            <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-muted">{description}</p>
            <Card className="mt-6 p-5 sm:p-6">{children}</Card>
            {footer && <p className="mt-5 text-center text-sm text-ink-muted">{footer}</p>}
            {showGuest && (
            <div className="mt-6 border-t border-line pt-6 text-center">
              <Button href="/" variant="ghost" className="w-full">
                Entrar como invitado
              </Button>
              <p className="mt-2 text-xs leading-relaxed text-ink-subtle">
                Como invitado puedes ver el radar y el mapa. Para inscribirte necesitas tu cuenta institucional.
              </p>
            </div>
            )}
            <div className="mt-10 flex justify-center">
              <Image
                src="/brand/logo-eci-blanco.png"
                alt="Escuela Colombiana de Ingeniería Julio Garavito"
                width={485}
                height={246}
                priority
                className="h-auto w-36 opacity-80"
              />
            </div>
          </div>
        </section>

        <aside className="relative isolate order-1 flex h-44 items-center justify-center overflow-hidden border-b border-line lg:order-2 lg:h-auto lg:border-b-0 lg:border-l">
          {/* Dibujo de líneas del edificio E, en blanco, con una luz que lo recorre. */}
          <div aria-hidden="true" className="led-outline -z-20" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-canvas/30 via-canvas/50 to-canvas lg:bg-gradient-to-t" />
          <div className="flex flex-col items-center text-center">
            <Wordmark background className="text-[30px] lg:text-[64px]" />
          </div>
        </aside>
      </div>
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
