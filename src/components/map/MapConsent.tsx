'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '../ui/Card';
import { Manchas } from '../brand/Manchas';

const KEY = 'eci-map-consent';

type State = 'unknown' | 'asking' | 'granted';

/**
 * El mapa lo sirve Mapbox, un tercero que recibe datos técnicos de la conexión (como la dirección IP) en cuanto se carga.
 * Por eso no se carga solo: primero se explica y se pide un toque. La elección se recuerda en este navegador.
 */
export function MapConsent({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>('unknown');

  useEffect(() => {
    try {
      setState(window.localStorage.getItem(KEY) === '1' ? 'granted' : 'asking');
    } catch {
      setState('asking');
    }
  }, []);

  const accept = () => {
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      /* sin almacenamiento: se carga ahora y se vuelve a preguntar la próxima vez */
    }
    setState('granted');
  };

  if (state === 'granted') return <>{children}</>;
  if (state === 'unknown') return <Skeleton className="h-[28rem] w-full rounded-card" />;

  return (
    <section
      aria-labelledby="mapa-consent-title"
      className="flex min-h-[26rem] flex-col items-center justify-center gap-4 rounded-card border border-line bg-surface px-6 py-10 text-center"
    >
      <Manchas pose="esperando-sentado" className="h-32" />
      <h2 id="mapa-consent-title" className="font-program text-2xl font-bold tracking-[-0.015em] text-ink">
        Antes de cargar el mapa
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-ink-muted">
        El mapa lo dibuja Mapbox, un servicio externo. Al cargarlo, Mapbox recibe datos técnicos de tu conexión, como tu
        dirección IP. No le enviamos tus datos de cuenta.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={accept}
          className="pressable inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-semibold text-white transition-colors duration-fast ease-out hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
        >
          Cargar el mapa
        </button>
        <Link href="/privacidad#terceros" className="text-sm font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline">
          Cómo tratamos tus datos
        </Link>
      </div>
    </section>
  );
}
