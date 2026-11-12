'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useDragControls, type PanInfo } from 'motion/react';
import { Building2, Clock, Layers, MapPin, Trophy, X } from 'lucide-react';
import { CampusPoint, isLiveEvent } from '../../lib/map/map-service';
import { useMediaQuery, useReducedMotion } from '../../lib/use-media-query';
import { formatEventDate, formatEventTime } from '../../lib/utils';
import { Badge } from '../ui/Chip';

interface PointCardProps {
  point: CampusPoint;
  onClose: () => void;
}

const MAX_EVENTS = 3;
/** Cuánto hay que arrastrar la hoja hacia abajo para cerrarla... */
const DISMISS_DISTANCE = 110;
/** ...o a qué velocidad (px/s): un empujón rápido basta aunque sea corto. */
const DISMISS_VELOCITY = 500;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Ficha de un punto del mapa.
 * Escritorio: tarjeta lateral. Celular: hoja inferior que se arrastra con el dedo y se cierra
 * con un empujón hacia abajo (la misma dirección por la que entró).
 */
export const PointCard: React.FC<PointCardProps> = ({ point, onClose }) => {
  const isBuilding = point.kind === 'EDIFICIO';
  const events = point.events.slice(0, MAX_EVENTS);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const reducedMotion = useReducedMotion();
  const dragControls = useDragControls();

  const showImage = Boolean(point.imageUrl) && failedImageUrl !== point.imageUrl;

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [point.id]);

  const handleDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) onClose();
  };

  // Con "reducir movimiento" no hay desplazamiento: solo un fundido corto.
  const entrance = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : isDesktop
      ? {
          initial: { opacity: 0, x: -8 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -8 },
          transition: { duration: 0.2, ease: EASE_OUT },
        }
      : {
          initial: { y: '100%' },
          animate: { y: 0 },
          exit: { y: '100%' },
          transition: { type: 'spring' as const, duration: 0.4, bounce: 0 },
        };

  return (
    <motion.aside
      role="dialog"
      aria-label={`Detalle de ${point.name}`}
      {...entrance}
      drag={isDesktop || reducedMotion ? false : 'y'}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.05, bottom: 1 }}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      className="absolute inset-x-0 bottom-0 z-30 flex max-h-[75%] flex-col rounded-t-card border border-line-strong bg-surface shadow-float md:inset-x-auto md:bottom-auto md:left-3 md:top-14 md:max-h-[calc(100%-11.5rem)] md:w-80 md:rounded-card"
    >
      {/* Asa para arrastrar: solo en celular. Ahí se captura el gesto; el contenido sigue desplazándose. */}
      <div
        className="flex h-6 flex-shrink-0 cursor-grab touch-none items-center justify-center md:hidden"
        onPointerDown={(event) => dragControls.start(event)}
        aria-hidden="true"
      >
        <span className="h-1 w-9 rounded-full bg-line-strong" />
      </div>

      <div className="overflow-y-auto overscroll-contain p-4 pt-1 md:pt-4">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-xs font-medium text-ink-muted">
            {isBuilding ? <Building2 className="h-4 w-4" aria-hidden="true" /> : <Trophy className="h-4 w-4" aria-hidden="true" />}
            <span>{point.code}</span>
            <span aria-hidden="true">·</span>
            <span>{isBuilding ? 'Edificio' : 'Escenario deportivo'}</span>
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="pressable -mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-control text-ink-muted transition-colors duration-fast ease-out hover:bg-surface-raised hover:text-ink"
            aria-label="Cerrar ficha"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {showImage && point.imageUrl && (
          <div className="mt-2 overflow-hidden rounded-control bg-canvas">
            <img
              src={point.imageUrl}
              alt={`Fotografía de ${point.name}`}
              loading="lazy"
              onError={() => setFailedImageUrl(point.imageUrl ?? null)}
              className="h-28 w-full object-cover"
            />
          </div>
        )}

        <h3 className="mt-3 text-lg font-semibold leading-snug text-ink [overflow-wrap:anywhere]">{point.name}</h3>
        {point.description && <p className="mt-1 text-sm leading-relaxed text-ink-muted">{point.description}</p>}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {isBuilding && point.floorsCount !== undefined && point.floorsCount > 1 && (
            <Badge>
              <Layers className="h-3 w-3" aria-hidden="true" /> {point.floorsCount} pisos
            </Badge>
          )}
          {point.sportTypes.map((sport) => (
            <Badge key={sport}>{sport}</Badge>
          ))}
          {point.services.map((service) => (
            <span key={service.id} title={service.operatingHours ?? undefined}>
              <Badge>{service.name}</Badge>
            </span>
          ))}
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <h4 className="text-xs font-medium text-ink-muted">Actividades aquí</h4>
          {events.length === 0 ? (
            <p className="mt-2 text-sm text-ink-subtle">No hay actividades programadas en este lugar.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {events.map((event) => (
                <li key={event.id} className="rounded-control bg-surface-raised p-3">
                  <div className="flex items-center gap-2 text-xs">
                    {isLiveEvent(event) ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-live">
                        <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden="true" /> En vivo
                      </span>
                    ) : (
                      <span className="text-ink-muted">{formatEventDate(event.startTime)}</span>
                    )}
                    <span className="inline-flex items-center gap-1 tabular-nums text-ink-muted">
                      <Clock className="h-3 w-3" aria-hidden="true" /> {formatEventTime(event.startTime)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-ink">{event.title}</p>
                  <p className="mt-0.5 flex items-start gap-1 text-xs text-ink-muted [overflow-wrap:anywhere]">
                    <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" aria-hidden="true" /> {event.specificLocation}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {point.events.length > MAX_EVENTS && (
            <p className="mt-2 text-xs text-ink-subtle">y {point.events.length - MAX_EVENTS} más</p>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Link
            href={`/?edificio=${encodeURIComponent(point.code)}#radar`}
            className="rounded-control text-sm font-medium text-accent-ink transition-colors duration-fast ease-out hover:text-ink"
          >
            Ver actividades en este lugar →
          </Link>
        </div>
      </div>
    </motion.aside>
  );
};
