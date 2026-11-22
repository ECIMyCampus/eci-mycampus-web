'use client';

import React from 'react';
import { Manchas } from '../components/brand/Manchas';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Card';

/** Último recurso: algo falló al dibujar la página. Ofrece reintentar sin perder la barra de navegación. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <EmptyState
        role="alert"
        icon={<Manchas pose="error-manos-cabeza" className="h-32" />}
        title="Algo salió mal"
        description="No pudimos mostrar esta página. Inténtalo de nuevo; si sigue pasando, vuelve al radar."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={reset}>
              Reintentar
            </Button>
            <Button href="/" variant="secondary" size="sm">
              Ir al radar
            </Button>
          </div>
        }
      />
    </div>
  );
}
