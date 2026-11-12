'use client';

import React from 'react';
import { Maximize2, RotateCcw } from 'lucide-react';
import type { PointFilter } from '../../lib/map/map-service';
import { cn } from '../../lib/utils';
import { FILTERS, MapView, VIEWS } from './map-config';

/** Superficie translúcida que flota sobre el mapa. */
const floating = 'border border-line-strong bg-canvas/85 backdrop-blur-md';

interface LiveStatusProps {
  liveTotal: number;
  /** Los datos son de ejemplo, no del backend. */
  demo: boolean;
}

/** Cuántas actividades hay en vivo ahora. */
export function LiveStatus({ liveTotal, demo }: LiveStatusProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink', floating)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', liveTotal > 0 ? 'bg-live' : 'bg-ink-subtle')} aria-hidden="true" />
      {liveTotal > 0 ? `${liveTotal} en vivo` : 'Sin actividad en vivo'}
      {demo && <span className="text-ink-muted">· datos de ejemplo</span>}
    </span>
  );
}

interface ViewSwitchProps {
  view: MapView;
  onChange: (view: MapView) => void;
}

/** Selector de vista: Normal, Satélite o 3D. */
export function ViewSwitch({ view, onChange }: ViewSwitchProps) {
  return (
    <div className={cn('inline-flex rounded-full p-0.5', floating)} role="group" aria-label="Vista del mapa">
      {VIEWS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={view === option.value}
          className={cn(
            'pressable min-h-8 rounded-full px-3 text-xs font-medium transition-colors duration-fast ease-out',
            view === option.value ? 'bg-ink text-canvas' : 'text-ink-muted hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface LegendProps {
  filter: PointFilter;
  onFilter: (filter: PointFilter) => void;
  onFitAll: () => void;
  /** Muestra "Enderezar" solo cuando el mapa está girado. */
  rotated: boolean;
  onStraighten: () => void;
}

const chip = 'pressable inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors duration-fast ease-out';

/** Filtro por tipo de lugar y atajos de encuadre. */
export function MapLegend({ filter, onFilter, onFitAll, rotated, onStraighten }: LegendProps) {
  return (
    <div className={cn('absolute bottom-10 left-3 z-20 max-w-[calc(100%-4rem)] rounded-card p-2', floating)}>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar puntos del mapa">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onFilter(option.value)}
            aria-pressed={filter === option.value}
            className={cn(chip, filter === option.value ? 'bg-ink text-canvas' : 'bg-surface-raised text-ink-muted hover:text-ink')}
          >
            {option.label}
          </button>
        ))}
        <button type="button" onClick={onFitAll} className={cn(chip, 'bg-surface-raised text-ink-muted hover:text-ink')}>
          <Maximize2 className="h-3 w-3" aria-hidden="true" /> Ver todo
        </button>
        {rotated && (
          <button type="button" onClick={onStraighten} className={cn(chip, 'bg-surface-raised text-ink-muted hover:text-ink')}>
            <RotateCcw className="h-3 w-3" aria-hidden="true" /> Enderezar
          </button>
        )}
      </div>
    </div>
  );
}
