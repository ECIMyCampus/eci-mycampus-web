'use client';

import React, { useState } from 'react';
import { Building2, Trophy } from 'lucide-react';
import type { CampusPoint } from '../../lib/map/map-service';
import { countLabel } from '../../lib/radar/radar-service';
import { cn } from '../../lib/utils';

interface PlaceListProps {
  points: CampusPoint[];
  selectedId: string | null;
  /** Los datos del mapa todavía no llegan. */
  loading: boolean;
  onSelect: (id: string) => void;
  /** Resalta el pin del mapa mientras se apunta al lugar en la lista. */
  onHover: (id: string | null) => void;
}

/** Lista de lugares sincronizada con el mapa: elegir uno lo centra y abre su ficha. */
export function PlaceList({ points, selectedId, loading, onSelect, onHover }: PlaceListProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <ul
      className="scrollbar-none flex gap-2 overflow-x-auto pb-1 lg:max-h-[650px] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0"
      aria-label="Lugares del campus"
    >
      {loading && (
        <li role="status" className="rounded-card border border-line bg-surface p-3 text-sm text-ink-muted">
          Cargando lugares del campus…
        </li>
      )}
      {points.map((point) => {
        const showImage = Boolean(point.imageUrl) && !failedImages[point.id];
        const selected = point.id === selectedId;
        return (
          <li key={point.id} className="flex-shrink-0">
            <button
              type="button"
              onClick={() => onSelect(point.id)}
              onMouseEnter={() => onHover(point.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(point.id)}
              onBlur={() => onHover(null)}
              aria-current={selected ? 'true' : undefined}
              className={cn(
                'pressable flex min-h-touch w-56 items-center gap-3 rounded-card border p-2.5 text-left transition-colors duration-fast ease-out lg:w-full',
                selected ? 'border-accent-ink bg-surface-raised' : 'border-line bg-surface hover:border-line-strong',
              )}
            >
              {showImage && point.imageUrl ? (
                <img
                  src={point.imageUrl}
                  alt=""
                  loading="lazy"
                  onError={() => setFailedImages((prev) => ({ ...prev, [point.id]: true }))}
                  className="h-10 w-10 flex-shrink-0 rounded-control object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-control bg-surface-raised text-ink-muted">
                  {point.kind === 'EDIFICIO' ? <Building2 className="h-4 w-4" aria-hidden="true" /> : <Trophy className="h-4 w-4" aria-hidden="true" />}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{point.name}</span>
                <span className={cn('block text-xs', point.liveCount > 0 ? 'text-live' : 'text-ink-muted')}>
                  {point.liveCount > 0
                    ? `${point.liveCount} en vivo`
                    : point.events.length > 0
                      ? countLabel(point.events.length)
                      : 'Sin actividades'}
                </span>
              </span>
            </button>
          </li>
        );
      })}
      {!loading && points.length === 0 && (
        <li className="rounded-card border border-line bg-surface p-3 text-sm text-ink-muted">No hay lugares para este filtro.</li>
      )}
    </ul>
  );
}
