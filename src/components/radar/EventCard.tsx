import React from 'react';
import { ArrowRight, Clock, MapPin, Users } from 'lucide-react';
import { CampusEvent } from '../../types';
import { isLiveEvent } from '../../lib/map/map-service';
import { CATEGORY_LABELS, capacityLabel, priceLabel } from '../../lib/radar/radar-service';
import { formatEventDate, formatEventTime } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Chip';

interface EventCardProps {
  event: CampusEvent;
  /** Nombre legible del lugar. Si falta se muestra solo la ubicación específica. */
  placeName?: string;
  onRegister?: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, placeName, onRegister }) => {
  const live = isLiveEvent(event);
  const capacity = event.availableCapacity;
  const hasCapacity = capacity !== null && capacity !== undefined;
  const full = hasCapacity && capacity <= 0;

  return (
    <Card as="article" className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {live ? (
            <Badge tone="live">
              <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden="true" />
              En vivo
            </Badge>
          ) : (
            <Badge>{formatEventDate(event.startTime)}</Badge>
          )}
          <Badge>{CATEGORY_LABELS[event.category] ?? event.category}</Badge>
        </div>
        <span className="flex-shrink-0 text-xs font-medium tabular-nums text-ink-muted">{priceLabel(event.price)}</span>
      </div>

      <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-snug text-ink" title={event.title}>
        {event.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{event.description}</p>

      <dl className="mt-3 space-y-1.5 text-xs text-ink-muted">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-subtle" aria-hidden="true" />
          <dt className="sr-only">Lugar</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere]">
            {placeName && <span className="font-medium text-ink">{placeName}</span>}
            {placeName && event.specificLocation && ' · '}
            {event.specificLocation}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 flex-shrink-0 text-ink-subtle" aria-hidden="true" />
          <dt className="sr-only">Horario</dt>
          <dd className="tabular-nums">
            {formatEventTime(event.startTime)} – {formatEventTime(event.endTime)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
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

        <div className="flex items-center gap-2">
          {event.requiresRegistration && onRegister && !full && (
            <Button size="sm" onClick={() => onRegister(event.id)}>
              Inscribirme
            </Button>
          )}
          <Button href={`/eventos/${event.id}`} variant="secondary" size="sm" iconOnly aria-label={`Ver detalles de ${event.title}`}>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
