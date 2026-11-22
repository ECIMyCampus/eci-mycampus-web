'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ApiRequestError, api } from '../../lib/api';
import { withReturnTo } from '../../lib/auth/redirect';
import { isLiveEvent } from '../../lib/map/map-service';
import { CATEGORY_LABELS, capacityLabel, priceLabel } from '../../lib/radar/radar-service';
import { canCancel } from '../../lib/registrations/agenda';
import { useRegistrations } from '../../lib/registrations/registrations';
import { useSession } from '../../lib/session/session';
import { formatEventTime } from '../../lib/utils';
import { CampusEvent } from '../../types';
import { Manchas } from '../brand/Manchas';
import { Button } from '../ui/Button';
import { Card, EmptyState, Skeleton } from '../ui/Card';
import { Badge } from '../ui/Chip';
import { CancelRegistration } from './CancelRegistration';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; event: CampusEvent }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string };

const MODALITY_LABELS: Record<string, string> = { PRESENCIAL: 'Presencial', VIRTUAL: 'Virtual', HIBRIDA: 'Híbrida' };
const ACCESS_LABELS: Record<string, string> = {
  LIBRE: 'Libre',
  REGISTRO_PREVIO: 'Con inscripción previa',
  EXCLUSIVO_FACULTAD: 'Solo para una facultad',
};

