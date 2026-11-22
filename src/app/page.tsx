import React, { Suspense } from 'react';
import { MapPin } from 'lucide-react';
import { RadarFeed, RadarSkeleton } from '../components/radar/RadarFeed';
import { Button } from '../components/ui/Button';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
      <section className="max-w-2xl">
        <h1 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl sm:leading-[1.05]">
          ¿Qué está pasando ahora en la Escuela?
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted">
          Eventos en vivo, cupos disponibles y la ubicación de cada lugar del campus.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/mapa">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Ver el mapa
          </Button>
          <Button href="/login" variant="secondary">
            Publicar actividad
          </Button>
        </div>
      </section>

      {/* useSearchParams exige un límite de Suspense para poder prerenderizar la página. */}
      <Suspense fallback={<RadarSkeleton />}>
        <RadarFeed />
      </Suspense>
    </div>
  );
}
