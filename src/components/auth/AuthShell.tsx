import React from 'react';
import Image from 'next/image';
import { Wordmark } from '../brand/Wordmark';
import { ManchasBubble } from '../brand/ManchasBubble';
import { cn } from '../../lib/utils';
import { manchasOutlineClass, manchasSize, manchasSrc } from '../../lib/brand/manchas';

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  /** Letra pequeña al final de la columna: ayuda, tratamiento de datos. */
  fineprint?: React.ReactNode;
}

/**
 * Marco de la pantalla de acceso, partido en dos mitades: el formulario a la izquierda y el
 * contorno animado del edificio E a la derecha. En celular la animación pasa arriba, como banda corta.
 * Ocupa toda la pantalla, sin las barras de navegación.
 */
export function AuthShell({ title, description, children, fineprint }: AuthShellProps) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-canvas lg:overflow-hidden">
      <div className="grid min-h-full lg:h-full lg:grid-cols-2">
        <section className="relative order-2 flex flex-col justify-start px-4 pb-36 pt-8 sm:px-12 lg:order-1 lg:overflow-y-auto lg:py-12">
          <div className="mx-auto w-full max-w-md lg:my-auto">
            <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-muted">{description}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-12 flex justify-center">
              <Image
                src="/brand/logo-eci-blanco.png"
                alt="Escuela Colombiana de Ingeniería Julio Garavito"
                width={485}
                height={246}
                priority
                className="h-auto w-28 opacity-70"
              />
            </div>
            {fineprint && <div className="mt-4 space-y-1 text-center text-xs leading-relaxed text-ink-muted">{fineprint}</div>}
          </div>
          <Image
            src={manchasSrc('saludo-1')}
            alt=""
            aria-hidden="true"
            width={manchasSize('saludo-1').width}
            height={manchasSize('saludo-1').height}
            className={cn(manchasOutlineClass, 'mascot-rise pointer-events-none absolute bottom-0 right-4 h-28 w-auto select-none sm:fixed sm:right-10 lg:hidden')}
          />
        </section>

        <aside className="relative isolate order-1 flex h-44 items-center justify-center overflow-hidden border-b border-line lg:order-2 lg:h-auto lg:border-b-0 lg:border-l">
          {/* Dibujo de líneas del edificio E, en blanco, con una luz que lo recorre. */}
          <div aria-hidden="true" className="led-outline -z-20" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-canvas/30 via-canvas/50 to-canvas lg:bg-gradient-to-t" />
          {/* Velo oscuro detrás del logotipo: las líneas del edificio no deben cruzar las letras. */}
          <div aria-hidden="true" className="logo-scrim absolute inset-0 -z-10" />
          <div className="flex flex-col items-center text-center">
            <Wordmark background className="text-[30px] lg:text-[64px]" />
          </div>
          {/* Manchas saluda desde la esquina de esta mitad; el globo va a su lado, a media altura, lejos del logotipo. */}
          <div className="pointer-events-none absolute bottom-0 right-8 hidden items-end gap-3 lg:flex">
            <ManchasBubble className="bubble-in relative mb-[min(12vh,115px)] max-w-[13rem] rounded-2xl bg-surface-raised px-3.5 py-2.5 text-sm leading-snug text-ink after:absolute after:-right-1 after:top-1/2 after:h-3 after:w-3 after:-translate-y-1/2 after:rotate-45 after:rounded-sm after:bg-surface-raised after:content-['']" />
            <Image
              src={manchasSrc('saludo-1')}
              alt="Manchas, la mascota, saludando"
              width={manchasSize('saludo-1').width}
              height={manchasSize('saludo-1').height}
              priority
              className={cn(manchasOutlineClass, 'mascot-rise h-[min(26vh,250px)] w-auto select-none')}
            />
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