const longDate = (iso: string) => {
  const label = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6" aria-busy="true">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-10 w-3/4" />
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/** Detalle de una actividad: qué es, cuándo y dónde, y lo que se puede hacer (inscribirse, cancelar). */
export function EventDetail({ id }: { id: string }) {
  const router = useRouter();
  const session = useSession();
  const registrations = useRegistrations();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    return api
      .getEvent(id)
      .then((event) => setState({ kind: 'ready', event }))
      .catch((error: unknown) => {
        if (error instanceof ApiRequestError && error.status === 404) setState({ kind: 'not-found' });
        else setState({ kind: 'error', message: error instanceof Error ? error.message : 'No pudimos cargar la actividad.' });
      });
  }, [id]);

  useEffect(() => {
    setState({ kind: 'loading' });
    void load();
  }, [load]);

  if (state.kind === 'loading') return <DetailSkeleton />;

  if (state.kind !== 'ready') {
    const missing = state.kind === 'not-found';
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <EmptyState
          role={missing ? 'status' : 'alert'}
          icon={<Manchas pose="error-manos-cabeza" className="h-32" />}
          title={missing ? 'Esta actividad no existe' : 'No pudimos cargar la actividad'}
          description={missing ? 'Puede que se haya eliminado o que el enlace esté incompleto.' : state.message}
          action={
            missing ? (
              <Button href="/" variant="secondary" size="sm">
                Ver el radar
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => { setState({ kind: 'loading' }); void load(); }}>
                Reintentar
              </Button>
            )
          }
        />
      </div>
    );
  }

  const { event } = state;
  const live = isLiveEvent(event);
  const finished = event.temporalStatus === 'FINALIZADO';
  const cancelled = event.status === 'CANCELADO';
  const registered = registrations.isRegistered(event.id);
  const capacity = event.availableCapacity;
  const hasCapacity = capacity !== null && capacity !== undefined;
  const full = hasCapacity && capacity <= 0;
  const paid = Number(event.price) > 0;
  const place = [event.buildingName, event.specificLocation].filter(Boolean).join(' · ');

  const onRegister = async () => {
    if (session.status !== 'authenticated') {
      router.push(withReturnTo('/login', `/eventos/${event.id}`));
      return;
    }
    setBusy(true);
    try {
      await registrations.register(event.id);
      toast.success('Quedaste inscrito. Lo encuentras en tu agenda.');
      await load();
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'No pudimos inscribirte. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    setBusy(true);
    try {
      await registrations.cancel(event.id);
      toast.success('Cancelaste tu inscripción. El cupo volvió a la actividad.');
      await load();
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'No pudimos cancelar. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const facts: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Cuándo',
      value: (
        <>
          {longDate(event.startTime)}
          <span className="block tabular-nums text-ink-muted">
            {formatEventTime(event.startTime)} – {formatEventTime(event.endTime)}
          </span>
        </>
      ),
    },
    { label: 'Dónde', value: place || 'Por confirmar' },
    { label: 'Costo', value: priceLabel(event.price) },
    {
      label: 'Cupos',
      value: hasCapacity ? capacityLabel(capacity) : event.requiresRegistration ? 'Sin límite' : 'Acceso libre',
    },
    ...(event.modality ? [{ label: 'Modalidad', value: MODALITY_LABELS[event.modality] ?? event.modality }] : []),
    ...(event.accessType ? [{ label: 'Acceso', value: ACCESS_LABELS[event.accessType] ?? event.accessType }] : []),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 pt-5 sm:px-6 sm:pt-8">
      <Link
        href="/"
        className="-ml-2 inline-flex min-h-9 items-center gap-1.5 rounded-control px-2 text-sm text-ink-muted transition-colors duration-fast ease-out hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Radar
      </Link>

      <header className="mt-4 max-w-3xl">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {cancelled ? (
            <span className="font-semibold text-accent-ink">Cancelada</span>
          ) : finished ? (
            <span className="font-medium text-ink-muted">Ya terminó</span>
          ) : live ? (
            <span className="inline-flex items-center gap-2 font-semibold text-live">
              <span className="h-2 w-2 rounded-full bg-live" aria-hidden="true" />
              En vivo
            </span>
          ) : null}
          <span className="text-ink-muted">{CATEGORY_LABELS[event.category] ?? event.category}</span>
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-ink [overflow-wrap:anywhere] sm:text-4xl">
          {event.title}
        </h1>
        <p className="mt-3 text-sm text-ink-muted">Organiza {event.organizerName}</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div className="order-2 space-y-6 lg:order-1">
          {cancelled && event.cancellationReason && (
            <p role="status" className="rounded-control bg-accent/15 px-4 py-3 text-sm text-accent-ink">
              Motivo de la cancelación: {event.cancellationReason}
            </p>
          )}
          <p className="max-w-prose whitespace-pre-line text-base leading-relaxed text-ink">{event.description}</p>
          {paid && event.paymentInstructions && (
            <section aria-labelledby="pago-title" className="max-w-prose space-y-1">
              <h2 id="pago-title" className="text-sm font-semibold text-ink">
                Cómo pagar
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">{event.paymentInstructions}</p>
            </section>
          )}
          {event.tags && event.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Temas">
              {event.tags.map((tag) => (
                <li key={tag}>
                  <Badge>{tag}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside aria-label="Datos y reserva" className="order-1 lg:sticky lg:top-20 lg:order-2 lg:self-start">
          <Card className="space-y-5 p-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 lg:block lg:space-y-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs text-ink-subtle">{fact.label}</dt>
                  <dd className="mt-0.5 text-sm text-ink [overflow-wrap:anywhere]">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-3 pt-1">
              {cancelled || finished ? (
                <p className="text-sm text-ink-muted">
                  {cancelled ? 'Esta actividad se canceló, ya no se puede reservar.' : 'Esta actividad ya terminó.'}
                </p>
              ) : registered ? (
                <>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-live">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Estás inscrito
                  </p>
                  {canCancel(event.startTime) ? (
                    <div>
                      <CancelRegistration onConfirm={onCancel} busy={busy} title={event.title} />
                    </div>
                  ) : (
                    <p className="text-xs text-ink-muted">Ya no se puede cancelar: faltan menos de 2 horas.</p>
                  )}
                </>
              ) : full ? (
                <p className="text-sm font-semibold text-accent-ink">Aforo lleno</p>
              ) : event.requiresRegistration ? (
                <Button className="w-full" disabled={busy} onClick={onRegister}>
                  Inscribirme
                </Button>
              ) : (
                <p className="text-sm text-ink-muted">No necesitas inscribirte: llega y entra.</p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
