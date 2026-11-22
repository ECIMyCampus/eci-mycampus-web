'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { ApiRequestError } from '../../lib/api';
import { withReturnTo } from '../../lib/auth/redirect';
import { isLiveEvent } from '../../lib/map/map-service';
import {
  RADAR_FILTERS,
  RadarData,
  RadarFilter,
  countLabel,
  filterEvents,
  loadRadar,
  placeName,
} from '../../lib/radar/radar-service';
import { groupRadarEvents } from '../../lib/radar/schedule';
import { useOptionalRegistrations } from '../../lib/registrations/registrations';
import { useOptionalSession } from '../../lib/session/session';
import { Manchas } from '../brand/Manchas';
import { Button } from '../ui/Button';
import { Card, EmptyState, Skeleton } from '../ui/Card';
import { Badge, Chip } from '../ui/Chip';
import { EventCard } from './EventCard';

/** Cada cuánto se vuelve a consultar el radar. */
const REFRESH_MS = 30_000;

/** Tarjetas de marcador con la forma del contenido que va a llegar. */
export function RadarSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="space-y-3 p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-5 h-9 w-full" />
        </Card>
      ))}
    </div>
  );
}

/** Radar de actividades: filtros por categoría, filtro por lugar desde la URL y lista en vivo. */
export const RadarFeed: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = useOptionalSession();
  const registrations = useOptionalRegistrations();
  const place = searchParams.get('edificio')?.trim() || null;

  const [data, setData] = useState<RadarData | null>(null);
  const [filter, setFilter] = useState<RadarFilter>('TODOS');
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  // Se recarga cada 30 s mientras la pestaña esté visible.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (document.hidden) return;
      loadRadar().then((next) => {
        if (!cancelled) setData(next);
      });
    };
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, []);

  const events = useMemo(
    () => (data ? filterEvents(data.events, data.places, { filter, place }) : []),
    [data, filter, place],
  );
  const groups = useMemo(() => groupRadarEvents(events), [events]);
  const liveCount = useMemo(() => (data ? data.events.filter(isLiveEvent).length : 0), [data]);
  const placeLabel = place ? (data?.places[place]?.name ?? place) : null;

  /** Un toque reserva el cupo; sin sesión lleva a iniciar sesión y regresa al radar. */
  const handleRegister = useCallback(
    async (eventId: string) => {
      if (!registrations) return;
      if (session?.status !== 'authenticated') {
        router.push(withReturnTo('/login', '/'));
        return;
      }
      setRegisteringId(eventId);
      try {
        await registrations.register(eventId);
        toast.success('Quedaste inscrito. Lo encuentras en tu agenda.');
        // El cupo restante cambió: se vuelve a pedir el radar para que el contador sea el del servidor.
        loadRadar().then(setData);
      } catch (error) {
        toast.error(error instanceof ApiRequestError ? error.message : 'No pudimos inscribirte. Inténtalo de nuevo.');
      } finally {
        setRegisteringId(null);
      }
    },
    [registrations, session?.status, router],
  );

  return (
    <section id="radar" aria-labelledby="radar-title" className="scroll-mt-20 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="radar-title" className="text-xl font-semibold tracking-tight text-ink">
          Radar de actividades
        </h2>
        <p className="flex items-center gap-3 text-sm text-ink-muted" aria-live="polite">
          {data && liveCount > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium text-live">
              <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden="true" />
              {liveCount} en vivo ahora
            </span>
          )}
          {data && <span className="tabular-nums">{countLabel(events.length)}</span>}
          {data?.source === 'demo' && <Badge>Datos de ejemplo</Badge>}
        </p>
      </div>

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrar actividades">
        {RADAR_FILTERS.map((option) => (
          <Chip key={option.value} selected={filter === option.value} onClick={() => setFilter(option.value)}>
            {option.label}
          </Chip>
        ))}
      </div>

      {placeLabel && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          Solo en
          <Chip href="/#radar" selected className="max-w-full">
            <span className="truncate">{placeLabel}</span>
            <X className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="sr-only">Quitar filtro de lugar</span>
          </Chip>
        </p>
      )}

      {!data ? (
        <RadarSkeleton />
      ) : events.length === 0 ? (
        <EmptyState
          className="enter"
          icon={<Manchas pose="sin-resultados" className="h-32" />}
          title="No hay actividades para mostrar"
          description={
            placeLabel || filter !== 'TODOS'
              ? 'Prueba con otro filtro o mira todas las actividades del campus.'
              : 'Cuando se publique una actividad en el campus aparecerá aquí.'
          }
          action={
            (placeLabel || filter !== 'TODOS') && (
              <Button href="/#radar" variant="secondary" size="sm" onClick={() => setFilter('TODOS')}>
                Ver todas
              </Button>
            )
          }
        />
      ) : (
        <div className="enter space-y-9">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`radar-${group.key}`}>
              <h3
                id={`radar-${group.key}`}
                className={`mb-3 flex items-center gap-2 text-sm font-semibold ${group.live ? 'text-live' : 'text-ink-muted'}`}
              >
                {group.live && <span className="h-2 w-2 rounded-full bg-live" aria-hidden="true" />}
                {group.label}
              </h3>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.events.map((event) => (
                  <li key={event.id}>
                    <EventCard
                      event={event}
                      placeName={data.places[event.buildingId] ? placeName(event, data.places) : undefined}
                      onRegister={registrations ? handleRegister : undefined}
                      registered={registrations?.isRegistered(event.id) ?? false}
                      registering={registeringId === event.id}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
};
