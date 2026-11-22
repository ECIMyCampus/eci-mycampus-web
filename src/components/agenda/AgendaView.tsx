'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiRequestError, api } from '../../lib/api';
import { withReturnTo } from '../../lib/auth/redirect';
import { PlaceIndex, buildPlaceIndex } from '../../lib/radar/radar-service';
import { canCancel, isOngoing, splitAgenda } from '../../lib/registrations/agenda';
import { useRegistrations } from '../../lib/registrations/registrations';
import { useSession } from '../../lib/session/session';
import { formatEventDate, formatEventTime } from '../../lib/utils';
import { EventRegistration } from '../../types';
import { Manchas } from '../brand/Manchas';
import { CancelRegistration } from '../events/CancelRegistration';
import { Button } from '../ui/Button';
import { EmptyState, Skeleton } from '../ui/Card';

const STATUS_LABELS: Record<EventRegistration['status'], string> = {
  CONFIRMADA: 'Terminó',
  CANCELADA: 'Cancelada',
  ASISTIO: 'Asististe',
};

function AgendaSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-5 w-24" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

interface RowProps {
  item: EventRegistration;
  places: PlaceIndex;
  past?: boolean;
  busy?: boolean;
  onCancel?: (eventId: string) => void;
}

function AgendaRow({ item, places, past = false, busy = false, onCancel }: RowProps) {
  const ongoing = !past && isOngoing(item);
  const where = [item.buildingId ? places[item.buildingId]?.name : undefined, item.specificLocation].filter(Boolean).join(' · ');

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="w-28 flex-shrink-0 text-sm tabular-nums">
        {past && item.startTime ? (
          <p className="text-ink-muted">{formatEventDate(item.startTime)}</p>
        ) : null}
        {item.startTime && (
          <p className={past ? 'text-ink-subtle' : 'font-semibold text-ink'}>{formatEventTime(item.startTime)}</p>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className={`text-base font-semibold leading-snug [overflow-wrap:anywhere] ${past ? 'text-ink-muted' : 'text-ink'}`}>
          <Link href={`/eventos/${item.eventId}`} className="rounded-control transition-colors duration-fast ease-out hover:text-accent-ink">
            {item.eventTitle ?? 'Actividad'}
          </Link>
        </h3>
        {where && <p className="mt-0.5 text-sm text-ink-muted [overflow-wrap:anywhere]">{where}</p>}
      </div>

      <div className="flex flex-shrink-0 items-center gap-3 text-xs sm:justify-end">
        {past ? (
          <span className="text-ink-subtle">{STATUS_LABELS[item.status]}</span>
        ) : (
          <>
            {ongoing && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-live">
                <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden="true" />
                En curso
              </span>
            )}
            {onCancel && canCancel(item.startTime) && (
              <CancelRegistration busy={busy} title={item.eventTitle} onConfirm={() => onCancel(item.eventId)} />
            )}
          </>
        )}
      </div>
    </li>
  );
}

/** Agenda de la persona: lo que viene, agrupado por día, y debajo el historial. Sin sesión lleva a iniciar sesión. */
export function AgendaView() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { status, items, cancel, reload } = useRegistrations();
  const [places, setPlaces] = useState<PlaceIndex>({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'anonymous') router.replace(withReturnTo('/login', '/mis-eventos'));
  }, [sessionStatus, router]);

  // Los nombres de los lugares son un complemento: si fallan, se muestra solo la ubicación específica.
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getBuildings().catch(() => []), api.getSportsFacilities().catch(() => [])]).then(
      ([buildings, sports]) => !cancelled && setPlaces(buildPlaceIndex(buildings, sports)),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const agenda = useMemo(() => splitAgenda(items), [items]);

  const onCancel = async (eventId: string) => {
    setCancellingId(eventId);
    try {
      await cancel(eventId);
      toast.success('Cancelaste tu inscripción. El cupo volvió a la actividad.');
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'No pudimos cancelar. Inténtalo de nuevo.');
    } finally {
      setCancellingId(null);
    }
  };

  const waiting = sessionStatus !== 'authenticated' || status === 'idle' || (status === 'loading' && items.length === 0);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12">
      <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Mi agenda</h1>

      <div className="mt-8">
        {waiting ? (
          <AgendaSkeleton />
        ) : status === 'error' ? (
          <EmptyState
            role="alert"
            icon={<Manchas pose="error-manos-cabeza" className="h-32" />}
            title="No pudimos cargar tu agenda"
            description="Revisa tu conexión e inténtalo de nuevo."
            action={
              <Button variant="secondary" size="sm" onClick={() => void reload()}>
                Reintentar
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Manchas pose="calendario" className="h-32" />}
            title="Aún no tienes actividades"
            description="Cuando te inscribas a una, la verás aquí con su hora y lugar."
            action={
              <Button href="/" size="sm">
                Ver el radar
              </Button>
            }
          />
        ) : (
          <div className="space-y-10">
            {agenda.upcoming.length === 0 ? (
              <p className="text-sm text-ink-muted">No tienes actividades próximas.</p>
            ) : (
              agenda.upcoming.map((day) => (
                <section key={day.key} aria-labelledby={`dia-${day.key}`}>
                  <h2 id={`dia-${day.key}`} className="text-sm font-semibold text-ink">
                    {day.label}
                  </h2>
                  <ul className="mt-1 divide-y divide-line">
                    {day.items.map((item) => (
                      <AgendaRow key={item.id} item={item} places={places} busy={cancellingId === item.eventId} onCancel={onCancel} />
                    ))}
                  </ul>
                </section>
              ))
            )}

            {agenda.history.length > 0 && (
              <section aria-labelledby="historial-title">
                <h2 id="historial-title" className="text-sm font-semibold text-ink-muted">
                  Historial
                </h2>
                <ul className="mt-1 divide-y divide-line">
                  {agenda.history.map((item) => (
                    <AgendaRow key={item.id} item={item} places={places} past />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
