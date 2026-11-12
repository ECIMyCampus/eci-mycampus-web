import React from 'react';
import { Hammer } from 'lucide-react';
import { Button } from './Button';
import { EmptyState } from './Card';

interface ComingSoonProps {
  title: string;
  description: string;
}

/** Página de una sección que aún no está construida: lo dice claro y ofrece una salida. */
export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="sr-only">{title}</h1>
      <EmptyState
        icon={<Hammer className="h-6 w-6" aria-hidden="true" />}
        title={`${title}: próximamente`}
        description={description}
        action={
          <Button href="/" variant="secondary" size="sm">
            Volver al radar
          </Button>
        }
      />
    </div>
  );
}
