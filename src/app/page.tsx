import React, { Suspense } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { CampusMap } from '../components/map/CampusMap';
import { RadarFeed, RadarSkeleton } from '../components/radar/RadarFeed';
import { Button } from '../components/ui/Button';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
      <section className="max-w-2xl">
        <p className="text-sm font-medium text-accent-ink">Campus ECI en tiempo real</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-ink sm:text-5xl sm:leading-[1.05]">
          ¿Qué está pasando ahora en la Escuela?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          Eventos en vivo, cupos disponibles y la ubicación de cada lugar del campus.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/mapa">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Explorar el mapa
          </Button>
          <Button href="/login" variant="secondary">
            Publicar actividad
          </Button>
        </div>
      </section>

      <section aria-labelledby="mapa-title" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="mapa-title" className="text-lg font-semibold text-ink">
            El campus en el mapa
          </h2>
          <Button href="/mapa" variant="ghost" size="sm" className="-mr-3">
            Abrir mapa
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
        <CampusMap variant="preview" />
      </section>

      {/* useSearchParams exige un límite de Suspense para poder prerenderizar la página. */}
      <Suspense fallback={<RadarSkeleton />}>
        <RadarFeed />
      </Suspense>
    </div>
  );
}
