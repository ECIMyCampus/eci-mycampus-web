import React, { Suspense } from 'react';
import { MapPin } from 'lucide-react';
import { LivingBackground } from '../components/brand/LivingBackground';
import { RadarFeed, RadarSkeleton } from '../components/radar/RadarFeed';
import { Button } from '../components/ui/Button';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 pb-12 pt-8 sm:px-6 sm:pt-14">
      <LivingBackground />

      <section className="max-w-3xl">
        <h1 className="text-balance font-program text-4xl font-bold leading-[1.04] tracking-[-0.025em] text-ink sm:text-6xl">
          ¿Qué está pasando ahora en la Escuela?
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
          Eventos en vivo, cupos disponibles y la ubicación de cada lugar del campus.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
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
