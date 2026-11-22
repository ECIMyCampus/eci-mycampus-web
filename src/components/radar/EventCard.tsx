import React from 'react';
import Link from 'next/link';
import { Check, MapPin, Users } from 'lucide-react';
import { CampusEvent } from '../../types';
import { isLiveEvent } from '../../lib/map/map-service';
import { CATEGORY_LABELS, capacityLabel, priceLabel } from '../../lib/radar/radar-service';
import { startsInLabel } from '../../lib/radar/schedule';
import { formatEventTime } from '../../lib/utils';
import { Button } from '../ui/Button';

interface EventCardProps {
  event: CampusEvent;
  /** Nombre legible del lugar. Si falta se muestra solo la ubicación específica. */
  placeName?: string;
  onRegister?: (eventId: string) => void;
  /** La persona ya tiene un cupo vigente: en lugar del botón se muestra «Inscrito». */
  registered?: boolean;
  /** La inscripción está en camino: el botón queda desactivado para no reservar dos veces. */
  registering?: boolean;
}

/**
 * Tarjeta de una actividad: la hora manda arriba (o «En vivo» con su luz verde), luego el título en grande, el lugar y
 * lo que hace falta para inscribirse. Una actividad en vivo brilla en verde; las demás, en el gris cálido de la app.
 */
export const EventCard: React.FC<EventCardProps> = ({ event, placeName, onRegister, registered = false, registering = false }) => {
  const live = isLiveEvent(event);
  const capacity = event.availableCapacity;
  const hasCapacity = capacity !== null && capacity !== undefined;
  const full = hasCapacity && capacity <= 0;
  const soon = live ? null : startsInLabel(event.startTime);

  return (
    <article data-live={live} className="event-card relative flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        {live ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-live">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inset-0 animate-ping rounded-full bg-live/60 motion-reduce:hidden" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-live" />
            </span>
            En vivo
          </span>
        ) : (
          <span className="font-program text-2xl font-extrabold leading-none tracking-[-0.02em] tabular-nums text-ink">
            {formatEventTime(event.startTime)}
          </span>
        )}
        <span className="flex min-w-0 items-center gap-1.5 pt-0.5 text-xs text-ink-subtle">
          <span className="truncate">{CATEGORY_LABELS[event.category] ?? event.category}</span>
          <span aria-hidden="true">·</span>
          <span className="flex-shrink-0 tabular-nums">{priceLabel(event.price)}</span>
        </span>
      </div>
      {soon && <p className="mt-1.5 text-xs font-medium text-accent-ink">{soon}</p>}

      {/* El enlace del título se extiende a toda la tarjeta; los botones quedan por encima. */}
      <h4
        className="mt-4 line-clamp-2 font-program text-xl font-bold leading-[1.08] tracking-[-0.015em] text-ink sm:text-[1.35rem]"
        title={event.title}
      >
        <Link href={`/eventos/${event.id}`} className="rounded-control after:absolute after:inset-0 after:rounded-card">
          {event.title}
        </Link>
      </h4>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">{event.description}</p>

      <dl className="mt-4 space-y-1.5 text-sm text-ink-muted">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-subtle" aria-hidden="true" />
          <dt className="sr-only">Lugar</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere]">
            {placeName && <span className="font-medium text-ink">{placeName}</span>}
            {placeName && event.specificLocation && ' · '}
            {event.specificLocation}
          </dd>
        </div>
        <div className="flex items-center gap-2 pl-6 tabular-nums">
          <dt className="sr-only">Horario</dt>
          <dd>
            {formatEventTime(event.startTime)} – {formatEventTime(event.endTime)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex min-h-9 items-center justify-between gap-3 pt-5">
        <span className={`flex items-center gap-1.5 text-xs ${full ? 'font-semibold text-accent-ink' : 'text-ink-muted'}`}>
          {hasCapacity ? (
            <>
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {capacityLabel(capacity)}
            </>
          ) : (
            'Acceso libre'
          )}
        </span>

        {registered ? (
          <span className="relative inline-flex items-center gap-1.5 text-xs font-semibold text-live">
            <Check className="h-4 w-4" aria-hidden="true" />
            Inscrito
          </span>
        ) : (
          event.requiresRegistration &&
          onRegister &&
          !full && (
            <Button size="sm" className="relative" disabled={registering} onClick={() => onRegister(event.id)}>
              Inscribirme
            </Button>
          )
        )}
      </div>
    </article>
  );
};
