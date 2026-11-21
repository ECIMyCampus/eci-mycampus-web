import React from 'react';
import Image from 'next/image';
import { Button } from '../ui/Button';

/**
 * Pantalla de entrada: el contorno del edificio E con una luz animada de fondo, el logo de la Escuela y dos caminos.
 * "Invitado" entra al radar y al mapa sin cuenta; "Iniciar sesión" lleva al formulario.
 */
export function Welcome() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-12">
      {/* Dibujo de líneas del edificio E, en rojo, con una luz que lo recorre. */}
      <div aria-hidden="true" className="led-outline -z-20" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-canvas/30 via-canvas/50 to-canvas" />

      <main className="flex w-full max-w-sm flex-col items-center text-center">
        <Image src="/brand/logo-eci-blanco.png" alt="Escuela Colombiana de Ingeniería Julio Garavito" width={485} height={246} className="h-auto w-56" priority />

        <h1 className="mt-12 text-4xl font-semibold leading-none tracking-tight text-ink">
          ECI
          <span className="block text-accent-ink">MyCampus</span>
        </h1>
        <p className="mt-4 text-sm text-ink-muted">Lo que pasa en el campus, en tiempo real.</p>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Button href="/login">Iniciar sesión</Button>
          <Button href="/" variant="secondary">
            Entrar como invitado
          </Button>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-ink-subtle">
          Como invitado puedes ver el radar y el mapa. Para inscribirte a una actividad necesitas tu cuenta institucional.
        </p>
      </main>
    </div>
  );
}
